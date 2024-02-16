
import { Router } from "express";
import { multerMiddleHost } from "../../middlewares/multer.middlewares.js";
import expressAsyncHandler from "express-async-handler";
import { allowedExtensions } from "../../Utlis/allowed-extensions.js";
import * as productController from './product.controller.js'
import { endPointsRoles } from '../Category/category.endpoint.js'
import { auth } from "../../middlewares/auth.middlewares.js";
const router = Router()





router.post('/',
    auth(endPointsRoles.ADD_CATEGORY),
    multerMiddleHost({
        extensions: allowedExtensions.image
    }).array('image', 3),
    expressAsyncHandler(productController.addproduct))





export default router