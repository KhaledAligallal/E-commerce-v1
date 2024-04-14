import { Router } from "express"
const router = Router()


import expressAsyncHandler from "express-async-handler"
import { systemRoles } from "../../Utlis/system-roles.js"
import * as  orderController from "./order.controller.js"
import {auth} from "../../middlewares/auth.middlewares.js"



router.post('/create',auth([systemRoles.USER]),expressAsyncHandler(orderController.createOrder))




export default router;