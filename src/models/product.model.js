import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String,
        required: true,
    },
    price: {
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            enum: ['USD', 'INR'],
            default: 'INR'
        }
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    originalPrice: {
        type: Number,
        min: 0,
        required: true,
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
    },
    reviews: {
        type: Number,
        default: 0,
    },
    stock: {
        type: Number,
        min: 0,
        required: true,
    },
    sku: {
        type: String,
        unique: true,
        uppercase: true,
    },
    images: [
        {
            url: String,
            thumbnail: String,
            fileId: String
        }
    ],
    sizes: {
        type: [String],
    },
    colors: [String],
    description: {
        type: String,
        required: true,
    },
    features: [String],

    specifications: {
        type: Object,
        default: {},
    },
    shippingInfo: {
        freeShipping: { type: Boolean, default: false },
        estimatedDelivery: String,
        returns: String,
    },
}, { timestamps: true });

productSchema.index({ title: 'text', description: 'text' });

export default mongoose.model("Product", productSchema);
