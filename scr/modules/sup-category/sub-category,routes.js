import { Router } from "express"
import * as subcategoryController from './sub-category.controller.js'
import { auth } from "../../middlewares/auth.middlewares.js";
import { endPointsRoles } from "../Category/category.endpoint.js";
import {multerMiddleHost}from "../../middlewares/multer.middlewares.js";
import {allowedExtensions} from "../../Utlis/allowed-extensions.js"
import expressAsyncHandler from "express-async-handler";
const router= Router()

router.post('/:categoryId',auth(endPointsRoles.ADD_CATEGORY),multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'),
expressAsyncHandler(subcategoryController.addSubCategory))

router.put('/:subCategoryId',auth(endPointsRoles.ADD_CATEGORY),multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'),
expressAsyncHandler(subcategoryController.updatedSubCategory))


router.delete('/:subCategoryId',auth(endPointsRoles.DELETE_CATEGORY),
expressAsyncHandler(subcategoryController.deleteSubCategory))

router.get('/',expressAsyncHandler(subcategoryController.getAllSubCategories))






















export default router