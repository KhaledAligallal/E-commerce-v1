import Joi from "joi";
import { generalRules } from "../../Utlis/general-validation.rule.js";



export const addSubCategorySchema = {
   
    headers: generalRules.headersRules,
    params: Joi.object({
        categoryId: generalRules.dbId.required(),
    }),

}

export const updatedSubCategorySchema = {
   
    params: Joi.object({
        subCategoryId: generalRules.dbId.required(),
    }),

}

export const deleteSubCategorySchema = {

    params: Joi.object({
        subCategoryId: generalRules.dbId.required(),
    }),

}

export const getAllSubCategoriesForSpecificCategorySchema = {

    params: Joi.object({
        categoryId: generalRules.dbId.required(),
    }),

}

export const getSubCategoryByIdSchema = {



    params: Joi.object({
        subCategoryId: generalRules.dbId.required(),
    }),

}