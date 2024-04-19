import Joi from "joi";




export const signUpSchema = {
    body: Joi.object({
        username: Joi.string().trim().min(3).max(12).required(),
        email: Joi.string().trim().email().required(),
        password: Joi.string().trim().min(6).required(),
        cpass: Joi.string().valid(Joi.ref('password')),
        addresses: Joi.array().items(Joi.string().required()).required(),
        phoneNumbers: Joi.array().items(Joi.string().trim().pattern(/^[0-9]{11}$/).required()).required(),
        role: Joi.string().valid( 'User','Admin','SuperAdmin','deliever').default('User').required(),
        age: Joi.number().integer().min(6).required()
    })
        .with('password', 'cpass')
        .with('email', 'password'),

}
export const signInSchema = {
    body: Joi.object({

        email: Joi.string().trim().email().required(),
        password: Joi.string().trim().min(6).required(),
       
    }),
   
}