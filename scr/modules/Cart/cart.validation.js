import Joi from "joi";
import { generalRules } from "../../Utlis/general-validation.rule.js";



export const addProductToCartSchema = {
    body : Joi.object({
        quantity: Joi.number().integer().min(1).required(),

    }),
    params: Joi.object({
        productId: generalRules.dbId.required(),
    }),
        
}

export const removeProductFromCartSchema = {
    params: Joi.object({
        productId: generalRules.dbId.required(),
    }),
}