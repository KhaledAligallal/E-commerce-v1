// Importing necessary modules and models
import slugify from "slugify";
import Category from "../../../DB/models/category.model.js";
import generateUniqueString from '../../Utlis/generate-uniqueString.js';
import cloudinaryConnection from '../../Utlis/cloudinary.js';
import subCategory from "../../../DB/models/sub-category.model.js";
import Brand from "../../../DB/models/brand.model.js";
import { APIFeatures } from "../../Utlis/api-features.js";

// Controller function to add a new category
export const addCategory = async (req, res, next) => {
    // Destructuring the request body
    const { name } = req.body;
    const { _id } = req.authUser;

    // Checking if the category name already exists
    const isNameDuplicate = await Category.findOne({ name });
    if (isNameDuplicate) {
        return next(new Error('name is not exists,Please try another name', { cause: 409 }));
    }

    // Generating the slug for the category name
    const slug = slugify(name, '-');

    // Uploading image to Cloudinary
    if (!req.file) return next({ cause: 400, message: 'Image is required' });

    const folder_Id = generateUniqueString(5);
    const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(req.file.path, {
        folder: `${process.env.MAIN_FOLDER}/Categories/${folder_Id}`
    });

    // Creating category object
    const category = {
        name,
        slug,
        image: { public_id, secure_url },
        folder_Id,
        addedBy: _id
    };

    // Saving the new category to the database
    const newCategory = await Category.create(category);

    // Storing the saved document for potential rollback
    req.savedDocument = { model: Category, _id: newCategory._id };

    // Sending a success response
    res.status(201).json({ success: true, message: 'Category created successfully', data: newCategory });
};

// Controller function to update a category
export const updatedCategory = async (req, res, next) => {
    // Destructuring data from the request body
    const { name, oldPublicId } = req.body;
    const { _id } = req.authUser;
    const { categoryId } = req.params;

    // Checking if categoryId exists
    const category = await Category.findById(categoryId);
    if (!category) return next({ cause: 404, message: 'Category not found' });

    if (name) {
        // Checking if the new category name is different from the old one
        if (name == category.name) {
            return next({ cause: 400, message: 'Please enter a different category name from the existing one.' });
        }

        // Checking if the new category name already exists
        const isNameDuplicated = await Category.findOne({ name });
        if (isNameDuplicated) {
            return next({ cause: 409, message: 'Category name is already exist' });
        }

        // Updating the category name and slug
        category.name = name;
        category.slug = slugify(name, '-');
    }

    // Checking if the user wants to update the image
    if (oldPublicId) {
        if (!req.file) return next({ cause: 400, message: 'Image is required' });

        const newPulicId = oldPublicId.split(`${category.folder_Id}/`)[1];

        const { secure_url } = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: `${process.env.MAIN_FOLDER}/Categories/${category.folder_Id}`,
            public_id: newPulicId
        });

        category.image.secure_url = secure_url;
    }

    // Setting value for the updatedBy field
    category.updatedBy = _id;

    // Saving the updated category to the database
    await category.save();

    // Sending a success response
    res.status(200).json({ success: true, message: 'Category updated successfully', data: category });
};

// Controller function to get all categories with pagination, sorting, and searching
export const getAllCategories = async (req, res, next) => {
    // Destructuring query parameters
    const { page, size, sort, ...search } = req.query;

    // Creating an instance of APIFeatures to handle pagination, sorting, and searching
    const features = new APIFeatures(req.query, Category.find())
        .pagination({ page, size })
        .sort(sort)
        .search(search);

    // Executing the mongoose query with pagination, sorting, and searching
    const categories = await features.mongooseQuery.populate([
        {
            path: 'subCategories',
            populate: [
                {
                    path: 'Brands',
                    populate: [
                        {
                            path: 'products'
                        }
                    ]
                }
            ]
        }
    ]);

    // Sending a success response with the fetched categories
    res.status(200).json({ success: true, message: 'Categories fetched successfully', data: categories });
};

// Controller function to delete a category by its ID
export const deleteCategory = async (req, res, next) => {
    // Extracting category ID from request parameters
    const { categoryId } = req.params;

    // Deleting the category by ID
    const category = await Category.findByIdAndDelete(categoryId);

    // Checking if the category exists
    if (!category) return next({ cause: 404, message: 'category not found' });

    // Deleting sub-categories associated with the deleted category
    const subCategories = await subCategory.deleteMany({ categoryId });

    // Logging if there are no related sub-categories
    if (subCategories.deletedCount < 0) {
        console.log('there is no related subCategory');
    }

    // Deleting brands associated with the deleted category
    const brand = await Brand.deleteMany({ categoryId });

    // Logging if there are no related brands
    if (brand.deletedCount < 0) {
        console.log('there is no related category');
    }

    // Deleting category images from Cloudinary
    await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${category.folder_Id}`);
    await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${category.folder_Id}`);

    // Sending a success response
    res.status(200).json({ success: true, message: 'category deleted successfully' });
};

// Controller function to get a category by its ID
export const getCategoryById = async (req, res, next) => {
    // Extracting category ID from request parameters
    const { categoryId } = req.params;

    // Finding the category by ID
    const category = await Category.findById(categoryId);

    // Checking if the category exists
    if (!category) return next({ cause: 404, message: 'Category not found' });

    // Sending a success response with the fetched category
    res.status(200).json({ success: true, message: 'Category fetched successfully', data: category });
};
