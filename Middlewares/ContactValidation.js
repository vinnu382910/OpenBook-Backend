const joi = require('joi')

// Contact validation
const addContactValidation = (req, res, next) => {
    const contactSchema = joi.object({
        name: joi.string().min(3).max(100).required(),
        email: joi.string().email().required(),
        phone: joi.string().pattern(/^[0-9]{10,15}$/).messages({
            "string.pattern.base": "Phone number must be a valid 10-15 digit number",
        }),
        address: joi.string().min(3).max(255),
        timezone: joi.string().min(1).max(50).required(), // Assuming timezones are strings (e.g., 'UTC', 'Asia/Kolkata')
    });

    // Check if the request body is an array for multiple contacts
    if (Array.isArray(req.body)) {
        const validationResults = req.body.map(contact => contactSchema.validate(contact)); //The purpose of this line is to validate each contact in the array and collect the validation results, which can then be checked for errors and processed accordingly. This allows you to handle multiple contacts in a single request while ensuring each contact meets the defined validation criteria.
        
        // Check for validation errors
        const errors = validationResults.filter(result => result.error).map(result => result.error);
        if (errors.length > 0) {
            return res.status(400).json({ message: "Bad request", errors });
        }
    } else {
        // Validate a single contact
        const { error } = contactSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: "Bad request", error });
        }
    }

    next();
};

//Update Validation While updating multiple contacts

const updatemultipleContactsValidation = (req, res, next) => {
    const updateSchema = joi.object({
        id: joi.string().guid().required().messages({
            "string.guid": "Invalid ID format",
            "any.required": "ID is required"
        }),
        name: joi.string().min(3).max(100).required().messages({
            "string.min": "Name should be at least 3 characters long",
            "string.max": "Name should not exceed 100 characters",
            "any.required": "Name is required"
        }),
        email: joi.string().email().required().messages({
            "string.email": "Invalid email format",
            "any.required": "Email is required"
        }),
        phone: joi.string().pattern(/^[0-9]{10,15}$/).messages({
            "string.pattern.base": "Phone number must be a valid 10-15 digit number"
        }).required(),
        address: joi.string().min(3).max(255).messages({
            "string.min": "Address should be at least 3 characters long",
            "string.max": "Address should not exceed 255 characters"
        }),
        timezone: joi.string().min(1).max(50).required().messages({
            "string.min": "Timezone is required",
            "string.max": "Timezone should not exceed 50 characters",
            "any.required": "Timezone is required"
        })
    });

    if (Array.isArray(req.body)) {
        // If batch update (array of contacts)
        const errors = req.body.map(contact => updateSchema.validate(contact));
        const validationErrors = errors.filter(result => result.error);

        if (validationErrors.length > 0) {
            const errorMessages = validationErrors.map(err => err.error.details.map(d => d.message).join(', ')).join('; ');
            return res.status(400).json({ message: "Validation failed", errors: errorMessages });
        }
    } else {
        // If updating a single contact
        const { error } = updateSchema.validate(req.body);
        if (error) {
            const errorMessages = error.details.map(err => err.message).join(', ');
            return res.status(400).json({ message: "Validation failed", errors: errorMessages });
        }
    }

    next();
};

module.exports = {
    addContactValidation,
    updatemultipleContactsValidation
}