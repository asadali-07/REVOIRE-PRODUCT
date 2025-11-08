import { uploadImage, imagekit } from '../services/imagekit.service.js';
import Product from '../models/product.model.js';
import { publishToQueue } from "../broker/broker.js";
import mongoose from 'mongoose';

export const createProduct = async (req, res) => {
    try {
        const {
            title,
            category,
            description,
            priceAmount,
            priceCurrency = 'INR',
            originalPrice,
            stock,
            sku,
            sizes,
            colors,
            features,
            specifications,
            shippingInfo,
        } = req.body;

        let images = [];
        if (req.files && req.files.length > 0) {
            images = await Promise.all(
                req.files.map(async (file) => {
                    const uploaded = await uploadImage({ buffer: file.buffer });
                    return {
                        url: uploaded.url,
                        thumbnail: uploaded.thumbnail,
                        fileId: uploaded.fileId,
                    };
                })
            );
        }

        const product = await Product.create({
            title,
            category,
            description,
            price: { amount: priceAmount, currency: priceCurrency },
            seller: req.user.id,
            originalPrice,
            stock,
            sku,
            images,
            sizes,
            colors,
            features,
            specifications,
            shippingInfo,
        });
        await Promise.all([
            publishToQueue('PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED', product),
            publishToQueue('PRODUCT_NOTIFICATION.PRODUCT_CREATED', {
                username: req.user.username,
                title: product.title,
                price: product.price.amount,
                email: req.user.email,
            }),
        ]);

        res.status(201).json({
            message: "Product created successfully",
            product,
        });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const getProducts = async (req, res) => {

    const { q, minPrice, maxPrice, category, skip = 0, limit = 20 } = req.query;
    const filter = {};
    if (q) filter.$text = { $search: q };
    if (minPrice) filter["price.amount"] = { ...filter["price.amount"], $gte: Number(minPrice) };
    if (maxPrice) filter["price.amount"] = { ...filter["price.amount"], $lte: Number(maxPrice) };
    if (category) filter.category = category;

    try {
        const products = await Product.find(filter).skip(Number(skip)).limit(Math.min(Number(limit), 20));
        res.status(200).json({
            message: "Products retrieved successfully",
            products
        });
    } catch (error) {
        console.error("Error retrieving products:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getProductById = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json({
            message: "Product retrieved successfully",
            product
        });
    } catch (error) {
        console.error("Error retrieving product:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { title, description, priceAmount, stock } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid product id' });
    }

    try {
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized to update this product" });
        }

        // Prepare update object
        const updateData = {
            title: title || product.title,
            description: description || product.description,
            price: {
                amount: priceAmount || product.price.amount,
                currency: product.price.currency,
            },
            stock: stock ?? product.stock,
        };

        // Handle new image uploads if present
        if (req.files && req.files.length > 0) {
            // Delete old images from ImageKit
            if (product.images && product.images.length > 0) {
                await Promise.all(
                    product.images.map(image => imagekit.deleteFile(image.fileId))
                );
            }

            // Upload new images
            const newImages = await Promise.all(
                req.files.map(async (file) => {
                    const uploaded = await uploadImage({ buffer: file.buffer });
                    return {
                        url: uploaded.url,
                        thumbnail: uploaded.thumbnail,
                        fileId: uploaded.fileId,
                    };
                })
            );

            updateData.images = newImages;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        await publishToQueue('PRODUCT_SELLER_DASHBOARD.PRODUCT_UPDATED', updatedProduct);

        res.status(200).json({
            message: "Product updated successfully",
            product: updatedProduct,
        });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteProduct = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid product id' });
    }
    try {
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        if (product.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized to delete this product" });
        }
        if (product.images && product.images.length > 0) {
            await Promise.all(product.images.map(image => imagekit.deleteFile(image.fileId)));
        }
        await publishToQueue('PRODUCT_SELLER_DASHBOARD.PRODUCT_DELETED', id);
        await Product.findByIdAndDelete(id);
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
