import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/requireAuth.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";

const router = Router();

// Stage 4: validate choices, load prices, calculate the total, save the order.
router.post("/", requireAuth, async (req, res) => {
  const items = req.body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Your cart is empty." });
  }
  if (items.length > 50) {
    return res.status(400).json({ message: "Too many line items." });
  }

  const cartItems = [];
  for (const item of items) {
    const productId = item?.productId;
    const quantity = item?.quantity;

    if (typeof productId !== "string" || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "A cart item has an invalid product ID." });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ message: "Each quantity must be between 1 and 20." });
    }

    // ObjectId strings can use either letter case; compare one canonical form.
    const normalizedId = productId.toLowerCase();
    const existingItem = cartItems.find((line) => line.productId === normalizedId);
    if (existingItem) {
      existingItem.quantity += quantity;
      if (existingItem.quantity > 20) {
        return res.status(400).json({ message: "Maximum quantity per product is 20." });
      }
    } else {
      cartItems.push({ productId: normalizedId, quantity });
    }
  }

  const productIds = cartItems.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds }, active: true });
  if (products.length !== cartItems.length) {
    return res.status(400).json({ message: "One or more products are unavailable." });
  }

  const orderItems = [];
  let totalAmount = 0;
  for (const item of cartItems) {
    const product = products.find((product) => product._id.toString() === item.productId);

    // Only database prices are trusted; save a snapshot for the receipt.
    orderItems.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
    });
    totalAmount += product.price * item.quantity;
  }

  const order = await Order.create({
    user: req.userId,
    items: orderItems,
    totalAmount: Number(totalAmount.toFixed(2)),
    status: "placed",
  });
  res.status(201).json({ order });
});

router.get("/", requireAuth, async (req, res) => {
  // The verified identity, not a browser-supplied ID, selects whose orders to read.
  const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 }).lean();
  res.json({ orders });
});

export default router;
