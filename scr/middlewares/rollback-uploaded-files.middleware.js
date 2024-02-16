import cloudinaryConection from "../Utlis/cloudinary.js"


export const rollbackUploadedFiles = async (req, res, next) => {
    // console.log(req.folder);
    if (req.folder) {
        console.log('rollbackUploadedFiles');
        await cloudinaryConection().api.delete_resources_by_prefix(req.folder)
        await cloudinaryConection().api.delete_folder(req.folder)
    }
    next()

}