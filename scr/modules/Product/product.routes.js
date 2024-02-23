
import { Router } from "express";
import { multerMiddleHost } from "../../middlewares/multer.middlewares.js";
import expressAsyncHandler from "express-async-handler";
import { allowedExtensions } from "../../Utlis/allowed-extensions.js";
import * as productController from './product.controller.js'
import { endPointsRoles } from './product.end-point.js'
import { auth } from "../../middlewares/auth.middlewares.js";
const router = Router()





router.post('/',
    auth(endPointsRoles.ADD_PRODUCT),
    multerMiddleHost({
        extensions: allowedExtensions.image
    }).array('image', 3),
    expressAsyncHandler(productController.addproduct))

    
router.put('/updateProduct/:productId',
auth(endPointsRoles.ADD_PRODUCT),
multerMiddleHost({extensions: allowedExtensions.image}).single('image'),
expressAsyncHandler(productController.updateProduct))


router.get('/getall',auth(endPointsRoles.ADD_PRODUCT),expressAsyncHandler(productController.getAllProductsWithPagination))
router.get('/getByField',auth(endPointsRoles.ADD_PRODUCT),expressAsyncHandler(productController.getAllProductsByField))
router.get('/SpecificBrands',auth(endPointsRoles.ADD_PRODUCT),expressAsyncHandler(productController.allProductsForSpecificBrands))
router.get('/:productId',auth(endPointsRoles.ADD_PRODUCT),expressAsyncHandler(productController.getSpecificProduct))
router.delete('/:productId',auth(endPointsRoles.ADD_PRODUCT),expressAsyncHandler(productController.deleteProduct))

export default router