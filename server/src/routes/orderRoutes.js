import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/requireAuth.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";

const router = Router();

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const items = req.body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty." });
    }
    if (items.length > 50) {
      return res.status(400).json({ message: "Too many line items." });
    }

    // Accept only IDs and quantities; never accept a browser-provided price or total.
    const quantities = new Map();
    for (const item of items) {
      const productId = item?.productId;
      const quantity = item?.quantity;
      if (typeof productId !== "string" || !mongoose.isValidObjectId(productId)) {
        return res.status(400).json({ message: "A cart item has an invalid product ID." });
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return res.status(400).json({ message: "Each quantity must be between 1 and 20." });
      }
      const nextQuantity = (quantities.get(productId) ?? 0) + quantity;
      if (nextQuantity > 20) {
        return res.status(400).json({ message: "Maximum quantity per product is 20." });
      }
      quantities.set(productId, nextQuantity);
    }

    const productIds = [...quantities.keys()];
    const products = await Product.find({ _id: { $in: productIds }, active: true });
    if (products.length !== productIds.length) {
      return res.status(400).json({ message: "One or more products are unavailable." });
    }

    const byId = new Map(products.map((product) => [product._id.toString(), product]));
    const orderItems = productIds.map((id) => {
      const product = byId.get(id);
      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: quantities.get(id),
      };
    });
    const totalAmount = Number(
      orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
    );

    const order = await Order.create({
      user: req.userId,
      items: orderItems,
      totalAmount,
      status: "placed",
    });

    return res.status(201).json({ order });
  } catch (error) {
    return next(error);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    // User ownership is enforced in this query, not by a client-supplied user ID.
    const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 }).lean();
    return res.json({ orders });
  } catch (error) {
    return next(error);
  }
});

export default router;
