import Joi from "joi";
import { generalRules } from "../../Utlis/general-validation.rule.js";


export const addBrandSchema = {
    body: Joi.object({
        name: Joi.string().required().trim(),
    })
        
}

export const updateBrandSchema = {
   
    params: Joi.object({
        brandId: generalRules.dbId.required(),
    }),
        
}

export const deleteBrandSchema = {
    params: Joi.object({
        brandId: generalRules.dbId.required(),
    }),
        
}
export const getAllBrandForSpecificSubCategorySchema = {
    params: Joi.object({
        subCategoryId: generalRules.dbId.required(),
    }),
        
}
export const getAllBrandForSpecificCategorySchema = {
    params: Joi.object({
      categoryId: generalRules.dbId.required(),
    }),
}