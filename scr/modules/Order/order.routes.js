import { Router } from "express"
const router = Router()

import { validationMiddleware } from "../../middlewares/validation.middlewares.js"
import * as validators from "./order-validation.js"
import { systemRoles } from "../../Utlis/system-roles.js"
import * as  orderController from "./order.controller.js"
import { auth } from "../../middlewares/auth.middlewares.js"

import expressAsyncHandler from "express-async-handler"



router.post('/create', validationMiddleware(validators.createOrderSchema), auth([systemRoles.USER]), expressAsyncHandler(orderController.createOrder))

router.post('/cartToOrder', validationMiddleware(validators.convertFromcartToOrderSchema), auth([systemRoles.USER]), expressAsyncHandler(orderController.convertFromcartToOrder))

router.put('/deliever/:orderId', validationMiddleware(validators.delieverOrderSchema), auth([systemRoles.DELIEVER_ROLE]), expressAsyncHandler(orderController.delieverOrder))

router.put('/cancel/:orderId', validationMiddleware(validators.cancelOrderSchema), auth([systemRoles.USER]), expressAsyncHandler(orderController.cancelOrder))

router.post('/stripePay/:orderId', validationMiddleware(validators.payWithStripeSchema), auth([systemRoles.USER]), expressAsyncHandler(orderController.payWithStripe))

router.post('/webhook', expressAsyncHandler(orderController.stripeWebhookLocal))

router.post('/refund/:orderId', validationMiddleware(validators.refundOrderSchema), auth([systemRoles.SUPER_ADMIN, systemRoles.ADMIN]), expressAsyncHandler(orderController.refundOrder))
export default router;