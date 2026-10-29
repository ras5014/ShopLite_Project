import { Router } from "express";
import { Product } from "../models/Product.js";

const router = Router();

// Stage 1: Express 5 sends rejected async handlers to the error middleware.
router.get("/", async (req, res) => {
  const products = await Product.find({ active: true }).sort({ name: 1 }).lean();
  res.json({ products });
});

export default router;
