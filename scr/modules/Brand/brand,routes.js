import { Router } from "express";
import * as brandController from "./brand.controller.js"
import { auth } from "../../middlewares/auth.middlewares.js";
import { endPointsRoles } from "../Brand/brand.endpoint.js";
import {multerMiddleHost}from "../../middlewares/multer.middlewares.js";
import {allowedExtensions} from "../../Utlis/allowed-extensions.js"
import expressAsyncHandler from "express-async-handler";

const router = Router()

router.post('/',auth(endPointsRoles.ADD_BRAND),multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'),
expressAsyncHandler(brandController.addBrand))

router.put('/:brandId',auth(endPointsRoles.ADD_BRAND),multerMiddleHost({
    extensions: allowedExtensions.image
}).single('image'),
expressAsyncHandler(brandController.updateBrand))


router.delete('/:brandId',auth(endPointsRoles.ADD_BRAND),
expressAsyncHandler(brandController.deleteBrand))

router.get('/',expressAsyncHandler(brandController.getAllBrands))



export default router