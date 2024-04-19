import Joi from "joi";
import { generalRules } from "../../Utlis/general-validation.rule.js";




export const addproductSchema = {
    body: Joi.object({
        title: Joi.string().required().trim(),
        desc: Joi.string(),
        basePrice: Joi.number().required(),
        discount: Joi.number().default(0),
        stock: Joi.number().required().min(0).default(0),
        specs: Joi.object().pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number()))
    }),

    query: Joi.object({
        categoryId: generalRules.dbId.required(),
        subCategoryId: generalRules.dbId.required(),
        brandId: generalRules.dbId.required(),
    }),

}


export const updateProductSchema = {
    body: Joi.object({
        title: Joi.string().required().trim(),
        desc: Joi.string(),
        basePrice: Joi.number().required(),
        discount: Joi.number().default(0),
        stock: Joi.number().required().min(0).default(0),
        specs: Joi.object().pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number()))
    }),
    params: Joi.object({
        productId: generalRules.dbId.required(),
    }),

}

export const getSpecificProductSchema = {

    params: Joi.object({
        productId: generalRules.dbId.required(),
    }),

}

export const deleteProductSchema = {

    params: Joi.object({
        productId: generalRules.dbId.required(),
    }),

}