import { Router } from "express";
import * as userController from './user.controller.js'
import expressAsyncHandler from "express-async-handler";
import { auth } from "../../middlewares/auth.middlewares.js"
import { endPointsRoles } from "./user.endpoint.js";
import { validationMiddleware } from "../../middlewares/validation.middlewares.js";
import * as validators from "./user.validation.js"

const router = Router()



router.put('/updateProfile', validationMiddleware(validators.updateSchema), auth(endPointsRoles.USER), expressAsyncHandler(userController.updateAccount))

router.put('/updatePassword', validationMiddleware(validators.updatePasswordSchema), auth(endPointsRoles.USER), expressAsyncHandler(userController.updatePassword))
router.delete('/deleteProfile', validationMiddleware(validators.deleteSchema), auth(endPointsRoles.USER), expressAsyncHandler(userController.deleteAccount))
router.put('/softDelete', validationMiddleware(validators.softDeleteSchema), auth(endPointsRoles.USER), expressAsyncHandler(userController.SoftDeleteAccount))

router.get('/getProfileData/:_id', validationMiddleware(validators.getProfileDataSchema), auth(endPointsRoles.USER), expressAsyncHandler(userController.getProfileData))

router.post('/forget', validationMiddleware(validators.ForgetPasswordSchema), expressAsyncHandler(userController.ForgetPassword))
router.post('/reset', validationMiddleware(validators.ResetPasswordSchema), expressAsyncHandler(userController.ResetPassword))

export default router
