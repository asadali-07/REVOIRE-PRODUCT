import express from 'express';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct} from '../controllers/product.controller.js';
import { createAuthMiddleware } from '../middlewares/auth.middleware.js';
import { createProductValidators } from '../validators/product.validator.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post("/", upload.array("images", 5), createAuthMiddleware(["seller"]), createProductValidators, createProduct);
router.get("/", getProducts);
router.patch("/:id", upload.array("images", 5), createAuthMiddleware(["seller"]), updateProduct);
router.delete("/:id", createAuthMiddleware(["seller"]), deleteProduct);
router.get("/:id", getProductById);


export default router;