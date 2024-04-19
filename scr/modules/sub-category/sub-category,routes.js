import { Router } from "express"
import * as subcategoryController from './sub-category.controller.js'
import { auth } from "../../middlewares/auth.middlewares.js";
import { endPointsRoles } from "../Category/category.endpoint.js";
import {multerMiddleHost}from "../../middlewares/multer.middlewares.js";
import {allowedExtensions} from "../../Utlis/allowed-extensions.js"
import expressAsyncHandler from "express-async-handler";
import { validationMiddleware } from "../../middlewares/validation.middlewares.js";
import * as validators from "./sub-category-validation.js"
const router= Router()

router.post('/:categoryId',validationMiddleware(validators.addSubCategorySchema),auth(endPointsRoles.ADD_CATEGORY),multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'),
expressAsyncHandler(subcategoryController.addSubCategory))

router.put('/:subCategoryId',validationMiddleware(validators.updatedSubCategorySchema),auth(endPointsRoles.ADD_CATEGORY),multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'),
expressAsyncHandler(subcategoryController.updatedSubCategory))


router.delete('/:subCategoryId',validationMiddleware(validators.deleteSubCategorySchema),auth(endPointsRoles.DELETE_CATEGORY),
expressAsyncHandler(subcategoryController.deleteSubCategory))

router.get('/',expressAsyncHandler(subcategoryController.getAllSubCategories))
router.get('/specificCategoty/:categoryId',validationMiddleware(validators.getAllSubCategoriesForSpecificCategorySchema),expressAsyncHandler(subcategoryController.getAllSubCategoriesForSpecificCategory))
router.get('/findById/:subCategoryId',validationMiddleware(validators.getSubCategoryByIdSchema),expressAsyncHandler(subcategoryController.getSubCategoryById))




















export default router