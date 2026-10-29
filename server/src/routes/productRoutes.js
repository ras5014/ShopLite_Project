import { Router } from "express";
import { Product } from "../models/Product.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const products = await Product.find({ active: true }).sort({ name: 1 }).lean();
    return res.json({ products });
  } catch (error) {
    return next(error);
  }
});

export default router;
