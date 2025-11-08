import { body, validationResult } from 'express-validator';


function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }
    next();
}

const createProductValidators = [
    // 🏷️ Title
    body('title')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('title is required'),

    // 📦 Category
    body('category')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('category is required'),

    // 💰 Price
    body('priceAmount')
        .notEmpty()
        .withMessage('priceAmount is required')
        .bail()
        .isNumeric({ gt: 0 })
        .withMessage('priceAmount must be a number greater than 0'),

    body('priceCurrency')
        .optional()
        .isIn(['USD', 'INR'])
        .withMessage('priceCurrency must be either USD or INR'),

    // 🏷️ Original Price
    body('originalPrice')
        .notEmpty()
        .withMessage('originalPrice is required')
        .bail()
        .isNumeric({ gt: 0 })
        .withMessage('originalPrice must be a number greater than 0'),

    // 📦 Stock
    body('stock')
        .notEmpty()
        .withMessage('stock is required')
        .bail()
        .isInt({ min: 0 })
        .withMessage('stock must be an integer >= 0'),

    // 🧾 SKU
    body('sku')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 30 })
        .withMessage('sku must be a string with max 30 characters'),

    // 🧍 Seller (if not derived from token)
    body('seller')
        .optional()
        .isMongoId()
        .withMessage('Invalid seller ID'),

    // 📄 Description
    body('description')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('description is required')
        .isLength({ max: 1000 })
        .withMessage('description max length is 1000 characters'),

    // 🎨 Sizes
    body('sizes')
        .optional()
        .isArray()
        .withMessage('sizes must be an array')
        ,

    // 🎨 Colors
    body('colors')
        .optional()
        .isArray({ min: 1 })
        .withMessage('colors must be an array of strings'),

    // ✨ Features
    body('features')
        .optional()
        .isArray()
        .withMessage('features must be an array of strings'),

    // ⚙️ Specifications
    body('specifications')
        .optional()
        .isObject()
        .withMessage('specifications must be an object (key-value pairs)'),

    // 🚚 Shipping Info
    body('shippingInfo')
        .optional()
        .isObject()
        .withMessage('shippingInfo must be an object')
        .custom((info) => {
            const { freeShipping, estimatedDelivery, returns } = info;
            if (freeShipping !== undefined && typeof freeShipping !== 'string')
                throw new Error('shippingInfo.freeShipping must be a string');
            if (estimatedDelivery && typeof estimatedDelivery !== 'string')
                throw new Error('shippingInfo.estimatedDelivery must be a string');
            if (returns && typeof returns !== 'string')
                throw new Error('shippingInfo.returns must be a string');
            return true;
        }),
    handleValidationErrors
];



export { createProductValidators };