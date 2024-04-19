import Product from "../../../DB/models/product.model.js";
import cloudinaryConnection from "../../Utlis/cloudinary.js";
import slugify from "slugify";
import generateUniqueString from "../../Utlis/generate-uniqueString.js";
import Brand from "../../../DB/models/brand.model.js";
import { systemRoles } from "../../Utlis/system-roles.js";
import { APIFeatures } from "../../Utlis/api-features.js";

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
    const Images = []
    const folder_Id = generateUniqueString(4)
    const folderPath = brand.image.public_id.split(`${brand.folder_Id}/`)[0]
    for (const file of req.files) {
        const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(file.path, {
            folder: folderPath + `${brand.folder_Id}` + `/Products/${folder_Id}`
        })

        Images.push({ secure_url, public_id })
    }
    req.folder = folderPath + `${brand.folder_Id}` + `/Products/${folder_Id}`

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

//================================================= Update product API ============================================//
export const updateProduct = async (req, res, next) => {
    // data from the request body
    const { title, desc, specs, stock, basePrice, discount, oldPublicId } = req.body
    // data for condition
    const { productId } = req.params
    // data from the request authUser
    const addedBy = req.authUser._id


    // prodcuct Id  
    const product = await Product.findById(productId)
    if (!product) return next({ cause: 404, message: 'Product not found' })

    // who will be authorized to update a product
    if (
        req.authUser.role !== systemRoles.SUPER_ADMIN &&
        product.addedBy.toString() !== addedBy.toString()
    ) return next({ cause: 403, message: 'You are not authorized to update this product' })

    // title update
    if (title) {
        product.title = title
        product.slug = slugify(title, { lower: true, replacement: '-' })
    }
    if (desc) product.desc = desc
    if (specs) product.specs = JSON.parse(specs)
    if (stock) product.stock = stock

    // prices changes
    const appliedPrice = (basePrice || product.basePrice) * (1 - ((discount || product.discount) / 100))
    product.appliedPrice = appliedPrice

    if (basePrice) product.basePrice = basePrice
    if (discount) product.discount = discount


    if (oldPublicId) {

        if (!req.file) return next({ cause: 400, message: 'Please select new image' })

        const folderPath = product.Images[0].public_id.split(`${product.folder_Id}/`)[0]
        const newPublicId = oldPublicId.split(`${product.folder_Id}/`)[1]


        const { secure_url } = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: folderPath + `${product.folder_Id}`,
            public_id: newPublicId
        })
        product.Images.map((img) => {
            if (img.public_id === oldPublicId) {
                img.secure_url = secure_url
            }
        })
        req.folder = folderPath + `${product.folder_Id}`
    }

    await product.save()

    res.status(200).json({ success: true, message: 'Product updated successfully', data: product })
}
//================================================= getAllProductsWithPagination product API =================================================//
export const getAllProductsWithPagination = async (req, res, next) => {


    const { page, size, sort, ...search } = req.query
    const features = new APIFeatures(req.query, Product.find())
        .pagination({ page, size })
        //   .sort(sort)
     //   .search(search)
    //  .filters(search)

   
    const products = await features.mongooseQuery
    res.status(200).json({ success: true, data: products })

} 
//===================================== getAllProductsByField=================================//
export const getAllProductsByField = async (req, res, next) => {


    const { page, size, sort, ...search } = req.query
    const features = new APIFeatures(req.query, Product.find())
       // .pagination({ page, size })
        //   .sort(sort)
       .search(search)
    //  .filters(search)

   
    const products = await features.mongooseQuery
    res.status(200).json({ success: true, data: products })

} 

export const allProductsForSpecificBrands = async (req, res, next) => {


    const { page, size, sort, ...search } = req.query
    const features = new APIFeatures(req.query, Product.find())
       // .pagination({ page, size })
        //   .sort(sort)
      // .search(search)
     .filters(search)

   
    const products = await features.mongooseQuery
    res.status(200).json({ success: true, data: products })

} 
//================================================= getSpecificProduct product API =============================================//

export const getSpecificProduct = async (req, res, next) => {

    const { productId } = req.params

    const getProducts = await Product.findById(productId)
    if (!getProducts) return next({ message: 'product is not exists' })

    res.status(200).json({
        success: true,
        data: getProducts
    })

}
//================================================= delete product API =========================================================//
export const deleteProduct = async (req, res, next) => {

    const { productId } = req.params

    const product = await Product.findByIdAndDelete(productId).populate('categoryId subCategoryId brandId')
    if (!product) return next({ cause: 404, message: 'product not found' })

    await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${product.categoryId.folder_Id}/subCategory/${product.subCategoryId.folder_Id}/brand/${product.brandId.folder_Id}/Products/${product.folder_Id}`)
    await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${product.categoryId.folder_Id}/subCategory/${product.subCategoryId.folder_Id}/brand/${product.brandId.folder_Id}/Products/${product.folder_Id}`)
    res.status(200).json({

        success: true,
        message: 'product deleted successfully',

    })



}

