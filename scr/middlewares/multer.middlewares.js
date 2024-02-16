import multer from "multer"
import generateUniqueString from "../Utlis/generate-uniqueStrin.js"
import { allowedExtensions } from "../Utlis/allowed-extensions.js"




export const multerMiddleHost = ({
    extensions = allowedExtensions.image,
}) => {
    const storage = multer.diskStorage({ filename: (req, file, cb) => {
        const uniqueFileName = generateUniqueString(6) + '_' + file.originalname
        cb(null, uniqueFileName)
    } })
    
    const fileFilter = (req, file, cb) => {

        if (extensions.includes(file.mimetype.split('/')[1])) {
            return cb(null, true)
        }
        cb(new Error('image format is not allowed'), false)
    }

    const file = multer({ fileFilter, storage })
    return file

}
