import { Router } from "express"
import { auth } from "../../middlewares/auth.middlewares.js";
import { systemRoles } from "../../Utlis/system-roles.js";
import expressAsyncHandler from "express-async-handler";
import * as cartController from "./cart.controller.js"
import * as validator from "./cart.validation.js"
import { validationMiddleware } from "../../middlewares/validation.middlewares.js";
const router = Router();



router.post('/add',validationMiddleware(validator.addProductToCartSchema),auth([systemRoles.USER]),expressAsyncHandler(cartController.addProductToCart))
router.delete('/delete/:productId',validationMiddleware(validator.removeProductFromCartSchema),auth([systemRoles.USER]),expressAsyncHandler(cartController.removeProductFromCart))


export default router