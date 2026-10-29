# ShopLite — Complete Full-Stack E-commerce Build Guide

**CodeEmy | React + Vite + Node.js + Express + MongoDB | Beginner-friendly, from an empty folder**

This README is the build guide and codebook. Follow it from top to bottom. Every source file that you must create or replace is included in full below; there are no “continue in another file” steps.

## What you will build

- Responsive product storefront with product cards, category filtering, and search.
- Shopping cart with add/remove, quantity controls, and subtotal.
- User registration and login.
- Password hashing with `bcryptjs` and signed JWT authentication.
- Express REST API connected to MongoDB through Mongoose.
- Protected checkout that creates persistent orders.
- Order history scoped to the signed-in user.

**Out of scope:** real card payments, payment gateways, inventory reservations, shipping, admin dashboards, and production deployment. Checkout is simulated; no money is collected.

## 1. How the application works

```text
Browser (React + Vite)
   |  GET /api/products
   |  POST /api/auth/register or /api/auth/login
   |  POST /api/orders   Authorization: Bearer <JWT>
   |  GET  /api/orders   Authorization: Bearer <JWT>
   v
Node.js + Express API
   |-- User model ---- MongoDB
   |-- Product model - MongoDB
   `-- Order model --- MongoDB
```

React **never connects directly to MongoDB**. It calls Express; Express validates requests, checks authentication, calculates order totals from database prices, and then reads/writes MongoDB.

## 2. Requirements

Install:

1. Node.js LTS with npm. Confirm with `node -v` and `npm -v`.
2. MongoDB, either a local MongoDB service or a MongoDB Atlas database.
3. VS Code or another editor.
4. A modern browser. An API client such as Postman or Thunder Client is helpful for backend tests.

## 3. Create the project folders

Open a terminal in the directory where you keep class projects:

```bash
mkdir shoplite
cd shoplite
mkdir server
```

The final structure will look like this:

```text
shoplite/
├── .gitignore
├── server/
│   ├── .env                 # Create locally; never commit this file
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── config/db.js
│       ├── middleware/requireAuth.js
│       ├── models/User.js
│       ├── models/Product.js
│       ├── models/Order.js
│       ├── routes/authRoutes.js
│       ├── routes/productRoutes.js
│       ├── routes/orderRoutes.js
│       └── seed/seedProducts.js
└── client/
    ├── .env                 # Create locally; Vite variable is just the API URL
    ├── .env.example
    ├── index.html
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js
        ├── styles.css
        ├── auth/AuthContext.jsx
        ├── components/Navbar.jsx
        ├── components/ProductCard.jsx
        ├── components/AuthPanel.jsx
        ├── components/CartPanel.jsx
        ├── components/OrdersPanel.jsx
        └── utils/formatPrice.js
```

Create the following backend folders before adding their files.

**macOS / Linux:**

```bash
mkdir -p server/src/config server/src/middleware server/src/models server/src/routes server/src/seed
```

**Windows PowerShell:**

```powershell
New-Item -ItemType Directory -Force -Path `
  'server/src/config','server/src/middleware','server/src/models','server/src/routes','server/src/seed' | Out-Null
```

Create the files below using the exact paths shown. Later, Vite creates the `client` folder; you will create its extra source folders in Part B.

---

# Part A — Build the backend

## 4. Create the backend package file

Create `server/package.json`:


```json
{
  "name": "shoplite-server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "seed": "node src/seed/seedProducts.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.19.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.10"
  }
}
```

## 5. Add environment variables

Create `server/.env.example`:


```dotenv
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/shoplite
JWT_SECRET=replace-with-a-long-random-secret-before-running
```

Now create `server/.env` by copying `.env.example`. Put in your real MongoDB connection string and replace the sample secret with a random string at least 32 characters long. Example for a local MongoDB installation:

```dotenv
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/shoplite
JWT_SECRET=replace-this-with-a-long-random-secret-of-at-least-32-characters
```

For MongoDB Atlas, use the connection URI provided by Atlas instead of the local URI. Ensure the database user and network access are configured. Do not use a real account password in a classroom screenshot or commit `.env` to Git.

Create `shoplite/.gitignore`:


```gitignore
node_modules/
dist/
.env
.DS_Store
```

## 6. Install backend dependencies

In the terminal:

```bash
cd server
npm install
```

If you are making the project manually and have not created `package.json`, create the file from Step 4 first. `npm install` installs the dependencies declared in that file.

## 7. Create the MongoDB connection helper

Create `server/src/config/db.js`:


```js
import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add it to server/.env.");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}
```

## 8. Create the User model

Create `server/src/models/User.js`:


```js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    // select:false keeps the hash out of ordinary queries and API responses.
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
```

## 9. Create the Product model

Create `server/src/models/Product.js`:


```js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
```

## 10. Create the Order model

Create `server/src/models/Order.js`:


```js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    // Snapshot name and price so history remains accurate after catalogue edits.
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 20 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "An order needs at least one item.",
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["placed"], default: "placed" },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
```

An order stores the product name and unit price as snapshots. If a product's price changes later, old orders still display the original purchase price.

## 11. Create JWT authentication middleware

Create `server/src/middleware/requireAuth.js`:


```js
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authorization = req.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET);
    if (typeof payload !== "object" || typeof payload.sub !== "string") {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
```

The browser sends `Authorization: Bearer <token>`. The middleware verifies the token and attaches its user ID to `req.userId`. Never accept an order owner ID from the browser.

## 12. Create registration and login routes

Create `server/src/routes/authRoutes.js`:


```js
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const router = Router();

function createToken(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }
    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({ message: "A valid email is required." });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    return res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
    const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;

    // Use one message for unknown email and wrong password.
    if (!user || !validPassword) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    return res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

export default router;
```

How it works:

1. Registration validates fields, normalizes the email, and rejects duplicate accounts.
2. `bcrypt.hash()` stores a password hash instead of a plain-text password.
3. Login loads the hash explicitly and uses `bcrypt.compare()`.
4. The server signs a JWT with a two-hour expiry.
5. The API returns only public user details; it never returns `passwordHash`.

## 13. Create the product-list route

Create `server/src/routes/productRoutes.js`:


```js
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
```

## 14. Create protected order routes

Create `server/src/routes/orderRoutes.js`:


```js
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
```

Two important rules are demonstrated here:

- The browser submits **only** product IDs and quantities. The backend looks up active product prices from MongoDB and calculates the total.
- `GET /api/orders` queries by `user: req.userId`, so the signed-in user can only retrieve their own orders.

## 15. Seed demo products

Create `server/src/seed/seedProducts.js`:


```js
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
```

The seed script uses an upsert by `slug`. Running it more than once updates the demo products instead of deleting the collection.

## 16. Connect all routes and start Express

Create `server/src/server.js`:


```js
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
  if (res.headersSent) return next(error);
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
```

## 17. Start the backend and check it

From the `shoplite/server` folder:

```bash
npm run seed
npm run dev
```

Keep this terminal open. If startup fails, fix the error before continuing. In a browser or API client, check:

- `GET http://localhost:5000/api/health` — should return `{"status":"ok","service":"shoplite-api"}`.
- `GET http://localhost:5000/api/products` — should return `{ "products": [...] }` with the eight seed products.

### Test registration

Send a `POST` request to `http://localhost:5000/api/auth/register` with `Content-Type: application/json` and this body:

```json
{
  "name": "Demo Student",
  "email": "student@example.com",
  "password": "classroom123"
}
```

Expected: `201 Created`, with a `token` and a `user` object. The response must not include `passwordHash`.

### Test login

Send a `POST` request to `http://localhost:5000/api/auth/login`:

```json
{
  "email": "student@example.com",
  "password": "classroom123"
}
```

Expected: `200 OK` with a `token` and `user`. Try an incorrect password too; it should return `401`.

---

# Part B — Build the React frontend

## 18. Create the React app

Open a **second terminal** in the `shoplite` root folder. If you already created `client` with Vite, skip the scaffold command and continue to Step 19.

```bash
npm create vite@latest client -- --template react
cd client
npm install
```

Create these additional source folders inside `client` before creating the component files:

**macOS / Linux:**

```bash
mkdir -p src/auth src/components src/utils
```

**Windows PowerShell:**

```powershell
New-Item -ItemType Directory -Force -Path 'src/auth','src/components','src/utils' | Out-Null
```

The complete `package.json` for the frontend should contain the usual Vite and React dependencies. If you scaffolded the app with Vite, keep the versions created by the scaffold. The code in this README uses standard React and Vite APIs.

If creating the package by hand, use this `client/package.json`:


```json
{
  "name": "shoplite-client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {}
}
```

Then run `npm install` in `client` before starting the app.

## 19. Configure the frontend API URL

Create `client/.env.example`:


```dotenv
VITE_API_URL=http://localhost:5000
```

Create `client/.env` with the same content. This URL is public browser configuration; **never put `MONGODB_URI` or `JWT_SECRET` in a `VITE_` variable**. Restart Vite after changing `.env`.

## 20. Replace the HTML entry file

Replace `client/index.html` with:


```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#6137b8" />
    <meta name="description" content="ShopLite is a student-built full-stack demo store." />
    <title>ShopLite — Everyday finds</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## 20.1 Configure Vite for React

Create `client/vite.config.js`:


```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

## 21. Create the reusable API helper

Create `client/src/api.js`:


```js
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  const { token, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers ?? {});

  if (fetchOptions.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const body =
    fetchOptions.body !== undefined && typeof fetchOptions.body !== "string"
      ? JSON.stringify(fetchOptions.body)
      : fetchOptions.body;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers, body });
  } catch {
    throw new Error("Cannot reach the API. Check that the backend is running.");
  }

  const data = response.status === 204
    ? null
    : await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status}).`);
  }
  return data;
}
```

This helper builds JSON requests, attaches a Bearer token when supplied, parses API responses, and shows useful error messages.

## 22. Create the currency formatter

Create `client/src/utils/formatPrice.js`:


```js
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatPrice(value) {
  return inr.format(Number(value) || 0);
}
```

## 23. Create the authentication context

Create `client/src/auth/AuthContext.jsx`:


```jsx
import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "shoplite_session";

function readStoredSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (stored?.token && stored?.user) return stored;
  } catch {
    // If local storage is empty or malformed, begin signed out.
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(readStoredSession);

  function setSession(nextSession) {
    const safeSession = { token: nextSession.token, user: nextSession.user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeSession));
    setSessionState(safeSession);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setSessionState({ token: null, user: null });
  }

  const value = useMemo(
    () => ({ ...session, setSession, logout }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
```

For this classroom project, the token is kept in `localStorage` so students can refresh the page without signing in again. Any JavaScript running on the page can potentially read local storage, so this is **not a production recommendation**. A production app should make a considered session-storage design, commonly using secure `HttpOnly` cookies plus appropriate CSRF defenses. Never store card data here.

## 24. Create the navigation bar

Create `client/src/components/Navbar.jsx`:


```jsx
export default function Navbar({ activeView, onNavigate, cartCount, user, onLogout }) {
  const links = [
    { id: "shop", label: "Shop" },
    { id: "cart", label: `Cart (${cartCount})` },
    ...(user ? [{ id: "orders", label: "My orders" }] : []),
  ];

  return (
    <header className="site-header">
      <button className="brand-button" type="button" onClick={() => onNavigate("shop")}>
        <span className="brand-mark">S</span>
        <span>shoplite</span>
      </button>

      <nav className="main-nav" aria-label="Main navigation">
        {links.map((link) => (
          <button
            key={link.id}
            type="button"
            className={`nav-link ${activeView === link.id ? "active" : ""}`}
            aria-current={activeView === link.id ? "page" : undefined}
            onClick={() => onNavigate(link.id)}
          >
            {link.label}
          </button>
        ))}
      </nav>

      <div className="account-area">
        {user ? (
          <>
            <span className="welcome-user">Hi, {user.name}</span>
            <button className="button button-quiet" type="button" onClick={onLogout}>Log out</button>
          </>
        ) : (
          <button className="button button-primary" type="button" onClick={() => onNavigate("auth")}>Log in</button>
        )}
      </div>
    </header>
  );
}
```

## 25. Create the product card

Create `client/src/components/ProductCard.jsx`:


```jsx
import { formatPrice } from "../utils/formatPrice.js";

export default function ProductCard({ product, onAddToCart }) {
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img
          className="product-image"
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}
        />
        <span className="category-tag">{product.category}</span>
      </div>
      <div className="product-content">
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-card-footer">
          <strong>{formatPrice(product.price)}</strong>
          <button className="button button-primary" type="button" onClick={() => onAddToCart(product._id)}>
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
```

## 26. Create the registration and login form

Create `client/src/components/AuthPanel.jsx`:


```jsx
import { useState } from "react";
import { apiRequest } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function AuthPanel({ mode, onModeChange, onSuccess }) {
  const { setSession } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await apiRequest(isRegister ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        body: { ...(isRegister ? { name } : {}), email, password },
      });
      setSession(data);
      setPassword("");
      onSuccess(isRegister ? "Account created. You are signed in." : "Welcome back. You are signed in.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-panel panel">
      <p className="eyebrow">YOUR SHOPLITE ACCOUNT</p>
      <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
      <p className="muted">{isRegister ? "Create an account to save your orders." : "Log in to place an order and view your history."}</p>

      <form className="stack-form" onSubmit={handleSubmit}>
        {isRegister && (
          <label>
            Full name
            <input value={name} onChange={(event) => setName(event.target.value)} name="name" autoComplete="name" maxLength={80} required />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} name="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} name="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={8} required />
          {isRegister && <span className="field-help">Use at least 8 characters.</span>}
        </label>

        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <button className="button button-primary button-wide" type="submit" disabled={submitting}>
          {submitting ? "Please wait…" : isRegister ? "Create account" : "Log in"}
        </button>
      </form>

      <p className="form-switch">
        {isRegister ? "Already have an account?" : "New to ShopLite?"}{" "}
        <button className="text-button" type="button" onClick={() => { setError(""); onModeChange(isRegister ? "login" : "register"); }}>
          {isRegister ? "Log in" : "Create an account"}
        </button>
      </p>
    </section>
  );
}
```

## 27. Create the cart view

Create `client/src/components/CartPanel.jsx`:


```jsx
import { formatPrice } from "../utils/formatPrice.js";

export default function CartPanel({ cart, products, onUpdateQuantity, onRemove, onCheckout, submitting }) {
  const lines = cart
    .map((line) => ({ ...line, product: products.find((product) => product._id === line.productId) }))
    .filter((line) => line.product);

  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  return (
    <section>
      <div className="section-heading">
        <div><p className="eyebrow">YOUR SELECTION</p><h1>Shopping cart</h1></div>
        <p className="muted">{lines.length} product type(s)</p>
      </div>

      {lines.length === 0 ? (
        <div className="empty-state panel"><h2>Your cart is empty</h2><p className="muted">Browse the store and add something you like.</p></div>
      ) : (
        <div className="cart-layout">
          <div className="cart-lines">
            {lines.map(({ product, productId, quantity }) => (
              <article className="cart-line panel" key={productId}>
                <img src={product.imageUrl} alt={product.name} className="cart-thumb" />
                <div className="cart-line-info">
                  <h3>{product.name}</h3>
                  <p className="muted">{formatPrice(product.price)} each</p>
                  <button className="text-button danger-text" type="button" onClick={() => onRemove(productId)}>Remove</button>
                </div>
                <div className="quantity-control" aria-label={`Quantity for ${product.name}`}>
                  <button type="button" aria-label="Decrease quantity" onClick={() => onUpdateQuantity(productId, quantity - 1)}>−</button>
                  <span>{quantity}</span>
                  <button type="button" aria-label="Increase quantity" onClick={() => onUpdateQuantity(productId, quantity + 1)} disabled={quantity >= 20}>+</button>
                </div>
                <strong className="line-total">{formatPrice(product.price * quantity)}</strong>
              </article>
            ))}
          </div>

          <aside className="order-summary panel">
            <h2>Order summary</h2>
            <div className="summary-row"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
            <div className="summary-row"><span>Shipping</span><span>Not included</span></div>
            <hr />
            <p className="field-help">The backend recalculates the total using database prices.</p>
            <button className="button button-primary button-wide" type="button" onClick={onCheckout} disabled={submitting || lines.length === 0}>
              {submitting ? "Placing order…" : "Place demo order"}
            </button>
            <p className="field-help">Demo checkout only; no payment is collected.</p>
          </aside>
        </div>
      )}
    </section>
  );
}
```

## 28. Create order history

Create `client/src/components/OrdersPanel.jsx`:


```jsx
import { useEffect, useState } from "react";
import { apiRequest } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatPrice } from "../utils/formatPrice.js";

export default function OrdersPanel() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    apiRequest("/api/orders", { token })
      .then((data) => { if (!ignore) setOrders(data.orders); })
      .catch((requestError) => { if (!ignore) setError(requestError.message); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [token]);

  if (loading) return <p className="muted">Loading your orders…</p>;
  if (error) return <p className="alert alert-error" role="alert">{error}</p>;

  return (
    <section>
      <p className="eyebrow">ORDER HISTORY</p>
      <h1>My orders</h1>
      {orders.length === 0 ? (
        <div className="empty-state panel"><h2>No orders yet</h2><p className="muted">Your completed demo checkouts will appear here.</p></div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card panel" key={order._id}>
              <div className="order-card-heading">
                <div><p className="field-help">Order ID</p><strong>{order._id}</strong></div>
                <span className="status-pill">{order.status}</span>
              </div>
              <p className="muted">Placed {new Date(order.createdAt).toLocaleString()}</p>
              <ul className="order-items">
                {order.items.map((item, index) => (
                  <li key={`${order._id}-${item.productId}-${index}`}>
                    <span>{item.name} × {item.quantity}</span>
                    <strong>{formatPrice(item.price * item.quantity)}</strong>
                  </li>
                ))}
              </ul>
              <div className="summary-row order-total"><span>Total</span><strong>{formatPrice(order.totalAmount)}</strong></div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
```

## 29. Create the main application

Create `client/src/App.jsx`:


```jsx
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api.js";
import { useAuth } from "./auth/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import ProductCard from "./components/ProductCard.jsx";
import AuthPanel from "./components/AuthPanel.jsx";
import CartPanel from "./components/CartPanel.jsx";
import OrdersPanel from "./components/OrdersPanel.jsx";

function readCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem("shoplite_cart") || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((line) =>
      typeof line.productId === "string" &&
      Number.isInteger(line.quantity) &&
      line.quantity >= 1 && line.quantity <= 20
    );
  } catch {
    return [];
  }
}

export default function App() {
  const { token, user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [cart, setCart] = useState(readCart);
  const [view, setView] = useState("shop");
  const [authMode, setAuthMode] = useState("login");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [notice, setNotice] = useState("");
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    setProductsLoading(true);
    setProductsError("");
    apiRequest("/api/products")
      .then((data) => { if (!ignore) setProducts(data.products); })
      .catch((error) => { if (!ignore) setProductsError(error.message); })
      .finally(() => { if (!ignore) setProductsLoading(false); });
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    localStorage.setItem("shoplite_cart", JSON.stringify(cart));
  }, [cart]);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category).sort())],
    [products]
  );
  const filteredProducts = useMemo(() => {
    const text = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(text) || product.description.toLowerCase().includes(text);
      const matchesCategory = category === "All" || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  function navigate(nextView) {
    if ((nextView === "orders" || nextView === "checkout") && !token) {
      setAuthMode("login");
      setView("auth");
      setNotice("Log in or create an account before continuing.");
      return;
    }
    setNotice("");
    setView(nextView === "checkout" ? "cart" : nextView);
  }

  function addToCart(productId) {
    setCart((current) => {
      const existing = current.find((line) => line.productId === productId);
      if (existing) {
        return current.map((line) => line.productId === productId
          ? { ...line, quantity: Math.min(line.quantity + 1, 20) }
          : line);
      }
      return [...current, { productId, quantity: 1 }];
    });
    setNotice("Added to cart.");
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      setCart((current) => current.filter((line) => line.productId !== productId));
      return;
    }
    if (quantity > 20) return;
    setCart((current) => current.map((line) => line.productId === productId ? { ...line, quantity } : line));
  }

  async function checkout() {
    if (!token) {
      setAuthMode("login");
      setView("auth");
      setNotice("Log in or create an account before checking out.");
      return;
    }
    if (cart.length === 0 || checkoutSubmitting) return;

    setCheckoutSubmitting(true);
    setNotice("");
    try {
      const data = await apiRequest("/api/orders", {
        method: "POST",
        token,
        body: { items: cart.map(({ productId, quantity }) => ({ productId, quantity })) },
      });
      setCart([]);
      setView("orders");
      setNotice(`Order placed successfully. Reference: ${data.order._id}`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setCheckoutSubmitting(false);
    }
  }

  function handleLogout() {
    logout();
    setView("shop");
    setNotice("You have logged out.");
  }

  function handleAuthSuccess(message) {
    setView("shop");
    setNotice(message);
  }

  return (
    <div className="app-shell">
      <Navbar activeView={view} onNavigate={navigate} cartCount={cartCount} user={user} onLogout={handleLogout} />
      <main className="page-container">
        {notice && <p className="alert alert-info" role="status">{notice}</p>}

        {view === "shop" && (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">GOOD FINDS. EVERYDAY PRICES.</p>
                <h1>Small things.<br /><span>Better everyday.</span></h1>
                <p className="hero-copy">A simple, student-built store for useful things that make daily life easier.</p>
                <button className="button button-primary" type="button" onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}>Explore products</button>
              </div>
              <div className="hero-art" aria-hidden="true">
                <span className="hero-orbit orbit-one" /><span className="hero-orbit orbit-two" />
                <span className="hero-bag">S</span><span className="hero-spark spark-one">✦</span><span className="hero-spark spark-two">✳</span>
              </div>
            </section>

            <section id="products" className="products-section">
              <div className="section-heading">
                <div><p className="eyebrow">THE SHOP</p><h2>Find your next favourite</h2></div>
                <span className="muted">{filteredProducts.length} product(s)</span>
              </div>
              <div className="filter-bar">
                <label className="search-field">
                  <span className="sr-only">Search products</span><span aria-hidden="true">⌕</span>
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products…" />
                </label>
                <label className="category-field">
                  <span className="sr-only">Filter by category</span>
                  <select value={category} onChange={(event) => setCategory(event.target.value)}>
                    {categories.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
              </div>

              {productsLoading && <p className="muted">Loading products…</p>}
              {productsError && <p className="alert alert-error" role="alert">{productsError} Check that the backend is running and MongoDB is connected.</p>}
              {!productsLoading && !productsError && filteredProducts.length === 0 && (
                <div className="empty-state panel"><h3>No products found</h3><p className="muted">Try another search or category.</p></div>
              )}
              {!productsLoading && !productsError && filteredProducts.length > 0 && (
                <div className="product-grid">{filteredProducts.map((product) => <ProductCard key={product._id} product={product} onAddToCart={addToCart} />)}</div>
              )}
            </section>
          </>
        )}

        {view === "cart" && (
          <CartPanel cart={cart} products={products} onUpdateQuantity={updateQuantity}
            onRemove={(productId) => setCart((current) => current.filter((line) => line.productId !== productId))}
            onCheckout={checkout} submitting={checkoutSubmitting} />
        )}
        {view === "auth" && <AuthPanel mode={authMode} onModeChange={setAuthMode} onSuccess={handleAuthSuccess} />}
        {view === "orders" && token && <OrdersPanel />}
      </main>
      <footer className="site-footer">
        <strong>shoplite</strong><span>A full-stack learning project by CodeEmy.</span><span>Demo checkout only · No real payments</span>
      </footer>
    </div>
  );
}
```

The main component loads products from Express, maintains search/category/cart state, sends order requests, and switches between the Shop, Cart, Auth, and Orders views.

## 30. Mount React and the authentication provider

Replace `client/src/main.jsx` with:


```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
```

## 31. Add all styling

Replace `client/src/styles.css` with this complete stylesheet:


```css
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap");

:root {
  font-family: "DM Sans", system-ui, sans-serif;
  color: #211b2e;
  background: #faf9fc;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  --purple: #6137b8;
  --purple-dark: #301c5c;
  --purple-soft: #eee8fb;
  --ink: #211b2e;
  --muted: #766f83;
  --line: #e8e3ee;
  --surface: #fff;
  --radius: 18px;
  --shadow: 0 12px 35px rgba(42, 25, 73, 0.07);
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; min-width: 320px; }
button, input, select { font: inherit; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: 0.55; }
h1, h2, h3, p { margin-top: 0; }
h1, h2, h3 { font-family: "Manrope", system-ui, sans-serif; letter-spacing: -0.035em; }
h1 { font-size: clamp(2rem, 4.2vw, 3.4rem); line-height: 1.08; margin-bottom: 14px; }
h2 { font-size: clamp(1.5rem, 3vw, 2.2rem); margin-bottom: 12px; }
h3 { font-size: 1.06rem; }

.app-shell { min-height: 100vh; display: flex; flex-direction: column; }
.site-header { display: flex; align-items: center; gap: 28px; min-height: 76px; padding: 14px clamp(18px, 5vw, 72px); background: #fff; border-bottom: 1px solid var(--line); }
.brand-button { display: inline-flex; align-items: center; gap: 10px; padding: 0; border: 0; background: transparent; color: var(--purple-dark); font: 800 1.15rem "Manrope", sans-serif; letter-spacing: -0.04em; }
.brand-mark { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 11px; color: #fff; background: var(--purple); }
.main-nav { display: flex; gap: 8px; margin-left: auto; }
.nav-link { padding: 10px 12px; border: 0; border-radius: 10px; color: var(--muted); background: transparent; font-size: 0.9rem; font-weight: 700; }
.nav-link:hover, .nav-link.active { color: var(--purple-dark); background: var(--purple-soft); }
.account-area { display: flex; align-items: center; gap: 14px; }
.welcome-user { color: var(--muted); font-size: 0.9rem; }
.page-container { width: min(1180px, calc(100% - 40px)); margin: 0 auto; min-height: calc(100vh - 155px); padding: 26px 0 76px; flex: 1; }
.hero { min-height: 340px; padding: clamp(28px, 5vw, 62px); border-radius: 28px; background: linear-gradient(115deg, #f0e9fc 0%, #f8f4ff 52%, #eee6fb 100%); display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 28px; overflow: hidden; position: relative; }
.hero h1 { color: var(--purple-dark); }
.hero h1 span { color: var(--purple); }
.hero-copy { max-width: 450px; color: #6f6480; line-height: 1.7; margin-bottom: 24px; }
.eyebrow { color: var(--purple); font-size: 0.73rem; font-weight: 800; letter-spacing: 0.14em; margin-bottom: 11px; }
.hero-art { min-height: 230px; position: relative; display: grid; place-items: center; }
.hero-orbit { position: absolute; border: 1px solid rgba(97,55,184,0.2); border-radius: 50%; }
.orbit-one { width: 290px; height: 290px; }
.orbit-two { width: 220px; height: 220px; }
.hero-bag { display: grid; place-items: center; width: 136px; height: 144px; color: #fff; font-family: "Manrope", sans-serif; font-size: 4.2rem; font-weight: 800; border-radius: 24px 24px 40px 40px; background: linear-gradient(145deg, #8459d7, #4a2595); box-shadow: 0 22px 35px rgba(74,37,149,0.25); transform: rotate(-7deg); }
.hero-spark { position: absolute; color: var(--purple); }
.spark-one { font-size: 2.3rem; top: 15%; right: 12%; }
.spark-two { font-size: 2rem; bottom: 12%; left: 12%; }
.products-section { padding-top: 48px; }
.section-heading { display: flex; justify-content: space-between; align-items: end; gap: 20px; margin-bottom: 22px; }
.section-heading h1, .section-heading h2 { margin-bottom: 0; }
.muted { color: var(--muted); }
.filter-bar { display: flex; gap: 12px; margin-bottom: 22px; }
.search-field, .category-field { min-height: 46px; display: flex; align-items: center; gap: 10px; padding: 0 14px; border: 1px solid var(--line); border-radius: 12px; background: #fff; color: var(--muted); }
.search-field { flex: 1; max-width: 520px; font-size: 1.35rem; }
.search-field input { border: 0; outline: 0; flex: 1; width: 100%; color: var(--ink); font-size: 0.95rem; background: transparent; }
.category-field select { border: 0; outline: 0; min-width: 150px; color: var(--ink); background: transparent; }
.product-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
.product-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; transition: transform 180ms ease, box-shadow 180ms ease; }
.product-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
.product-image-wrap { height: 190px; background: linear-gradient(140deg, #f4f0fa, #eee7f8); position: relative; overflow: hidden; }
.product-image { width: 100%; height: 100%; object-fit: cover; }
.category-tag { position: absolute; left: 12px; top: 12px; padding: 6px 10px; background: rgba(255,255,255,0.92); color: var(--purple-dark); border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
.product-content { padding: 16px; }
.product-content h3 { margin-bottom: 7px; }
.product-description { min-height: 42px; color: var(--muted); font-size: 0.88rem; line-height: 1.5; margin-bottom: 18px; }
.product-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.product-card-footer strong { font-size: 0.97rem; white-space: nowrap; }
.button { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; padding: 10px 15px; border-radius: 11px; border: 1px solid transparent; font-weight: 700; font-size: 0.88rem; transition: background 160ms ease, transform 160ms ease; }
.button:active { transform: translateY(1px); }
.button-primary { color: #fff; background: var(--purple); }
.button-primary:hover { background: #4e299e; }
.button-quiet { border-color: var(--line); background: #fff; color: var(--ink); }
.button-quiet:hover { background: #f7f4fb; }
.button-wide { width: 100%; }
.text-button { padding: 0; border: 0; background: transparent; color: var(--purple); font-weight: 700; }
.text-button:hover { text-decoration: underline; }
.danger-text { color: #b42336; }
.panel { border: 1px solid var(--line); border-radius: var(--radius); background: #fff; box-shadow: var(--shadow); }
.alert { padding: 12px 15px; border-radius: 12px; line-height: 1.45; overflow-wrap: anywhere; }
.alert-info { color: #39265f; background: #f0eafb; border: 1px solid #e0d5f8; }
.alert-error { color: #8d1b2c; background: #fff0f1; border: 1px solid #ffd4d9; }
.empty-state { padding: 42px 24px; text-align: center; }
.empty-state h2, .empty-state h3 { margin-bottom: 8px; }
.auth-panel { max-width: 480px; margin: 34px auto 0; padding: clamp(24px, 5vw, 38px); }
.auth-panel h1 { font-size: 2.1rem; margin-bottom: 12px; }
.stack-form { display: grid; gap: 16px; margin-top: 24px; }
.stack-form label { display: grid; gap: 8px; font-size: 0.88rem; font-weight: 700; }
.stack-form input { width: 100%; min-height: 44px; padding: 10px 12px; border: 1px solid #dcd5e5; border-radius: 10px; outline: none; background: #fff; color: var(--ink); font-weight: 400; }
.stack-form input:focus { border-color: var(--purple); box-shadow: 0 0 0 3px rgba(97,55,184,0.12); }
.field-help { color: var(--muted); font-size: 0.78rem; line-height: 1.45; }
.form-switch { margin: 20px 0 0; text-align: center; font-size: 0.9rem; color: var(--muted); }
.cart-layout { display: grid; grid-template-columns: minmax(0, 1fr) 310px; gap: 20px; align-items: start; }
.cart-lines { display: grid; gap: 12px; }
.cart-line { padding: 14px; display: grid; grid-template-columns: 88px minmax(0,1fr) auto auto; gap: 16px; align-items: center; box-shadow: none; }
.cart-thumb { width: 88px; height: 82px; object-fit: cover; border-radius: 12px; background: #f0eafa; }
.cart-line h3 { margin: 0 0 6px; }
.cart-line-info p { margin-bottom: 7px; font-size: 0.85rem; }
.quantity-control { display: flex; align-items: center; gap: 11px; border: 1px solid var(--line); border-radius: 10px; padding: 4px 7px; }
.quantity-control button { border: 0; background: transparent; color: var(--purple); font-size: 1.1rem; min-width: 22px; }
.line-total { min-width: 86px; text-align: right; }
.order-summary { padding: 22px; }
.order-summary h2 { font-size: 1.3rem; margin-bottom: 22px; }
.summary-row { display: flex; justify-content: space-between; align-items: center; gap: 14px; margin: 12px 0; }
.order-summary hr { border: 0; border-top: 1px solid var(--line); margin: 18px 0; }
.order-summary .field-help { margin: 12px 0; }
.orders-list { display: grid; gap: 16px; margin-top: 24px; }
.order-card { padding: 22px; box-shadow: none; }
.order-card-heading { display: flex; justify-content: space-between; align-items: start; gap: 18px; }
.order-card-heading strong { overflow-wrap: anywhere; font-size: 0.85rem; }
.status-pill { padding: 6px 10px; border-radius: 999px; color: #236b45; background: #e9f7ee; text-transform: capitalize; font-size: 0.78rem; font-weight: 700; }
.order-items { list-style: none; margin: 18px 0; padding: 0; border-top: 1px solid var(--line); }
.order-items li { display: flex; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--line); font-size: 0.9rem; }
.order-total { padding-top: 6px; font-size: 1.05rem; }
.site-footer { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 22px clamp(18px, 5vw, 72px); border-top: 1px solid var(--line); color: var(--muted); font-size: 0.8rem; background: #fff; }
.site-footer strong { color: var(--purple-dark); font-family: "Manrope", sans-serif; font-size: 1rem; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

@media (max-width: 1000px) {
  .product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .cart-layout { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .site-header { flex-wrap: wrap; gap: 12px; }
  .brand-button { margin-right: auto; }
  .main-nav { order: 3; width: 100%; justify-content: center; }
  .account-area { gap: 8px; }
  .welcome-user { display: none; }
  .hero { grid-template-columns: 1fr; }
  .hero-art { min-height: 190px; }
  .orbit-one { width: 230px; height: 230px; }
  .orbit-two { width: 170px; height: 170px; }
  .hero-bag { width: 105px; height: 112px; font-size: 3rem; }
  .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .product-image-wrap { height: 150px; }
  .product-content { padding: 12px; }
  .product-card-footer { align-items: start; flex-direction: column; }
  .product-card-footer .button { width: 100%; }
  .cart-line { grid-template-columns: 70px minmax(0,1fr) auto; gap: 10px; }
  .cart-thumb { width: 70px; height: 70px; }
  .quantity-control { grid-column: 2; justify-self: start; }
  .line-total { grid-column: 3; grid-row: 1 / span 2; min-width: auto; }
  .site-footer { align-items: start; flex-direction: column; gap: 7px; }
}
@media (max-width: 420px) {
  .page-container { width: min(calc(100% - 24px), 1180px); }
  .product-grid { grid-template-columns: 1fr; }
  .product-image-wrap { height: 210px; }
  .filter-bar { flex-direction: column; }
  .category-field, .category-field select { width: 100%; }
  .category-field select { min-height: 40px; }
  .section-heading { align-items: start; flex-direction: column; }
}
```

---

# Part C — Run the complete application

## 32. Start both servers

Use two terminals. Do not stop the backend terminal while using the frontend.

**Terminal 1 — API and MongoDB connection** (from `shoplite/server`):

```bash
npm run seed
npm run dev
```

Run `npm run seed` again only if you need to add/update the sample catalogue. You do not need to reseed after each restart.

**Terminal 2 — React app** (from `shoplite/client`):

```bash
npm run dev
```

Open the local URL that Vite prints; normally `http://localhost:5173`.

## 33. Test the full user journey

Run these tests in order:

1. The shop displays products from MongoDB.
2. Search for `watch`; the product list filters immediately.
3. Choose a category; only matching products remain.
4. Add two different items to the cart.
5. Increase/decrease quantities and remove an item; the subtotal updates.
6. Click **Log in** and switch to **Create an account**.
7. Register a test user with a valid email and a password of at least eight characters.
8. After registration, return to the cart and place a demo order.
9. Open **My orders**; the order and total should appear.
10. Refresh the browser; the classroom session should still be present.
11. Log out; **My orders** should no longer be in the navigation.
12. Register a second user, place an order, and check that each account only sees its own order history.

## 34. API endpoints

| Method | Endpoint | Auth required? | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | No | Health check |
| `GET` | `/api/products` | No | Active product catalogue |
| `POST` | `/api/auth/register` | No | Register and return JWT |
| `POST` | `/api/auth/login` | No | Log in and return JWT |
| `POST` | `/api/orders` | Yes | Create order from IDs and quantities |
| `GET` | `/api/orders` | Yes | Current user's order history |

For an API client, call a protected endpoint with this header:

```text
Authorization: Bearer YOUR_TOKEN_HERE
```

`POST /api/orders` expects:

```json
{
  "items": [
    { "productId": "COPY_A_REAL_PRODUCT_MONGODB_ID_HERE", "quantity": 2 }
  ]
}
```

Use a real `_id` from `GET /api/products`. The body intentionally has no price or total.

## 35. Common errors and fixes

### `MONGODB_URI is missing`

Ensure `shoplite/server/.env` exists and contains `MONGODB_URI=...`. The file must be in the `server` folder, not `client`.

### MongoDB connection timeout

For local MongoDB, confirm the service is running and that the URI uses `127.0.0.1:27017`. For Atlas, verify the database user, password encoding, and network access/IP allow-list.

### `JWT_SECRET must be set...`

Set `JWT_SECRET` in `server/.env` to a random value of at least 32 characters, then restart the backend. Never expose it in frontend code.

### CORS error or `Failed to fetch`

Keep the backend at port 5000 and Vite at port 5173, or update `CLIENT_ORIGIN` and `VITE_API_URL` to match your actual ports. Restart both servers after editing env files.

### No product cards appear

Check that `npm run seed` completed, MongoDB contains products, and `GET http://localhost:5000/api/products` returns `{ "products": [...] }`.

### Duplicate email

Registration returns `409` for an email already in the database. Use a different email or log in with the existing account.

### `401 Please log in to continue`

Log in again. The JWT expires after two hours; logging out and logging back in obtains a new token.

### Product image does not load

This sample uses remote Unsplash image URLs, which require an internet connection. Try another `imageUrl` or use local images from `client/public`.

### Port already in use

Stop the process using the port, or change `PORT` in `server/.env` and `VITE_API_URL` in `client/.env` to the matching backend port.

## 36. Security notes for students

- Never store plain-text passwords. This project stores bcrypt hashes.
- Never send `JWT_SECRET` or the MongoDB URI to the browser.
- Validate user input on the server even when the React form has validation.
- Never trust a client-supplied total or product price.
- Enforce order ownership in database queries, not just in the frontend.
- This is a teaching demo, not a production e-commerce platform. Before real deployment, add rate limits, stronger validation, a robust secret-management plan, secure cookie/session design, audit logging, monitoring, and a full security review. Use a payment provider rather than collecting card data directly.

## 37. Suggested three-session classroom schedule

### Day 1 — Storefront and cart (90 min)

- 0–10: Architecture, UI sketch, and component plan.
- 10–25: Vite app setup, React entry point, and CSS.
- 25–45: Product card and product grid.
- 45–60: Search, categories, and empty state.
- 60–80: Cart, quantity controls, removal, and subtotal.
- 80–90: Responsive check and recap.

### Day 2 — Express, MongoDB, and auth API (90 min)

- 0–10: Client/server/database request flow.
- 10–25: Express setup, environment variables, and MongoDB connection.
- 25–40: User/Product/Order models and product seeding.
- 40–65: Registration, password hashing, login, JWT, and middleware.
- 65–80: Product and order endpoints.
- 80–90: Test endpoints with Postman/Thunder Client.

### Day 3 — Connect React, checkout, and order history (90 min)

- 0–15: API helper and load products from MongoDB.
- 15–30: Registration/login UI and auth context.
- 30–45: Bearer token requests and protected order creation.
- 45–60: Order history and user ownership.
- 60–75: End-to-end testing and debugging.
- 75–90: Student challenge and review.

## 38. Final checklist

- [ ] Backend starts without errors.
- [ ] MongoDB is connected.
- [ ] Product seed succeeds.
- [ ] Product list loads in React.
- [ ] Search and category filtering work.
- [ ] Cart quantities and subtotal work.
- [ ] Register and login work.
- [ ] Password hashes—not plain-text passwords—are stored.
- [ ] Protected checkout requires a valid token.
- [ ] Order totals are calculated by the backend.
- [ ] Orders persist in MongoDB.
- [ ] Users only see their own orders.
- [ ] No secrets are committed or exposed in frontend variables.

**Congratulations — you have built ShopLite from an empty workspace into a working React + Express + MongoDB learning application.**
