import Joi from "joi";
import { generalRules } from "../../Utlis/general-validation.rule.js";



export const createOrderSchema = {
    body: Joi.object({

        product: Joi.string().required(),
        address: Joi.string().required(),
        city: Joi.string().required(),
        postalCode: Joi.string().required(),
        country: Joi.string().required(),
        quantity: Joi.number().required(),
        couponCode: Joi.string().required().min(3).max(10).alphanum(),
        phoneNumbers: Joi.array().items(Joi.string().required()).required(),
        paymentMethod: Joi.string().valid('Cash', 'Stripe', 'Paymob').required(),
    })
}
export const convertFromcartToOrderSchema = {
    body: Joi.object({


        couponCode: Joi.string().required().min(3).max(10).alphanum(),
        paymentMethod: Joi.string().valid('Cash', 'Stripe', 'Paymob').required(),
        phoneNumbers: Joi.array().items(Joi.string().required()).required(),
        address: Joi.string().required(),
        city: Joi.string().required(),
        postalCode: Joi.string().required(),
        country: Joi.string().required(),

    })
}
export const delieverOrderSchema = {

    params: Joi.object({
        orderId: generalRules.dbId.required(),
    }),

}
export const cancelOrderSchema = {

    params: Joi.object({
        orderId: generalRules.dbId.required(),
    }),

}
export const payWithStripeSchema = {

    params: Joi.object({
        orderId: generalRules.dbId.required(),
    }),

}
export const refundOrderSchema = {

    params: Joi.object({
        orderId: generalRules.dbId.required(),
    }),

}