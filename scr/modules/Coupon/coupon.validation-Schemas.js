import Joi from "joi";
import { generalRules } from "../../Utlis/general-validation.rule.js";


export const addCouponSchema = {
    body: Joi.object({
        couponCode: Joi.string().required().min(3).max(10).alphanum(),
        couponAmount: Joi.number().required().min(1),
        isFixed: Joi.boolean(),
        isPercentage: Joi.boolean(),
        fromDate: Joi.date().greater(Date.now() - (24 * 60 * 60 * 1000)).required(),
        toDate: Joi.date().greater(Joi.ref('fromDate')).required(),
        Users: Joi.array().items(
            Joi.object({
                userId: generalRules.dbId.required(),
                maxUsage: Joi.number().required().min(1)
            }))
    })
}

export const validteCouponApiSchema = {
    body: Joi.object({
        code: Joi.string().required().min(3).max(10).alphanum(),

    }),
}


export const disableCouponSchema = {

    params: Joi.object({
        couponId: generalRules.dbId.required(),
    }),

}


export const enableCouponSchema = {

    params: Joi.object({
        couponId: generalRules.dbId.required(),
    }),

}

export const getCouponByIdSchema = {

    params: Joi.object({
        couponId: generalRules.dbId.required(),
    }),

}

export const updateCouponSchema = {
    body: Joi.object({
        couponCode: Joi.string().required().min(3).max(10).alphanum(),
        couponAmount: Joi.number().required().min(1),
        isFixed: Joi.boolean(),
        isPercentage: Joi.boolean(),
        isEnabled: Joi.boolean(),
        fromDate: Joi.date().greater(Date.now() - (24 * 60 * 60 * 1000)).required(),
        toDate: Joi.date().greater(Joi.ref('fromDate')).required(),
    }),
    params: Joi.object({
        couponId: generalRules.dbId.required(),
    }),

}