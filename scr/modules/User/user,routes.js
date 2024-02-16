import { Router } from "express";
import * as userController from './user.controller.js'
import expressAsyncHandler from "express-async-handler";
import { auth } from "../../middlewares/auth.middlewares.js"
import { endPointsRoles } from "./user.endpoint.js";


const router = Router()


router.put('/updateProfile',auth(endPointsRoles.USER),expressAsyncHandler(userController.updateAccount))
router.delete('/deleteProfile',auth(endPointsRoles.USER),expressAsyncHandler(userController.deleteAccount))
router.get('/getProfileData/:_id',auth(endPointsRoles.USER),expressAsyncHandler(userController.getProfileData))

export default router
