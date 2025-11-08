import express from 'express';
import productsRouter from './routes/product.route.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';


const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
  credentials: true 
}));

app.use(express.json());
app.use(cookieParser());
app.use('/api/products', productsRouter);

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Product service is running"
    });
})

export default app;