import Joi from "joi"
import { generalRules } from "../../Utlis/general-validation.rule.js"



export const addReviewSchema = {

    query: Joi.object({
        productId: generalRules.dbId.required(),
    }),

}
export const deleteReviewSchema = {

    params: Joi.object({
        reviewId: generalRules.dbId.required(),
    }),

}
export const getReviewsBySpecificProductSchema = {

    params: Joi.object({
        productId: generalRules.dbId.required(),
    }),

}