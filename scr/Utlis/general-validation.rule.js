import Joi from "joi"
import { Types } from "mongoose"

// Custom validation function for ObjectId
const objectIdValidation = (value, helper) => {
    // Check if the provided value is a valid ObjectId
    const isValid = Types.ObjectId.isValid(value)
    // If it's valid, return the value, otherwise return an error message
    return (isValid ? value : helper.message('Invalid objectId'))
}

// Validation schema for general rules
export const generalRules = {
    // Define validation rules for a database ObjectId
    dbId: Joi.string().custom(objectIdValidation),
    // Define validation rules for HTTP request headers
    headersRules: Joi.object({
        accesstoken: Joi.string().required(),
        'content-type': Joi.string(),
        'content-length': Joi.string(),
        'user-agent': Joi.string().required(),
        host: Joi.string().required(),
        'accept-encoding': Joi.string(),
        'postman-token': Joi.string(),
        accept: Joi.string(),
        connection: Joi.string(),
        'cache-control': Joi.string(),
    })
}
