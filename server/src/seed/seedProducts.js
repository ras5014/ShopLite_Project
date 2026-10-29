import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Product } from "../models/Product.js";

const products = [
  {
    name: "Everyday Watch",
    slug: "everyday-watch",
    description: "A clean, versatile watch for everyday wear.",
    category: "Accessories",
    price: 2499,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900",
    active: true,
  },
  {
    name: "Studio Headphones",
    slug: "studio-headphones",
    description: "Comfortable headphones for music, study, and work.",
    category: "Electronics",
    price: 3299,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900",
    active: true,
  },
  {
    name: "City Backpack",
    slug: "city-backpack",
    description: "A compact backpack for everyday essentials.",
    category: "Bags",
    price: 1899,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900",
    active: true,
  },
  {
    name: "Classic Sneakers",
    slug: "classic-sneakers",
    description: "Minimal sneakers that work with casual outfits.",
    category: "Footwear",
    price: 2799,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900",
    active: true,
  },
  {
    name: "Insulated Bottle",
    slug: "insulated-bottle",
    description: "A reusable bottle for class, work, or travel.",
    category: "Lifestyle",
    price: 799,
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=900",
    active: true,
  },
  {
    name: "Desk Lamp",
    slug: "desk-lamp",
    description: "A simple lamp for a focused workspace.",
    category: "Home",
    price: 1499,
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=900",
    active: true,
  },
  {
    name: "Everyday T-shirt",
    slug: "everyday-t-shirt",
    description: "A comfortable basic tee for daily use.",
    category: "Clothing",
    price: 699,
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900",
    active: true,
  },
  {
    name: "Slim Wallet",
    slug: "slim-wallet",
    description: "A compact wallet with room for the essentials.",
    category: "Accessories",
    price: 999,
    imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=900",
    active: true,
  },
];

async function seedProducts() {
  try {
    await connectDB();
    const operations = products.map((product) => ({
      updateOne: {
        filter: { slug: product.slug },
        update: { $set: product },
        upsert: true,
      },
    }));
    await Product.bulkWrite(operations);
    console.log(`Seeded/updated ${products.length} demo products.`);
  } catch (error) {
    console.error("Product seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

await seedProducts();
