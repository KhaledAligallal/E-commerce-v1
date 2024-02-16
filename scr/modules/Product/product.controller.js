import Product from "../../../DB/models/product.model.js";
import cloudinaryConnection from "../../Utlis/cloudinary.js";
import slugify from "slugify";
import generateUniqueString from "../../Utlis/generate-uniqueStrin.js";
import Brand from "../../../DB/models/brand.model.js";
import { systemRoles } from "../../Utlis/system-roles.js";


export const addproduct = async (req, res, next) => {
    // data
    const { title, desc, stock, basePrice, discount, specs } = req.body
    const { brandId, categoryId, subCategoryId } = req.query
    const addedBy = req.authUser._id

    // brand check
    const brand = await Brand.findById(brandId)
    if (!brand) return next({ message: 'Brand not found' })

    if (brand.categoryId.toString() !== categoryId) return next({ message: 'Category not found' })
    if (brand.subCategoryId.toString() !== subCategoryId) return next({ message: 'SubCategory not found' })

    if (
        req.authUser.role !== systemRoles.SUPER_ADMIN &&
        brand.addedBy.toString() !== addedBy.toString()
    ) return next({ message: 'You are not allowed to add product to this brand' })

    // generte the slug
    const slug = slugify(title, { lower: true, replacement: '-' })

    // applied price calculation
    const appliedPrice = basePrice - (basePrice * ((discount || 0) / 100))

    if (!req.files?.length) return next({ message: 'Image is required' })


    // Images uploading
    // ecommerce-project/Categories/4aa3/SubCategories/fhgf/Brands/5asf/z2wgc418otdljbetyotn
    const folder_Id = generateUniqueString(4)
    let Images = []
    const folder = brand.image.public_id.split(`${brand.folder_Id}/`)[0]
    for (const file of req.files) {
        const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(file.path, {
            folder: folder + `${brand.folder_Id}` + `/Products/${folder_Id}`
        })

        Images.push({ secure_url, public_id })
    }
    req.folder = folder + `${brand.folder_Id}` + `/Products/${folder_Id}`

    // generate the product data object
    const product = {
        title, desc, slug, folder_Id, basePrice, discount, appliedPrice,
        stock, addedBy, brandId, subCategoryId, categoryId, Images, specs: JSON.parse(specs)
    }

    // generate new  product in  product collection
    const newProduct = await Product.create(product)
    req.savedDocument = { model: Product, _id: newProduct._id }

    res.status(201).json({ success: true, message: 'Product created successfully', data: newProduct })
}



