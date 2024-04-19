import { Router } from "express";
import * as categoryController from './category.controller.js'
import { auth } from "../../middlewares/auth.middlewares.js";
import { endPointsRoles } from "./category.endpoint.js";
import { multerMiddleHost } from "../../middlewares/multer.middlewares.js";
import { allowedExtensions } from "../../Utlis/allowed-extensions.js"
import expressAsyncHandler from "express-async-handler";
import { validationMiddleware } from "../../middlewares/validation.middlewares.js";
import * as validators from "./category.validation.js"

const router = Router()

router.post('/', auth(endPointsRoles.ADD_CATEGORY), multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'),
    expressAsyncHandler(categoryController.addCategory))

router.put('/:categoryId', auth(endPointsRoles.ADD_CATEGORY), multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'),
    expressAsyncHandler(categoryController.updatedCategory))

router.get('/', expressAsyncHandler(categoryController.getAllCategories))
router.get('/findById/:categoryId', validationMiddleware(validators.getCategoryByIdSchema), expressAsyncHandler(categoryController.getCategoryById))


router.delete('/:categoryId', validationMiddleware(validators.deleteCategorySchema), auth(endPointsRoles.DELETE_CATEGORY),
    expressAsyncHandler(categoryController.deleteCategory))








export default router