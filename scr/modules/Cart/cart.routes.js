import { Router } from "express"
import { auth } from "../../middlewares/auth.middlewares.js";
import { systemRoles } from "../../Utlis/system-roles.js";
import expressAsyncHandler from "express-async-handler";
import * as cartController from "./cart.controller.js"

const router = Router();



router.post('/add',auth([systemRoles.USER]),expressAsyncHandler(cartController.addProductToCart))
router.delete('/delete/:productId',auth([systemRoles.USER]),expressAsyncHandler(cartController.removeProductFromCart))


export default router