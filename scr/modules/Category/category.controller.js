import slugify from "slugify";
import Category from "../../../DB/models/category.model.js";
import generateUniqueString from '../../Utlis/generate-uniqueString.js'
import cloudinaryConnection from '../../Utlis/cloudinary.js'
import subCategory from "../../../DB/models/sub-category.model.js";
import Brand from "../../../DB/models/brand.model.js";
import { APIFeatures } from "../../Utlis/api-features.js";

export const addCategory = async (req, res, next) => {

    // 1- destructuring the request body

    const { name } = req.body
    const { _id } = req.authUser

    // 2- check if the category name is already exist
    const isNameDuplicate = await Category.findOne({ name })
    if (isNameDuplicate) {
        return next(new Error('name is not exists,Please try another name', { cause: 409 }))
    }
    // 3- generate the slug

    const slug = slugify(name, '-')

    // 4- upload image to cloudinary

    if (!req.file) return next({ cause: 400, message: 'Image is required' })

    const folder_Id = generateUniqueString(5)
    const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(req.file.path, {
        folder: `${process.env.MAIN_FOLDER}/Categories/${folder_Id}`
    })
    console.log(`${process.env.MAIN_FOLDER}/Categories/${folder_Id}`);
    req.folder = `${process.env.MAIN_FOLDER}/Categories/${folder_Id}`




    const category = {
        name,
        slug,
        image: { public_id, secure_url },
        folder_Id,
        addedBy: _id

    }

    const newCategory = await Category.create(category)

    req.savedDocument = { model: Category, _id: newCategory._id }
  

    res.status(201).json({ success: true, message: 'Category created successfully', data: newCategory })

}
export const updatedCategory = async (req, res, next) => {

    // 1- data from destructuring the request body 
    const { name, oldPublicId } = req.body
    //2 check autherization
    const { _id } = req.authUser
    const { categoryId } = req.params
    //check is categoryId is exists
    const category = await Category.findById(categoryId)
    if (!category) return next({ cause: 404, message: 'Category not found' })

    if (name) {
        // check if the new category name different from the old name
        if (name == category.name) {
            return next({ cause: 400, message: 'Please enter different category name from the existing one.' })
        }

        //  check if the new category name is already exist
        const isNameDuplicated = await Category.findOne({ name })
        if (isNameDuplicated) {
            return next({ cause: 409, message: 'Category name is already exist' })
        }

        //  update the category name and the category slug
        category.name = name
        category.slug = slugify(name, '-')
    }


    //  check if the user want to update the image
    if (oldPublicId) {
        if (!req.file) return next({ cause: 400, message: 'Image is required' })

        const newPulicId = oldPublicId.split(`${category.folder_Id}/`)[1]

        const { secure_url } = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: `${process.env.MAIN_FOLDER}/Categories/${category.folder_Id}`,
            public_id: newPulicId
        })

        category.image.secure_url = secure_url
    }


    //  set value for the updatedBy field
    category.updatedBy = _id

    await category.save()
    res.status(200).json({ success: true, message: 'Category updated successfully', data: category })
}
export const getAllCategories = async (req, res, next) => {

    const { page, size, sort, ...search } = req.query
    const features = new APIFeatures(req.query, Category.find())
        .pagination({ page, size })
        .sort( sort )
        .search(search)

        
    const categories = await features.mongooseQuery.populate([{
        path: 'subCategories',
        populate: ([{
            path: 'Brands',
            populate: ([{
                path: 'products'
            }])
        }])
    }])
    res.status(200).json({ success: true, message: 'Categories fetched successfully', data: categories })

}
export const deleteCategory = async (req, res, next) => {

    const { categoryId } = req.params

    const category = await Category.findByIdAndDelete(categoryId)

    if (!category) return next({ cause: 404, message: 'category not found' })

    const subCategories = await subCategory.deleteMany({ categoryId })

    if (subCategories.deletedCount < 0) {
        console.log('there is no related subCategory');
    }

    const brand = await Brand.deleteMany({ categoryId })
    if (brand.deletedCount < 0) {
        console.log('there is no related category');
    }

    await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${category.folder_Id}`)
    await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${category.folder_Id}`)

    res.status(200).json({ success: true, message: 'category deleted successfully' })


}
export const getCategoryById = async (req, res, next) => {
    const {categoryId} = req.params
    
    const category = await Category.findById(categoryId)
    if (!category) return next({ cause: 404, message: 'Category not found' })
    res.status(200).json({ success: true, message: 'Category fetched successfully', data: category })
}