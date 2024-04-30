import multer from "multer"
import generateUniqueString from "../Utlis/generate-uniqueString.js"
import { allowedExtensions } from "../Utlis/allowed-extensions.js"



// Middleware function for handling file uploads with Multer
export const multerMiddleHost = ({
    extensions = allowedExtensions.image, // Default extensions are set to image extensions
}) => {
    // Configuring disk storage for Multer
    const storage = multer.diskStorage({ 
        filename: (req, file, cb) => {
            // Generating a unique filename
            const uniqueFileName = generateUniqueString(6) + '_' + file.originalname;
            cb(null, uniqueFileName); // Passing the unique filename to Multer
        } 
    });
    
    // File filter function to check if the uploaded file has an allowed extension
    const fileFilter = (req, file, cb) => {
        // Checking if the file extension is included in the allowed extensions array
        if (extensions.includes(file.mimetype.split('/')[1])) {
            return cb(null, true); // Allowing the file if its extension is allowed
        }
        cb(new Error('image format is not allowed'), false); // Otherwise, rejecting the file upload
    };

    // Creating a Multer instance with the configured file filter and storage
    const file = multer({ fileFilter, storage });

    return file; // Returning the configured Multer instance
};


