import subCategory from "../../../DB/models/sub-category.model.js";
import Category from "../../../DB/models/category.model.js";
import slugify from "slugify";
import cloudinaryConnection from "../../Utlis/cloudinary.js";
import generateUniqueString from "../../Utlis/generate-uniqueString.js";
import Brand from "../../../DB/models/brand.model.js";
import { APIFeatures } from "../../Utlis/api-features.js";
export const addSubCategory = async (req, res, next) => {
    // Destructuring request body and parameters
    const { name } = req.body;
    const { _id } = req.authUser;
    const { categoryId } = req.params;

    // Check if subcategory name already exists
    const isNameDuplicate = await subCategory.findOne({ name });
    if (isNameDuplicate) {
        return next(new Error('Name already exists. Please try another name', { cause: 409 }));
    }

    // Generate slug
    const category = await Category.findById(categoryId);
    if (!category) {
        return next(new Error('Category not found. Please try another name', { cause: 409 }));
    }
    const slug = slugify(name, '-');

    // Upload image to Cloudinary
    if (!req.file) return next({ cause: 400, message: 'Image is required' });
    const folder_Id = generateUniqueString(5);
    const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(req.file.path, {
        folder: `${process.env.MAIN_FOLDER}/Categories/${category.folder_Id}/subCategory/${folder_Id}`
    });

    // Create subcategory object
    const SubCategory = {
        name,
        slug,
        image: { public_id, secure_url },
        folder_Id,
        addedBy: _id,
        categoryId
    };

    // Create new subcategory in the database
    const newSubCategory = await subCategory.create(SubCategory);
    res.status(201).json({ success: true, message: 'Subcategory created successfully', data: newSubCategory });
};

export const updatedSubCategory = async (req, res, next) => {
    // Destructuring request body, parameters, and auth user
    const { name, oldPublicId } = req.body;
    const { _id } = req.authUser;
    const { subCategoryId } = req.params;

    // Check if subcategory exists
    const isSubCategoryExists = await subCategory.findById(subCategoryId).populate('categoryId');
    if (!isSubCategoryExists) return next({ cause: 404, message: 'Subcategory not found' });

    // Update subcategory name and slug
    if (name) {
        if (name === isSubCategoryExists.name) {
            return next({ cause: 400, message: 'Please enter a different category name from the existing one' });
        }
        const isNameDuplicated = await subCategory.findOne({ name });
        if (isNameDuplicated) {
            return next({ cause: 409, message: 'Category name already exists' });
        }
        isSubCategoryExists.name = name;
        isSubCategoryExists.slug = slugify(name, '-');
    }

    // Check if the user wants to update the image
    if (oldPublicId) {
        if (!req.file) return next({ cause: 400, message: 'Image is required' });
        const newPulicId = oldPublicId.split(`${isSubCategoryExists.folder_Id}/`)[1];
        const { secure_url } = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: `${process.env.MAIN_FOLDER}/Categories/${isSubCategoryExists.categoryId.folder_Id}/subCategory/${isSubCategoryExists.folder_Id}`,
            public_id: newPulicId
        });
        isSubCategoryExists.image.secure_url = secure_url;
    }

    // Update updatedBy field and save changes
    isSubCategoryExists.updatedBy = _id;
    await isSubCategoryExists.save();
    res.status(200).json({ success: true, message: 'Subcategory updated successfully', data: isSubCategoryExists });
};

export const deleteSubCategory = async (req, res, next) => {
    // Get subcategory ID from parameters
    const { subCategoryId } = req.params;

    // Find and delete subcategory by ID
    const isSubCategoryExists = await subCategory.findByIdAndDelete(subCategoryId).populate('categoryId');
    if (!isSubCategoryExists) return next({ cause: 404, message: 'Subcategory not found' });

    // Delete related brands and Cloudinary images
    const brand = await Brand.deleteMany({ subCategoryId });
    if (brand.deletedCount < 0) {
        console.log('There are no related categories');
    }
    await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${isSubCategoryExists.categoryId.folder_Id}/subCategory/${isSubCategoryExists.folder_Id}`);
    await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${isSubCategoryExists.categoryId.folder_Id}/subCategory/${isSubCategoryExists.folder_Id}`);

    res.status(200).json({ success: true, message: 'Subcategory deleted successfully' });
};
export const getAllSubCategories = async (req, res, next) => {
    // Extract query parameters for pagination, sorting, and searching
    const { page, size, sort, ...search } = req.query;

    // Use APIFeatures class to handle pagination, sorting, and searching
    const features = new APIFeatures(req.query, subCategory.find())
        .pagination({ page, size })  // Pagination
        .sort(sort)  // Sorting
        .search(search);  // Searching

    // Execute the MongoDB query and populate the 'Brands' field
    const allSubCategories = await features.mongooseQuery.populate([{ path: 'Brands' }]);
    
    // Send the response with the fetched subcategories
    res.status(200).json({ success: true, message: 'Subcategories fetched successfully', data: allSubCategories });
}

export const getAllSubCategoriesForSpecificCategory = async (req, res, next) => {
    // Extract the categoryId from the request parameters
    const { categoryId } = req.params;

    // Find all subcategories belonging to the specific category
    const getAll = await subCategory.find({ categoryId });

    // If no subcategories are found, return an error response
    if (!getAll) return next({ cause: 404, message: 'Category not found' });

    // Send the response with the fetched subcategories
    res.status(200).json({ success: true, message: 'Categories fetched successfully', data: getAll });
}

export const getSubCategoryById = async (req, res, next) => {
    // Extract the subCategoryId from the request parameters
    const { subCategoryId } = req.params;

    // Find the subcategory by its ID
    const SubCategory = await subCategory.findById(subCategoryId);

    // If the subcategory is not found, return an error response
    if (!SubCategory) return next({ cause: 404, message: 'Subcategory not found' });

    // Send the response with the fetched subcategory
    res.status(200).json({ success: true, message: 'Subcategory fetched successfully', data: SubCategory });
}
