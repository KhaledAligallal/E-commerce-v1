import subCategory from "../../../DB/models/sub-category.model.js";
import Category from "../../../DB/models/category.model.js";
import slugify from "slugify";
import cloudinaryConnection from "../../Utlis/cloudinary.js";
import generateUniqueString from "../../Utlis/generate-uniqueString.js";
import Brand from "../../../DB/models/brand.model.js";
import { APIFeatures } from "../../Utlis/api-features.js";

export const addSubCategory = async (req, res, next) => {

    // 1- destructuring the request body

    const { name } = req.body
    const { _id } = req.authUser
    const { categoryId } = req.params
    // 2- check if the subcategory name is already exist
    const isNameDuplicate = await subCategory.findOne({ name })
    if (isNameDuplicate) {
        return next(new Error('name is alrady exists,Please try another name', { cause: 409 }))
    }
    // 3- generate the slug
    const category = await Category.findById(categoryId)

    if (!category) {
        return next(new Error('name is not exists,Please try another name', { cause: 409 }))
    }

    const slug = slugify(name, '-')


    // 4- upload image to cloudinary

    if (!req.file) return next({ cause: 400, message: 'Image is required' })

    const folder_Id = generateUniqueString(5)
    const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(req.file.path, {
        folder: `${process.env.MAIN_FOLDER}/Categories/${category.folder_Id}/subCategory/${folder_Id}`
    })


    const SubCategory = {
        name,
        slug,
        image: { public_id, secure_url },
        folder_Id,
        addedBy: _id,
        categoryId
    }

    const newSubCategory = await subCategory.create(SubCategory)
    res.status(201).json({ success: true, message: 'Category created successfully', data: newSubCategory })

}

export const updatedSubCategory = async (req, res, next) => {

    // 1- data from destructuring the request body 
    const { name, oldPublicId } = req.body
    //2 check autherization
    const { _id } = req.authUser
    const { subCategoryId } = req.params
    //check is categoryId is exists
    const isSubCategoryExists = await subCategory.findById(subCategoryId).populate('categoryId')
    if (!isSubCategoryExists) return next({ cause: 404, message: 'Category not found' })

    if (name) {
        // check if the new category name different from the old name
        if (name == isSubCategoryExists.name) {
            return next({ cause: 400, message: 'Please enter different category name from the existing one.' })
        }

        //  check if the new category name is already exist
        const isNameDuplicated = await subCategory.findOne({ name })
        if (isNameDuplicated) {
            return next({ cause: 409, message: 'Category name is already exist' })
        }

        //  update the category name and the category slug
        isSubCategoryExists.name = name
        isSubCategoryExists.slug = slugify(name, '-')
    }


    //  check if the user want to update the image
    if (oldPublicId) {
        if (!req.file) return next({ cause: 400, message: 'Image is required' })

        const newPulicId = oldPublicId.split(`${isSubCategoryExists.folder_Id}/`)[1]


        const { secure_url } = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: `${process.env.MAIN_FOLDER}/Categories/${isSubCategoryExists.categoryId.folder_Id}/subCategory/${isSubCategoryExists.folder_Id}`,

            public_id: newPulicId
        })

        isSubCategoryExists.image.secure_url = secure_url

    }


    //  set value for the updatedBy field
    isSubCategoryExists.updatedBy = _id

    await isSubCategoryExists.save()
    res.status(200).json({ success: true, message: 'Category updated successfully', data: isSubCategoryExists })
}

export const deleteSubCategory = async (req, res, next) => {

    const { subCategoryId } = req.params

    const isSubCategoryExists = await subCategory.findByIdAndDelete(subCategoryId).populate('categoryId')

    if (!isSubCategoryExists) return next({ cause: 404, message: 'subCategory not found' })

    const brand = await Brand.deleteMany({ subCategoryId })
    if (brand.deletedCount < 0) {
        console.log('there is no related category');
    }

    await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${isSubCategoryExists.categoryId.folder_Id}/subCategory/${isSubCategoryExists.folder_Id}`)
    await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${isSubCategoryExists.categoryId.folder_Id}/subCategory/${isSubCategoryExists.folder_Id}`)

    res.status(200).json({ success: true, message: 'subCategory deleted successfully' })

}

export const getAllSubCategories = async (req, res, next) => {

    const { page, size, sort, ...search } = req.query
    const features = new APIFeatures(req.query, subCategory.find())
        .pagination({ page, size })
        .sort(sort)
        .search(search)


    const allSubCategories = await features.mongooseQuery.populate([{
        path: 'Brands'

    }])
    res.status(200).json({ success: true, message: 'subCategories fetched successfully', data: allSubCategories })

}

export const getAllSubCategoriesForSpecificCategory = async (req, res, next) => {

    const { categoryId } = req.params


    const getAll = await subCategory.find({ categoryId })
    if (!getAll) return next({ cause: 404, message: 'Category not found' })

    res.status(200).json({ success: true, message: 'Categories fetched successfully', data: getAll })

}

export const getSubCategoryById = async (req, res, next) => {
    const { subCategoryId } = req.params

    const SubCategory = await subCategory.findById(subCategoryId)
    if (!SubCategory) return next({ cause: 404, message: 'subCategory not found' })

    res.status(200).json({ success: true, message: 'subCategories fetched successfully', data: SubCategory })
}