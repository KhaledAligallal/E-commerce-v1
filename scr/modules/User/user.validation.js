import Joi from "joi";
import { generalRules } from "../../Utlis/general-validation.rule.js";



export const updateSchema = {
    body: Joi.object({
        username: Joi.string().trim().min(3).max(12).required(),
        email: Joi.string().trim().email().required(),
       /* password: Joi.string().trim().min(6).required(),
        cpass: Joi.string().valid(Joi.ref('password')),
        oldPassword:Joi.string().trim().min(6).required(),*/
        addresses: Joi.array().items(Joi.string().required()).required(),
        phoneNumbers: Joi.array().items(Joi.string().trim().pattern(/^[0-9]{11}$/).required()).required(),
        age: Joi.number().integer().min(0).required()
    })
        .with('password', 'cpass'),
        headers: generalRules.headersRules
    

}

export const updatePasswordSchema = {
    body: Joi.object({
       
       password: Joi.string().trim().min(6).required(),
        cpass: Joi.string().valid(Joi.ref('password')),
       
    })
        .with('password', 'cpass'),
        headers: generalRules.headersRules
    

}




export const deleteSchema = {
    headers: generalRules.headersRules
}


export const  ResetPasswordSchema = {
    body: Joi.object({
        
        newPassword: Joi.string().trim().min(6).required(),
        cpass: Joi.string().valid(Joi.ref('newPassword')),
        sentOtp:Joi.required(),
       
    })
        .with('newPassword', 'cpass'),
}


export const softDeleteSchema = {
  
        headers: generalRules.headersRules
    }
        

export const getProfileDataSchema = {
  
        headers: generalRules.headersRules
    }
        

export const ForgetPasswordSchema = {
    body: Joi.object({
        email: Joi.string().trim().email().required(),
    })
}
       