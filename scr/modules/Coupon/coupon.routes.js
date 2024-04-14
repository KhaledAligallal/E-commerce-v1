import {Router} from "express"
import { auth } from "../../middlewares/auth.middlewares.js"
import { endPointsRoles } from "./coupon.endpoint.js"
import expressAsyncHandler from "express-async-handler"
import * as couponController from './coupon.controller.js'
import * as validators from './coupon.validation-Schemas.js'
import { validationMiddleware }from '../../middlewares/validation.middlewares.js'
const router = Router()

router.post('/add',auth(endPointsRoles.ADD_COUPOUN),
validationMiddleware(validators.addCouponSchema),
expressAsyncHandler(couponController.addCoupon))

router.post('/valid',auth(endPointsRoles.ADD_COUPOUN),
expressAsyncHandler(couponController.validteCouponApi))







export default router