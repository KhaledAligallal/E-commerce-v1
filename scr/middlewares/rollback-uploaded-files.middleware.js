
import cloudinaryConection from "../Utlis/cloudinary.js";

// Middleware function to rollback uploaded files in case of an error
export const rollbackUploadedFiles = async (req, res, next) => {
    // Checking if there's a folder in the request object
    if (req.folder) {
        // Logging the rollback action
        console.log('rollbackUploadedFiles');

        // Deleting resources (files) uploaded to Cloudinary with the specified folder prefix
        await cloudinaryConection().api.delete_resources_by_prefix(req.folder);

        // Deleting the folder itself from Cloudinary
        await cloudinaryConection().api.delete_folder(req.folder);
    }

    // Proceeding to the next middleware or route handler
    next();
};
