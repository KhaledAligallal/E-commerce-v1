import { Router } from "express";
import { auth } from "../../middlewares/auth.middlewares.js";
import { endPointsRoles } from "./review.end-point.js";
import expressAsyncHandler from "express-async-handler";
import * as reviewController from "../Review/review.controller.js"
import { validationMiddleware } from "../../middlewares/validation.middlewares.js";
import * as validators from "./review.validation.js"
const router =  Router()





router.post('/add',validationMiddleware(validators.addReviewSchema),auth(endPointsRoles.USER),expressAsyncHandler(reviewController.addReview))

router.delete('/delete/:reviewId',validationMiddleware(validators.deleteReviewSchema), auth(endPointsRoles.USER),expressAsyncHandler(reviewController.deleteReview))

router.get('/:productId',validationMiddleware(validators.getReviewsBySpecificProductSchema),expressAsyncHandler(reviewController.getReviewsBySpecificProduct))


export default router