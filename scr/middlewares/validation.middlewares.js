// Array containing keys to be validated from the request object
const reqKeys = ['query', 'body', 'params', 'headers'];

// Middleware function for request validation using Joi schema
export const validationMiddleware = (schema) => {
    return (req, res, next) => {
        // Array to store validation errors
        let validationErrorArr = [];

        // Loop through each key in reqKeys array
        for (const key of reqKeys) {
            // Validate the corresponding value in the request object against the schema
            const validationResult = schema[key]?.validate(req[key], { abortEarly: false });

            // If there's an error in validation result, add it to the validationErrorArr
            if (validationResult?.error) {
                validationErrorArr.push(...validationResult.error.details);
            }
        }

        // If there are validation errors, return a 400 response with error messages
        if (validationErrorArr.length) {
            return res.status(400).json({
                err_msg: "validation error",
                errors: validationErrorArr.map(ele => ele.message)
            });
        }

        // If no validation errors, proceed to the next middleware or route handler
        next();
    };
};


