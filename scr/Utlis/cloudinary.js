import { v2 as cloudinary } from 'cloudinary';

// Function to establish connection with Cloudinary
const cloudinaryConnection = () => {
    // Configure Cloudinary with environment variables
    cloudinary.config({
        cloud_name: process.env.cloud_name, // Cloudinary cloud name
        api_key: process.env.api_key, // Cloudinary API key
        api_secret: process.env.api_secret // Cloudinary API secret
    });
    
    // Return the configured cloudinary object
    return cloudinary;
}

// Export the cloudinaryConnection function as default
export default cloudinaryConnection;