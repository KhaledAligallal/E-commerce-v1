import Joi from "joi";
import { generalRules } from "../../Utlis/general-validation.rule.js";



export const addCategorySchema = {
    body : Joi.object({
      name: Joi.string().required().trim(),
    })
     
}

export const deleteCategorySchema = {
    params: Joi.object({
        categoryId: generalRules.dbId.required(),
    }),
}

export const updatedCategorySchema = {
    
      params: Joi.object({
        categoryId: generalRules.dbId.required(),
    }),
        
}


export const getCategoryByIdSchema = {
   
    params: Joi.object({
        categoryId: generalRules.dbId.required(),
    }),
        
}
