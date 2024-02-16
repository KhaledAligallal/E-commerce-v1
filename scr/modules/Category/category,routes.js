import { Router } from "express";
import * as categoryController from './category.controller.js'
import { auth } from "../../middlewares/auth.middlewares.js";
import { endPointsRoles } from "./category.endpoint.js";
import {multerMiddleHost}from "../../middlewares/multer.middlewares.js";
import {allowedExtensions} from "../../Utlis/allowed-extensions.js"
import expressAsyncHandler from "express-async-handler";


 const router= Router()

router.post('/',auth(endPointsRoles.ADD_CATEGORY),multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'),
expressAsyncHandler(categoryController.addCategory))

router.put('/:categoryId',auth(endPointsRoles.ADD_CATEGORY),multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'),
expressAsyncHandler(categoryController.updatedCategory))

router.get('/',expressAsyncHandler(categoryController.getAllCategories))



router.delete('/:categoryId',auth(endPointsRoles.DELETE_CATEGORY),
expressAsyncHandler(categoryController.deleteCategory))








 export default router