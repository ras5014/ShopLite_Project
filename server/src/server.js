import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set to a random string of at least 32 characters in server/.env.");
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "100kb" }));

// Stage 5: connect the routes from the earlier learning stages.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "shoplite-api" });
});
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "API route not found." });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) {
    return next(error);
  }
  return res.status(500).json({ message: "Something went wrong on the server." });
});

const port = Number(process.env.PORT) || 5000;
try {
  await connectDB();
  app.listen(port, () => console.log(`ShopLite API listening at http://localhost:${port}`));
} catch (error) {
  console.error("Unable to start ShopLite API:", error.message);
  process.exit(1);
}
