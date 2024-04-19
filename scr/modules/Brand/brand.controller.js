
import slugify from "slugify";
import Brand from "../../../DB/models/brand.model.js";
import subCategory from "../../../DB/models/sub-category.model.js";
import cloudinaryConnection from "../../Utlis/cloudinary.js";
import generateUniqueString from "../../Utlis/generate-uniqueString.js";
import Product from "../../../DB/models/product.model.js";
import { APIFeatures } from "../../Utlis/api-features.js";





export const addBrand = async (req, res, next) => {
    const { name } = req.body
    const { _id } = req.authUser
    const { categoryId, subCategoryId } = req.query

    const subCategoryCheck = await subCategory.findById(subCategoryId).populate('categoryId', 'folder_Id')
    if (!subCategoryCheck) return next({ message: 'subcategory is note found', cause: 404 })

    const isBrandExist = await Brand.findOne({ name, subCategoryId })
    if (isBrandExist) return next({ message: 'brand is alrady exists from this subCategory', cause: 404 })

    if (categoryId != subCategoryCheck.categoryId._id) return next({ message: 'category is not found', cause: 404 })

    const slug = slugify(name, '-')

    if (!req.file) return next({ message: 'please uplode brand logo', cause: 404 })

    const folder_Id = generateUniqueString(5)

    const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(req.file.path, {
        folder: `${process.env.MAIN_FOLDER}/Categories/${subCategoryCheck.categoryId.folder_Id}/subCategory/${subCategoryCheck.folder_Id}/brand/${folder_Id}`
    })

    const subCategoryObject = {
        name,
        slug,
        image: { public_id, secure_url },
        folder_Id,
        addedBy: _id,
        subCategoryId,
        categoryId
    }

    const newBrand = await Brand.create(subCategoryObject)
    res.status(201).json({
        status: 'success',
        message: 'brand addedd successfuly',
        data: newBrand
    })
}

export const updateBrand = async (req, res, next) => {


    // 1- data from destructuring the request body 
    const { name, oldPublicId } = req.body
    //2 check autherization
    const { _id } = req.authUser
    const { brandId } = req.params
    //check is categoryId is exists
    const brand = await Brand.findById(brandId).populate(['categoryId', 'subCategoryId'])
    if (!brand) return next({ cause: 404, message: 'Brand not found' })

    if (name) {
        // check if the new category name different from the old name
        if (name == brand.name) {
            return next({ cause: 400, message: 'Please enter different brand name from the existing one.' })
        }

        //  check if the new category name is already exist
        const isNameDuplicated = await Brand.findOne({ name })
        if (isNameDuplicated) {
            return next({ cause: 409, message: 'Brand name is already exist' })
        }

        //  update the category name and the category slug
        brand.name = name
        brand.slug = slugify(name, '-')
    }


    //  check if the user want to update the image
    if (oldPublicId) {
        if (!req.file) return next({ cause: 400, message: 'Image is required' })

        const newPulicId = oldPublicId.split(`${brand.folder_Id}/`)[1]
        console.log(newPulicId);

        const { secure_url } = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: `${process.env.MAIN_FOLDER}/Categories/${brand.categoryId.folder_Id}/subCategory/${brand.subCategoryId.folder_Id}/brand${brand.folder_Id}`,

            public_id: newPulicId
        })

        brand.image.secure_url = secure_url
        console.log(brand.image.secure_url);
    }


    //  set value for the updatedBy field
    brand.updatedBy = _id

    await brand.save()
    res.status(200).json({ success: true, message: 'Brand updated successfully', data: brand })
}

export const deleteBrand = async (req, res, next) => {

    const { brandId } = req.params

    const brand = await Brand.findByIdAndDelete(brandId).populate('categoryId subCategoryId')

    if (!brand) return next({ cause: 404, message: 'brand not found' })

    const product = await Product.deleteMany({ brandId })

    if (product.deletedCount < 0) {
        console.log('there is no related product');
    }

    await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${brand.categoryId.folder_Id}/subCategory/${brand.subCategoryId.folder_Id}/brand${brand.folder_Id}`)
    await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${brand.categoryId.folder_Id}/subCategory/${brand.subCategoryId.folder_Id}/brand${brand.folder_Id}`)

    res.status(200).json({ success: true, message: 'brand deleted successfully' })

}
export const getAllBrands = async (req, res, next) => {
    
    const { page, size, sort, ...search } = req.query
    const features = new APIFeatures(req.query, Brand.find())
        .pagination({ page, size })
        .sort( sort )
        .search(search)

        
    const brands = await features.mongooseQuery.populate([{
        path: 'products'

    }])
    if (!brands.length) return next({ cause: 404, message: 'brand fetched Filed' })
    
    res.status(200).json({ success: true, message: 'brand fetched successfully', data: brands })

}

export const getAllBrandForSpecificSubCategory = async (req, res, next) => {

    const { subCategoryId } = req.params
    const getAll = await Brand.find({ subCategoryId })
    if (!getAll.length) return next({ cause: 404, message: 'brand fetched Filed' })

    res.status(200).json({ success: true, message: 'brand fetched successfully', data: getAll })

}


export const getAllBrandForSpecificCategory = async (req, res, next) => {

    const { categoryId } = req.params


    const getAll = await Brand.find( {categoryId })
    if (!getAll.length) return next({ cause: 404, message: 'brand fetched Filed' })

    res.status(200).json({ success: true, message: 'brand fetched successfully', data: getAll })

}





