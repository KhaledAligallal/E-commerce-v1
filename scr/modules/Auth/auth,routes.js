import { Router } from "express";
import * as authController from './auth.controller.js'
import expressAsyncHandler from "express-async-handler";
import { validationMiddleware } from "../../middlewares/validation.middlewares.js";
import * as validators from "./auth.validation.js"
const router = Router()



router.post('/',validationMiddleware(validators.signUpSchema) ,expressAsyncHandler(authController.signUp))
router.get('/verify-email', expressAsyncHandler(authController.verifyEmail))
router.post('/signin',validationMiddleware(validators.signInSchema), expressAsyncHandler(authController.signIn))

export default router
