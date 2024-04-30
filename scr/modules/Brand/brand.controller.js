
import slugify from "slugify";
import Brand from "../../../DB/models/brand.model.js";
import subCategory from "../../../DB/models/sub-category.model.js";
import cloudinaryConnection from "../../Utlis/cloudinary.js";
import generateUniqueString from "../../Utlis/generate-uniqueString.js";
import Product from "../../../DB/models/product.model.js";
import { APIFeatures } from "../../Utlis/api-features.js";



// Controller function to add a new brand
export const addBrand = async (req, res, next) => {
    // Extracting required data from the request object
    const { name } = req.body; // Brand name
    const { _id } = req.authUser; // ID of the authenticated user
    const { categoryId, subCategoryId } = req.query; // IDs of the category and subcategory

    // Checking if the subcategory exists and retrieving its details
    const subCategoryCheck = await subCategory.findById(subCategoryId).populate('categoryId', 'folder_Id');
    if (!subCategoryCheck) return next({ message: 'subcategory is not found', cause: 404 });

    // Checking if the brand already exists for this subcategory
    const isBrandExist = await Brand.findOne({ name, subCategoryId });
    if (isBrandExist) return next({ message: 'brand already exists for this subcategory', cause: 404 });

    // Checking if the specified category matches the category of the subcategory
    if (categoryId != subCategoryCheck.categoryId._id) return next({ message: 'category is not found', cause: 404 });

    // Creating a slug for the brand name
    const slug = slugify(name, '-');

    // Checking if a file is uploaded (brand logo)
    if (!req.file) return next({ message: 'please upload brand logo', cause: 404 });

    // Generating a unique folder ID for the brand
    const folder_Id = generateUniqueString(5);

    // Uploading the brand logo to Cloudinary
    const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(req.file.path, {
        folder: `${process.env.MAIN_FOLDER}/Categories/${subCategoryCheck.categoryId.folder_Id}/subCategory/${subCategoryCheck.folder_Id}/brand/${folder_Id}`
    });

    // Creating a new brand object
    const subCategoryObject = {
        name,
        slug,
        image: { public_id, secure_url },
        folder_Id,
        addedBy: _id,
        subCategoryId,
        categoryId
    };

    // Saving the new brand to the database
    const newBrand = await Brand.create(subCategoryObject);

    // Sending a success response
    res.status(201).json({
        status: 'success',
        message: 'brand added successfully',
        data: newBrand
    });
};

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
// Controller function to delete a brand
export const deleteBrand = async (req, res, next) => {
    // Extracting the brandId from request parameters
    const { brandId } = req.params;

    // Finding and deleting the brand by its ID
    const brand = await Brand.findByIdAndDelete(brandId).populate('categoryId subCategoryId');

    // If brand is not found, return a 404 error
    if (!brand) return next({ cause: 404, message: 'brand not found' });

    // Deleting related products of the brand
    const product = await Product.deleteMany({ brandId });

    // If no products are found related to the brand, log a message
    if (product.deletedCount < 0) {
        console.log('there is no related product');
    }

    // Deleting brand images from Cloudinary
    await cloudinaryConnection().api.delete_resources_by_prefix(`${process.env.MAIN_FOLDER}/Categories/${brand.categoryId.folder_Id}/subCategory/${brand.subCategoryId.folder_Id}/brand${brand.folder_Id}`);
    await cloudinaryConnection().api.delete_folder(`${process.env.MAIN_FOLDER}/Categories/${brand.categoryId.folder_Id}/subCategory/${brand.subCategoryId.folder_Id}/brand${brand.folder_Id}`);

    // Sending a success response
    res.status(200).json({ success: true, message: 'brand deleted successfully' });
};

// Controller function to get all brands with pagination, sorting, and search options
export const getAllBrands = async (req, res, next) => {
    // Extracting pagination, sorting, and search parameters from the request query
    const { page, size, sort, ...search } = req.query;

    // Creating an instance of APIFeatures with the Brand model and request query
    const features = new APIFeatures(req.query, Brand.find())
        .pagination({ page, size })
        .sort(sort)
        .search(search);

    // Executing the query and populating related products
    const brands = await features.mongooseQuery.populate([{ path: 'products' }]);

    // If no brands are found, return a 404 error
    if (!brands.length) return next({ cause: 404, message: 'brand fetched failed' });

    // Sending a success response with fetched brands
    res.status(200).json({ success: true, message: 'brand fetched successfully', data: brands });
};

// Controller function to get all brands for a specific subcategory
export const getAllBrandForSpecificSubCategory = async (req, res, next) => {
    // Extracting subCategoryId from request parameters
    const { subCategoryId } = req.params;

    // Finding all brands for the specified subcategory
    const getAll = await Brand.find({ subCategoryId });

    // If no brands are found, return a 404 error
    if (!getAll.length) return next({ cause: 404, message: 'brand fetched failed' });

    // Sending a success response with fetched brands
    res.status(200).json({ success: true, message: 'brand fetched successfully', data: getAll });
};

// Controller function to get all brands for a specific category
export const getAllBrandForSpecificCategory = async (req, res, next) => {
    // Extracting categoryId from request parameters
    const { categoryId } = req.params;

    // Finding all brands for the specified category
    const getAll = await Brand.find({ categoryId });

    // If no brands are found, return a 404 error
    if (!getAll.length) return next({ cause: 404, message: 'brand fetched failed' });

    // Sending a success response with fetched brands
    res.status(200).json({ success: true, message: 'brand fetched successfully', data: getAll });
};
