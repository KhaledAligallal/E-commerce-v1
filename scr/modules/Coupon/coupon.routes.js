import { Router } from "express"
import { auth } from "../../middlewares/auth.middlewares.js"
import { endPointsRoles } from "./coupon.endpoint.js"
import expressAsyncHandler from "express-async-handler"
import * as couponController from './coupon.controller.js'
import * as validators from './coupon.validation-Schemas.js'
import { validationMiddleware } from '../../middlewares/validation.middlewares.js'
const router = Router()

router.post('/add', auth(endPointsRoles.ADD_COUPOUN),
    validationMiddleware(validators.addCouponSchema),
    expressAsyncHandler(couponController.addCoupon))
    
router.post('/valid',validationMiddleware(validators.validteCouponApiSchema), auth(endPointsRoles.ADD_COUPOUN), expressAsyncHandler(couponController.validteCouponApi))
router.put('/disable/:couponId',validationMiddleware(validators.disableCouponSchema), auth(endPointsRoles.ADD_COUPOUN), expressAsyncHandler(couponController.disableCoupon))
router.put('/enable/:couponId',validationMiddleware(validators.enableCouponSchema), auth(endPointsRoles.ADD_COUPOUN), expressAsyncHandler(couponController.enableCoupon))
router.get('/getall', auth(endPointsRoles.ADD_COUPOUN), expressAsyncHandler(couponController.getAllCoupons))
router.get('/findById/:couponId',validationMiddleware(validators.getCouponByIdSchema), auth(endPointsRoles.ADD_COUPOUN), expressAsyncHandler(couponController.getCouponById))
router.put('/update/:couponId',validationMiddleware(validators.updateCouponSchema), auth(endPointsRoles.ADD_COUPOUN), expressAsyncHandler(couponController.updateCoupon))


export default router