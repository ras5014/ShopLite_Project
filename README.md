# ShopLite - Learn full-stack development in clear stages

**CodeEmy | React + React Hook Form + TanStack Query + Vite + Node.js + Express + MongoDB**

ShopLite is a small online shop for students who already know basic HTML, CSS and JavaScript.
This guide contains the **complete application source**, setup instructions, exercises and optional automated tests.
The code listings below match the files in this project.

> **React displays. Express checks. MongoDB stores.**

## What stays in the project

- A responsive product catalogue with search and category filters.
- A browser-saved cart with add, remove, quantities and subtotal.
- Account registration, login and logout.
- Password hashing and signed JWT authentication.
- Protected demo checkout using prices loaded by the server.
- Saved order history visible only to the signed-in user.

**Not included:** real payments, stock reservations, shipping, admin screens or production deployment.
No money is collected when you place a demo order.

## How to use the learning stages

| Stage | Main question | Concepts |
|---|---|---|
| 0. Prepare | What do we need to run two programs? | Folders, packages, configuration |
| 1. Products | How does the server return products? | Schema, model, route, JSON |
| 2. Browser and cart | How does a click change the screen? | Components, props, local state, queries |
| 3. Accounts | How do we recognize a customer? | React Hook Form, mutations, hashing, context, JWT |
| 4. Orders | How do we save a trusted purchase? | Middleware, validation, private query cache |
| 5. Connect the pieces | How does the whole app run? | QueryClientProvider, cart effect, route mounting |
| 6. Verify | How do we know it still works? | Manual checks and optional tests |

These are **teaching stages within one complete application**, not separate incomplete versions.
If you are building from an empty folder, create every application file in Stages 0-5 before running the complete app.
Some files import modules introduced in a later stage. Do not remove those imports to run a half-built project.
There are no placeholder handlers or disabled features in the final code.

If you already have this project, do not recreate or overwrite its files: use the quick-start below and read the stages alongside the running app.

### What was simplified for beginners

- Ordinary loops replace unnecessary Set/Map construction and reduce-based totals.
- React Hook Form handles form values and validation instead of a state variable for each input.
- TanStack Query handles server data, loading, errors and caching instead of request effects.
- Simple if statements replace nested ternaries and conditional object spreads.
- State-derived values are calculated directly; this small catalogue does not need useMemo.
- JSX and event handlers are spaced out so students can follow one action at a time.
- Stage comments identify the main responsibilities without commenting every line.
- Security checks stay in place: simpler code does **not** mean trusting the browser.

We still use map/filter/find where they clearly express a list operation, and functional state setters when the next cart depends on its previous value.

### Three kinds of state, three simple tools

| Kind of data | Tool | Example |
|---|---|---|
| Local UI choices | React useState | Search text, category, current panel, cart |
| Form input and validation | React Hook Form useForm | Name, email, password and field errors |
| Data from / sent to the API | TanStack Query | Products, order history and submitted requests |

**React Query** is now called **TanStack Query**; this project uses **@tanstack/react-query v5**, not the older react-query package.
It still calls the existing apiRequest helper and the same Express API. No backend framework or endpoint changed.
React Hook Form v7 is installed as **react-hook-form**. No schema-validation library is needed for these three simple fields.

## A simple mental model

Imagine a neighbourhood shop:

| Shop idea | Application part | Job |
|---|---|---|
| Counter/display | React in the browser | Show products and collect input |
| Shopkeeper | Express running on Node.js | Check requests and apply rules |
| Record book | MongoDB | Keep products, users and orders |

~~~text
Browser (React)
    -> HTTP request
Express API (Node.js)
    -> Mongoose query
MongoDB
    -> query result -> JSON response -> Query cache -> updated React screen
~~~

React does not connect directly to MongoDB. The browser also does not decide the trusted order total.

## Quick start for an existing checkout

1. Install Node.js and make MongoDB available (local MongoDB or Atlas).
2. Configure the local environment using the table in Stage 0.
3. Open two terminals at the project root.
4. Install dependencies and seed **only a disposable classroom database**.
5. Start the two programs and visit the URL printed by Vite.

**Terminal A - backend (PowerShell):**

~~~powershell
Set-Location .\server
npm.cmd ci
npm.cmd run seed
npm.cmd run dev
~~~

**Terminal B - frontend (PowerShell):**

~~~powershell
Set-Location .\client
npm.cmd ci
npm.cmd run dev
~~~

The checked-in lockfiles make **npm ci** repeatable. When building from scratch without lockfiles, use **npm.cmd install** instead.
Use **npm** on macOS/Linux; **npm.cmd** is the Windows launcher and avoids the common PowerShell npm.ps1 execution-policy error.

Default addresses:

- Frontend: http://localhost:5173
- API health: http://localhost:5000/api/health
- Products: http://localhost:5000/api/products

### Classroom timing: three 90-minute days

| Day | Teach | Practical task |
|---|---|---|
| 1 | Working demo, components, local state, product query and cart | Change a label and verify cart behavior |
| 2 | Product API, JSON, MongoDB models and React Hook Form | Inspect a request and trigger field validation |
| 3 | Login mutation, token checks, checkout and private order queries | Place orders and compare two users |

Install dependencies and rehearse **before class**. In 4.5 hours, teach a guided walkthrough and small edits rather than typing every file.
The [teaching guide](./teaching/Teaching_Guide.md) includes timings and discussion questions.
The earlier slide deck explains the same features, but its code screenshots/excerpts predate this refactor; use the exact source below for live coding.

---

# Stage 0 - Prepare the project

## Requirements

- Node.js LTS compatible with the installed Vite version; Node.js 24 was used for validation.
- npm (included with Node.js).
- MongoDB, either local or Atlas, for normal app use.
- A code editor and modern browser.

Check the tools:

~~~powershell
node --version
npm.cmd --version
~~~

The frontend manifest uses latest versions, so retain the supplied lockfiles for a predictable classroom install.
Do not upgrade dependencies in the middle of a lesson.

## Starting from an empty directory

Run this only for a **new copy**, not inside an already complete checkout:

~~~powershell
New-Item -ItemType Directory -Path ShopLite
Set-Location .\ShopLite
New-Item -ItemType Directory -Force -Path `
  'server\src\config', 'server\src\models', 'server\src\routes', `
  'server\src\middleware', 'server\src\seed', `
  'client\src\components', 'client\src\auth', 'client\src\utils', `
  'server\tests', 'client\tests' | Out-Null
~~~

Do not run a scaffolder over these files. The Vite configuration and entry point are included below.
Tests are an optional instructor appendix; the main application does not import them.

## Configure local settings

Create a local **server/.env** in your editor and add settings using the variable names below.
Use your own connection details and a newly generated secret; never copy live credentials into a README, screenshot or repository.

| Variable | Meaning | Local development guidance |
|---|---|---|
| PORT | API listening port | 5000 |
| CLIENT_ORIGIN | Browser origin allowed by CORS | http://localhost:5173 |
| MONGODB_URI | MongoDB connection string | Point to a disposable shoplite classroom database; local MongoDB normally listens at 127.0.0.1:27017 |
| JWT_SECRET | Secret used to sign/verify tokens | Random value of at least 32 characters; keep it server-side |

Generate a signing secret locally:

~~~powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
~~~

Paste the generated value into your local server setting, not into source code.
For Atlas, use your own database connection string and the appropriate network access configuration.

The frontend defaults to the API at http://localhost:5000.
If needed, create **client/.env** and set **VITE_API_URL** to your API origin.
Vite variables are public browser configuration: **never put a database URI or signing secret there**.
Restart the affected dev server after changing configuration.

If Vite selects a different port, align CLIENT_ORIGIN with the actual browser origin.
The localhost and 127.0.0.1 hostnames are different origins; choose consistently.

### Create [.gitignore](./.gitignore)

Keep dependencies, generated builds, local secrets and test output out of version control.

<!-- source: .gitignore -->
~~~gitignore
node_modules/
dist/
.env
.DS_Store
test-results/
playwright-report/
~~~

### Create [server/package.json](./server/package.json)

The backend scripts run the server, seed example products and run optional tests. mongodb-memory-server is test-only; normal app use still requires your configured MongoDB.

<!-- source: server/package.json -->
~~~json
{
  "name": "shoplite-server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "seed": "node src/seed/seedProducts.js",
    "test": "node --test --test-concurrency=1 tests/*.test.js"
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
    "nodemon": "^3.1.10",
    "mongodb-memory-server": "^10.1.4"
  }
}
~~~

### Create [client/package.json](./client/package.json)

Vite runs/builds React. react-hook-form manages auth forms; @tanstack/react-query manages API reads and writes. Playwright is a development-only browser test runner.

<!-- source: client/package.json -->
~~~json
{
  "name": "shoplite-client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "playwright test"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "react": "latest",
    "react-dom": "latest",
    "react-hook-form": "^7.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.51.0"
  }
}
~~~

After creating the manifests, run npm.cmd install once in each directory.
Continue creating the source files below before starting the complete app.

---

# Stage 1 - Products: model -> route -> JSON

A **schema** describes fields and validation. A **model** gives us operations such as find and create.
A **route** handles an HTTP method and path.

The catalogue route reads active products and responds with an object containing a products array.
The browser must read **data.products**, not treat the whole response object as an array.

### Create [server/src/config/db.js](./server/src/config/db.js)

Connect to the configured database. Missing configuration and connection failures are errors, not a successful empty shop.

<!-- source: server/src/config/db.js -->
~~~javascript
import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add it to server/.env.");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}
~~~

### Create [server/src/models/Product.js](./server/src/models/Product.js)

One product document describes one catalogue item. active controls availability; it is not a stock count.

<!-- source: server/src/models/Product.js -->
~~~javascript
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
~~~

### Create [server/src/routes/productRoutes.js](./server/src/routes/productRoutes.js)

Read this route from top to bottom: query active products, sort by name, send JSON. Express 5 forwards rejected async handlers to the error middleware.

<!-- source: server/src/routes/productRoutes.js -->
~~~javascript
import { Router } from "express";
import { Product } from "../models/Product.js";

const router = Router();

// Stage 1: Express 5 sends rejected async handlers to the error middleware.
router.get("/", async (req, res) => {
  const products = await Product.find({ active: true }).sort({ name: 1 }).lean();
  res.json({ products });
});

export default router;
~~~

### Create [server/src/seed/seedProducts.js](./server/src/seed/seedProducts.js)

Seed eight classroom products. The script upserts by slug: it may overwrite fields of matching products, but it does not reset users or orders. Run it only against the intended disposable database.

<!-- source: server/src/seed/seedProducts.js -->
~~~javascript
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
    const operations = [];
    for (const product of products) {
      operations.push({
        updateOne: {
          filter: { slug: product.slug },
          update: { $set: product },
          upsert: true,
        },
      });
    }
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
~~~

### Explain and check

- What does await wait for? The database query's promise.
- Why return { products }? The frontend and backend agree on that response shape.
- What does active mean? Whether the item is currently available to browse/buy.
- Do we need a user account to read products? No.

After Stage 5 is assembled, run the seed script, open /api/products and locate the Insulated Bottle.
Its default price is INR 799; the database stores a number, not formatted currency text.

---

# Stage 2 - Browser pieces and the cart

A **component** is a function that returns UI. **Props** are its inputs.
An event callback tells the parent what the user did.

The cart stores product IDs and quantities in browser state and localStorage.
It is not a MongoDB order. Adding a product does not call the order API.

The products query uses **queryKey: ["products"]** as its cache label and a **queryFn** that calls the API.
Read the result through productsQuery.data.products. Use isPending, isError and isSuccess for UI states.
Search and category stay as ordinary local state: they are not submitted forms, so they do not need React Hook Form.

### Create [client/src/utils/formatPrice.js](./client/src/utils/formatPrice.js)

Keep INR formatting in one small helper rather than repeating it in every component.

<!-- source: client/src/utils/formatPrice.js -->
~~~javascript
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatPrice(value) {
  return inr.format(Number(value) || 0);
}
~~~

### Create [client/src/api.js](./client/src/api.js)

One helper sends requests and reports failures. Callers pass method, body, token and/or signal. Query functions pass TanStack Query's AbortSignal through this helper to fetch. String bodies and custom headers remain supported.

<!-- source: client/src/api.js -->
~~~javascript
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  const { token, ...requestOptions } = options;
  const headers = new Headers(options.headers);

  if (options.body !== undefined) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (typeof options.body !== "string") {
      requestOptions.body = JSON.stringify(options.body);
    }
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  requestOptions.headers = headers;

  let response;
  try {
    response = await fetch(API_URL + path, requestOptions);
  } catch {
    throw new Error("Cannot reach the API. Check that the backend is running.");
  }

  let data = null;
  if (response.status !== 204) {
    try {
      data = await response.json();
    } catch {
      throw new Error("The API returned an unreadable response. Please try again.");
    }
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    if (data && typeof data.message === "string" && data.message) {
      message = data.message;
    }
    throw new Error(message);
  }
  return data;
}
~~~

### Create [client/src/components/ProductCard.jsx](./client/src/components/ProductCard.jsx)

A card receives a product and an add-to-cart callback. It does not own the whole shop's state.

<!-- source: client/src/components/ProductCard.jsx -->
~~~javascript
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
~~~

### Create [client/src/components/Navbar.jsx](./client/src/components/Navbar.jsx)

Start with Shop and Cart links, then append My orders when there is a user. No conditional array spread is needed.

<!-- source: client/src/components/Navbar.jsx -->
~~~javascript
export default function Navbar({ activeView, onNavigate, cartCount, user, onLogout }) {
  const links = [
    { id: "shop", label: "Shop" },
    { id: "cart", label: `Cart (${cartCount})` },
  ];
  if (user) {
    links.push({ id: "orders", label: "My orders" });
  }

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
~~~

### Create [client/src/components/CartPanel.jsx](./client/src/components/CartPanel.jsx)

A loop matches cart IDs to products and accumulates the subtotal. The component reports changes through callbacks; App owns the actual cart state.

<!-- source: client/src/components/CartPanel.jsx -->
~~~javascript
import { formatPrice } from "../utils/formatPrice.js";

export default function CartPanel({
  cart, products, onUpdateQuantity, onRemove, onCheckout, submitting,
}) {
  const lines = [];
  let subtotal = 0;
  for (const item of cart) {
    const product = products.find((product) => product._id === item.productId);
    if (product) {
      lines.push({ product, productId: item.productId, quantity: item.quantity });
      subtotal += product.price * item.quantity;
    }
  }

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
~~~

### Explain and check

- Props flow into the card; the callback sends the click back to App.
- The cart badge counts total quantity, not distinct product types.
- A quantity is capped at 20. Decreasing to zero removes the item.
- localStorage persists across refreshes in this browser origin.
- The cart stays after logout; it is not a per-account or cross-device cart.
- Search and category filtering use already-loaded browser data, not an API call per keystroke.

**Exercise:** change only the Add to cart button label, verify clicks still work, then restore the label.
App's state and event handlers are introduced in Stage 5, after all the components exist.

---

# Stage 3 - Accounts and shared login state

Registration validates input, hashes the password and saves a user.
Login compares the submitted password against that hash.
Both return a signed token and the public user fields (id, name, email).

Hashing is **not encryption**: the app does not decrypt a password.
A JWT is a **signed pass**, not an encrypted container. Its signature and expiry are checked on protected requests.

### Create [server/src/models/User.js](./server/src/models/User.js)

passwordHash is excluded from ordinary queries. Login explicitly selects it only for password comparison.

<!-- source: server/src/models/User.js -->
~~~javascript
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
~~~

### Create [server/src/routes/authRoutes.js](./server/src/routes/authRoutes.js)

Keep registration and login in one small router. Read the named request body fields, validation, database operation and response in order. Duplicate email errors are handled deliberately.

<!-- source: server/src/routes/authRoutes.js -->
~~~javascript
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

// Stage 3: registration creates an account and returns a signed-in session.
router.post("/register", async (req, res, next) => {
  try {
    const name = req.body?.name;
    const email = req.body?.email;
    const password = req.body?.password;

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

router.post("/login", async (req, res) => {
  const email = req.body?.email;
  const password = req.body?.password;
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
  let validPassword = false;
  if (user) {
    validPassword = await bcrypt.compare(password, user.passwordHash);
  }

  // Use one message for unknown email and wrong password.
  if (!validPassword) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }

  res.json({ token: createToken(user), user: publicUser(user) });
});

export default router;
~~~

### Create [server/src/middleware/requireAuth.js](./server/src/middleware/requireAuth.js)

Middleware is the gatekeeper before the order handler. A valid token supplies req.userId; missing or invalid authentication returns 401.

<!-- source: server/src/middleware/requireAuth.js -->
~~~javascript
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
~~~

### Create [client/src/auth/AuthContext.jsx](./client/src/auth/AuthContext.jsx)

Context shares the session. useQueryClient accesses the provider's cache; changing or clearing a session removes private order queries and cancels their in-flight fetches. The public catalogue cache is kept.

<!-- source: client/src/auth/AuthContext.jsx -->
~~~javascript
import { createContext, useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const AuthContext = createContext(null);
const STORAGE_KEY = "shoplite_session";

function readStoredSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (stored?.token && stored?.user) {
      return stored;
    }
  } catch (error) {
    console.warn("Could not read the saved session. Starting signed out.", error);
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }) {
  // Stage 3: share the same signed-in session with every component.
  const [session, setSessionState] = useState(readStoredSession);
  const queryClient = useQueryClient();

  function setSession(nextSession) {
    const safeSession = { token: nextSession.token, user: nextSession.user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeSession));
    // Remove private cached data and cancel its requests when the session changes.
    queryClient.removeQueries({ queryKey: ["orders"] });
    setSessionState(safeSession);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    queryClient.removeQueries({ queryKey: ["orders"] });
    setSessionState({ token: null, user: null });
  }

  const value = {
    token: session.token,
    user: session.user,
    setSession,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
~~~

### Create [client/src/components/AuthPanel.jsx](./client/src/components/AuthPanel.jsx)

useForm owns input values and field errors. handleSubmit validates before calling submitForm; a useMutation sends the request. Await mutateAsync so React Hook Form tracks submission until the request and session update finish.

<!-- source: client/src/components/AuthPanel.jsx -->
~~~javascript
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function AuthPanel({ mode, onModeChange, onSuccess }) {
  const { setSession } = useAuth();
  const isRegister = mode === "register";
  const {
    register, handleSubmit, resetField, clearErrors, setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: "", email: "", password: "" },
    shouldUnregister: true,
  });
  const authMutation = useMutation({
    mutationFn: ({ path, body }) => apiRequest(path, { method: "POST", body }),
  });
  const submitting = isSubmitting || authMutation.isPending;

  let buttonLabel = "Log in";
  if (isRegister) {
    buttonLabel = "Create account";
  }
  if (submitting) {
    buttonLabel = "Please wait…";
  }

  function switchMode() {
    clearErrors();
    authMutation.reset();
    if (isRegister) {
      onModeChange("login");
    } else {
      onModeChange("register");
    }
  }

  async function submitForm(values) {
    clearErrors("root.server");
    let path = "/api/auth/login";
    let message = "Welcome back. You are signed in.";
    const body = { email: values.email, password: values.password };
    if (isRegister) {
      path = "/api/auth/register";
      message = "Account created. You are signed in.";
      body.name = values.name;
    }

    try {
      const data = await authMutation.mutateAsync({ path, body });
      setSession(data);
      resetField("password");
      onSuccess(message);
    } catch (error) {
      setError("root.server", { message: error.message });
    }
  }

  return (
    <section className="auth-panel panel">
      <p className="eyebrow">YOUR SHOPLITE ACCOUNT</p>
      <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
      <p className="muted">{isRegister ? "Create an account to save your orders." : "Log in to place an order and view your history."}</p>

      <form className="stack-form" onSubmit={handleSubmit(submitForm)} noValidate>
        {isRegister && (
          <div>
            <label htmlFor="auth-name">Full name</label>
            <input
              id="auth-name"
              autoComplete="name"
              maxLength={80}
              disabled={authMutation.isPending}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              {...register("name", {
                required: "Name is required.",
                validate: (value) => Boolean(value.trim()) || "Name is required.",
                maxLength: { value: 80, message: "Name must be 80 characters or fewer." },
              })}
            />
            {errors.name && <p id="name-error" className="field-help danger-text" role="alert">{errors.name.message}</p>}
          </div>
        )}
        <div>
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            disabled={authMutation.isPending}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email", {
              required: "Email is required.",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "A valid email is required." },
            })}
          />
          {errors.email && <p id="email-error" className="field-help danger-text" role="alert">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            disabled={authMutation.isPending}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : isRegister ? "password-help" : undefined}
            {...register("password", {
              required: "Password is required.",
              minLength: { value: 8, message: "Password must be at least 8 characters." },
            })}
          />
          {isRegister && <span id="password-help" className="field-help">Use at least 8 characters.</span>}
          {errors.password && <p id="password-error" className="field-help danger-text" role="alert">{errors.password.message}</p>}
        </div>

        {errors.root?.server && <p className="alert alert-error" role="alert">{errors.root.server.message}</p>}
        <button className="button button-primary button-wide" type="submit" disabled={submitting}>
          {buttonLabel}
        </button>
      </form>

      <p className="form-switch">
        {isRegister ? "Already have an account?" : "New to ShopLite?"}{" "}
        <button className="text-button" type="button" onClick={switchMode} disabled={submitting}>
          {isRegister ? "Log in" : "Create an account"}
        </button>
      </p>
    </section>
  );
}
~~~

### Read the form in five steps

1. **useForm({ defaultValues })** creates the form with empty name, email and password.
2. **register("email", rules)** attaches the input's name, ref and change handlers. No manual value/onChange pair is needed.
3. **handleSubmit(submitForm)** validates, focuses an invalid field (in registration order) and calls submitForm only for valid input.
4. **authMutation.mutateAsync({ path, body })** sends the login or registration request.
5. On success, save the session and reset the password. On failure, **setError("root.server", ...)** displays the API error in the form.

The form uses **noValidate** so React Hook Form displays explicit inline errors instead of browser validation popups.
Required fields, name length/whitespace, email format and the existing eight-character password minimum are checked.
aria-invalid and aria-describedby connect the errors to their fields. The server still performs its own validation.

**shouldUnregister: true** removes the registration-only name when switching to login, so it cannot block login or appear in its request.
Switching modes clears field/server errors and mutation state. Email/password stay while switching; name is cleared when its input unmounts.
While submitting, the submit and mode-switch buttons are disabled; input fields are disabled while the API mutation is pending.
These UI guards reduce duplicate clicks but are not backend idempotency.

### Explain and check

- Registration also signs the user in in this application.
- Successful authentication returns to the shop. It does not automatically submit checkout.
- Tokens expire after two hours. There is no refresh-token flow.
- Logout clears browser session data and private query data; it does not revoke an already-issued token on the server.
- localStorage-based token persistence is a learning choice with production trade-offs.
- A hidden button is not access control. The server must verify every protected request.

**Exercise:** create a fictitious account, reload, log out, then attempt a wrong password and the correct password.
Never project a real password or authorization token. Do not paste tokens into an online decoder.

---

# Stage 4 - Save trusted orders

The browser sends **productId and quantity**, not an authoritative price or total.
The server checks the items, loads current database prices, calculates the amount and saves the order.
The verified user ID determines ownership.

Example using the default seed data:

~~~text
2 bottles x INR 799 + 1 lamp x INR 1,499 = INR 3,097
~~~

### Create [server/src/models/Order.js](./server/src/models/Order.js)

Order items store name and price snapshots so old receipts do not change when the catalogue is edited.

<!-- source: server/src/models/Order.js -->
~~~javascript
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
~~~

### Create [server/src/routes/orderRoutes.js](./server/src/routes/orderRoutes.js)

Follow four steps: validate/merge requested items, fetch active products once, build snapshots and total with a loop, then save. The capped cart makes a straightforward array find easy to understand. Order history is filtered on the server.

<!-- source: server/src/routes/orderRoutes.js -->
~~~javascript
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
~~~

### Create [client/src/components/OrdersPanel.jsx](./client/src/components/OrdersPanel.jsx)

useQuery reads history under ['orders', user.id], only when signed in. The queryFn passes the token for authentication and signal for cancellation. Loading and errors come from the query, not separate useState/useEffect code.

<!-- source: client/src/components/OrdersPanel.jsx -->
~~~javascript
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatPrice } from "../utils/formatPrice.js";

export default function OrdersPanel() {
  const { token, user } = useAuth();
  const ordersQuery = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: ({ signal }) => apiRequest("/api/orders", { token, signal }),
    enabled: Boolean(token && user),
  });

  if (ordersQuery.isPending) return <p className="muted">Loading your orders…</p>;
  if (ordersQuery.isError) {
    return <p className="alert alert-error" role="alert">{ordersQuery.error.message}</p>;
  }
  const orders = ordersQuery.data.orders;

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
~~~

### Why the query key includes the user

Products are public, but orders belong to one user. **["orders", user.id]** keeps different users' cached results separate.
Do not put passwords or bearer tokens in cache keys. The token is sent only as request authentication.
AuthContext removes the order queries on login/logout; removing them also cancels their pending queries.
The Query cache is memory-only, not saved to localStorage. The existing cart/session persistence remains separate.
Cached order data may be shown while a repeat visit refetches; if that refetch fails (for example, an expired token), the panel shows the error instead of the old list.

### Rules that must stay on the server

- A checkout needs authentication and at least one item.
- At most 50 submitted line items are accepted.
- Product IDs must be valid and point to active products.
- Quantities must be integers from 1 to 20.
- Duplicate product entries are combined; the combined quantity must also be at most 20.
- IDs are normalized before comparison so letter casing does not break a valid ObjectId.
- Prices come from MongoDB, not the request body.
- History uses req.userId, not a browser-supplied user ID.

**Exercise:** place a demo order, refresh, reopen My orders, and then try a different account in an incognito session.
The second account should see only its own orders. Ordinary tabs share localStorage, so they are not independent accounts.

---

# Stage 5 - Connect and run the complete application

Now connect the models, routers and components already created.
The two programs still have separate entry points.

### Create [server/src/server.js](./server/src/server.js)

The backend entry point configures middleware, mounts the three routers and starts listening after MongoDB connects. The final error middleware receives async route errors from Express 5.

<!-- source: server/src/server.js -->
~~~javascript
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
~~~

### Create [client/index.html](./client/index.html)

Vite loads the browser entry point from this page.

<!-- source: client/index.html -->
~~~html
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
~~~

### Create [client/vite.config.js](./client/vite.config.js)

Enable React support in Vite; no custom build pipeline is needed.

<!-- source: client/vite.config.js -->
~~~javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
~~~

### Create [client/src/main.jsx](./client/src/main.jsx)

Create one QueryClient outside the component tree and wrap AuthProvider/App in QueryClientProvider. Every query, mutation and session cache cleanup uses this same client. Keep StrictMode enabled.

<!-- source: client/src/main.jsx -->
~~~jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import "./styles.css";

// Keep classroom requests predictable: show errors without automatic retries.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: { retry: false },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
~~~

### Create [client/src/App.jsx](./client/src/App.jsx)

useQuery owns products; useMutation owns checkout pending/success/error states. Local state still owns filters, navigation, notices and the cart. The only remaining App effect saves the cart to localStorage.

<!-- source: client/src/App.jsx -->
~~~jsx
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./api.js";
import { useAuth } from "./auth/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import ProductCard from "./components/ProductCard.jsx";
import AuthPanel from "./components/AuthPanel.jsx";
import CartPanel from "./components/CartPanel.jsx";
import OrdersPanel from "./components/OrdersPanel.jsx";

function readCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem("shoplite_cart") || "[]");
    if (!Array.isArray(savedCart)) {
      console.warn("The saved cart is not a list. Starting with an empty cart.");
      return [];
    }

    const validItems = savedCart.filter((item) => {
      return item &&
        typeof item.productId === "string" &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 1 && item.quantity <= 20;
    });
    if (validItems.length !== savedCart.length) {
      console.warn("Invalid items were removed from the saved cart.");
    }
    return validItems;
  } catch (error) {
    console.warn("Could not read the saved cart. Starting with an empty cart.", error);
    return [];
  }
}

export default function App() {
  const { token, user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState(readCart);
  const [view, setView] = useState("shop");
  const [authMode, setAuthMode] = useState("login");
  const [notice, setNotice] = useState("");

  // Stage 2: Query owns server data; React state owns filters and the cart.
  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: ({ signal }) => apiRequest("/api/products", { signal }),
  });
  const products = productsQuery.data?.products ?? [];

  const checkoutMutation = useMutation({
    mutationFn: ({ items, token }) => apiRequest("/api/orders", {
      method: "POST",
      token,
      body: { items },
    }),
    onSuccess: (data, submitted) => {
      // A late response from a previous session must not change this user's UI.
      if (submitted.token !== token) return;
      queryClient.invalidateQueries({ queryKey: ["orders", user.id] });
      setCart([]);
      setView("orders");
      setNotice(`Order placed successfully. Reference: ${data.order._id}`);
    },
    onError: (error, submitted) => {
      if (submitted.token === token) {
        setNotice(error.message);
      }
    },
  });

  const categories = [];
  for (const product of products) {
    if (!categories.includes(product.category)) {
      categories.push(product.category);
    }
  }
  categories.sort();
  categories.unshift("All");

  const searchText = search.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    const matchesName = product.name.toLowerCase().includes(searchText);
    const matchesDescription = product.description.toLowerCase().includes(searchText);
    const matchesCategory = category === "All" || product.category === category;
    return (matchesName || matchesDescription) && matchesCategory;
  });

  // Stage 2: cart state belongs to App; localStorage keeps it across refreshes.
  useEffect(() => {
    try {
      localStorage.setItem("shoplite_cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Could not save the cart in this browser.", error);
      setNotice("Your cart could not be saved. It may be lost when you refresh.");
    }
  }, [cart]);

  let cartCount = 0;
  for (const item of cart) {
    cartCount += item.quantity;
  }

  function addToCart(productId) {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.productId === productId);
      if (!existingItem) {
        return [...currentCart, { productId, quantity: 1 }];
      }

      return currentCart.map((item) => {
        if (item.productId === productId) {
          return { productId, quantity: Math.min(item.quantity + 1, 20) };
        }
        return item;
      });
    });
    setNotice("Added to cart.");
  }

  function removeFromCart(productId) {
    setCart((currentCart) => {
      return currentCart.filter((item) => item.productId !== productId);
    });
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    if (quantity > 20) {
      return;
    }

    setCart((currentCart) => {
      return currentCart.map((item) => {
        if (item.productId === productId) {
          return { productId, quantity };
        }
        return item;
      });
    });
  }

  // Stage 3: navigation changes a panel, not the browser URL.
  function navigate(nextView) {
    const needsLogin = nextView === "orders" || nextView === "checkout";
    if (needsLogin && !token) {
      setAuthMode("login");
      setView("auth");
      setNotice("Log in or create an account before continuing.");
      return;
    }

    setNotice("");
    if (nextView === "checkout") {
      setView("cart");
    } else {
      setView(nextView);
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

  // Stage 4: send choices to the server; clear the cart only after success.
  function checkout() {
    if (!token) {
      setAuthMode("login");
      setView("auth");
      setNotice("Log in or create an account before checking out.");
      return;
    }
    if (cart.length === 0 || checkoutMutation.isPending) {
      return;
    }

    const items = cart.map((item) => {
      return { productId: item.productId, quantity: item.quantity };
    });
    setNotice("");
    checkoutMutation.mutate({ items, token });
  }

  function scrollToProducts() {
    const productsSection = document.getElementById("products");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="app-shell">
      <Navbar
        activeView={view}
        onNavigate={navigate}
        cartCount={cartCount}
        user={user}
        onLogout={handleLogout}
      />

      <main className="page-container">
        {notice && <p className="alert alert-info" role="status">{notice}</p>}

        {view === "shop" && (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">GOOD FINDS. EVERYDAY PRICES.</p>
                <h1>Small things.<br /><span>Better everyday.</span></h1>
                <p className="hero-copy">
                  A simple, student-built store for useful things that make daily life easier.
                </p>
                <button className="button button-primary" type="button" onClick={scrollToProducts}>
                  Explore products
                </button>
              </div>
              <div className="hero-art" aria-hidden="true">
                <span className="hero-orbit orbit-one" />
                <span className="hero-orbit orbit-two" />
                <span className="hero-bag">S</span>
                <span className="hero-spark spark-one">✦</span>
                <span className="hero-spark spark-two">✳</span>
              </div>
            </section>

            <section id="products" className="products-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">THE SHOP</p>
                  <h2>Find your next favourite</h2>
                </div>
                <span className="muted">{filteredProducts.length} product(s)</span>
              </div>

              <div className="filter-bar">
                <label className="search-field">
                  <span className="sr-only">Search products</span>
                  <span aria-hidden="true">⌕</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products…"
                  />
                </label>
                <label className="category-field">
                  <span className="sr-only">Filter by category</span>
                  <select value={category} onChange={(event) => setCategory(event.target.value)}>
                    {categories.map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </div>

              {productsQuery.isPending && <p className="muted">Loading products…</p>}
              {productsQuery.isError && (
                <p className="alert alert-error" role="alert">
                  {productsQuery.error.message} Check that the backend is running and MongoDB is connected.
                </p>
              )}
              {productsQuery.isSuccess && filteredProducts.length === 0 && (
                <div className="empty-state panel">
                  <h3>No products found</h3>
                  <p className="muted">Try another search or category.</p>
                </div>
              )}
              {productsQuery.isSuccess && filteredProducts.length > 0 && (
                <div className="product-grid">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product._id} product={product} onAddToCart={addToCart} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {view === "cart" && (
          <CartPanel
            cart={cart}
            products={products}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFromCart}
            onCheckout={checkout}
            submitting={checkoutMutation.isPending}
          />
        )}
        {view === "auth" && (
          <AuthPanel mode={authMode} onModeChange={setAuthMode} onSuccess={handleAuthSuccess} />
        )}
        {view === "orders" && token && <OrdersPanel />}
      </main>

      <footer className="site-footer">
        <strong>shoplite</strong>
        <span>A full-stack learning project by CodeEmy.</span>
        <span>Demo checkout only · No real payments</span>
      </footer>
    </div>
  );
}
~~~

### Create [client/src/styles.css](./client/src/styles.css)

The existing responsive design is preserved. Students can treat this as a supplied stylesheet and focus on behavior first.

<!-- source: client/src/styles.css -->
~~~css
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
.stack-form > div { display: grid; gap: 8px; }
.stack-form label { display: grid; gap: 8px; font-size: 0.88rem; font-weight: 700; }
.stack-form input { width: 100%; min-height: 44px; padding: 10px 12px; border: 1px solid #dcd5e5; border-radius: 10px; outline: none; background: #fff; color: var(--ink); font-weight: 400; }
.stack-form input:focus { border-color: var(--purple); box-shadow: 0 0 0 3px rgba(97,55,184,0.12); }
.field-help { color: var(--muted); font-size: 0.78rem; line-height: 1.45; }
.stack-form .field-help { margin: 0; }
.stack-form .danger-text { color: #b42336; }
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
~~~

## First run from an empty-folder build

All application files now exist. Start from the project root in two terminals.

**Terminal A:**

~~~powershell
Set-Location .\server
npm.cmd install
npm.cmd run seed
npm.cmd run dev
~~~

**Terminal B:**

~~~powershell
Set-Location .\client
npm.cmd install
npm.cmd run dev
~~~

Complete the Stage 0 database/environment setup first.
Keep both dev servers running. Visit the frontend URL printed by Vite.

## Follow one product request

~~~text
App renders useQuery({ queryKey: ["products"], queryFn })
 -> apiRequest("/api/products")
 -> Express products router
 -> Product.find({ active: true })
 -> MongoDB result
 -> { products: [...] }
 -> TanStack Query stores the response in its cache
 -> App reads productsQuery.data.products
 -> React renders ProductCard components
~~~

There is no hand-written product-loading effect or isActive flag.
The query's signal reaches fetch so obsolete requests can be cancelled.
Development StrictMode can cause a cancelled initial request followed by a new one; this is not search issuing extra requests.

### Query defaults used for this classroom app

- **retry: false** makes errors visible without silent retry delays. Mutations also explicitly disable retries, especially important for order creation.
- **refetchOnWindowFocus: false** and **refetchOnReconnect: false** avoid surprise refetches when changing windows or reconnecting.
- The default **staleTime: 0** is retained: cached data is immediately considered stale. Stale does not mean deleted.
- A stale query refetches when mounted again. Order history refreshes on re-entry; the products query stays mounted in App while panels change.
- Inactive queries normally remain cached for five minutes; logout/session changes explicitly remove private orders earlier.
- A successful checkout calls **invalidateQueries({ queryKey: ["orders", user.id] })** to mark that user's history out of date. Active matching queries refetch; otherwise the next mount fetches.
- Cache and pending states belong to Query, but cart state still belongs to React. Do not copy the query results into a second set of state variables.

For teaching: **query = read**, **mutation = submit**, **invalidate = refresh this saved result**.

## Follow one checkout

~~~text
Click Place demo order
 -> App checks session and cart
 -> checkoutMutation.mutate({ items, token })
 -> POST /api/orders with token, product IDs and quantities
 -> requireAuth verifies identity
 -> route validates items and calculates database prices
 -> Order.create saves the receipt
 -> { order } returns with HTTP 201
 -> mutation onSuccess invalidates this user's order query
 -> App clears the cart and opens My orders
 -> OrdersPanel's useQuery requests GET /api/orders
 -> { orders: [...] } returns only this user's history
~~~

When checkout fails, show the message and keep the cart. When it succeeds, clear the cart.
The mutation's isPending controls the checkout button. A late checkout response from a previous session does not change the new user's screen or cart.
Disabling the button reduces repeat clicks; it is **not** a server-side exactly-once/idempotency guarantee.
After a refresh, App returns to the shop view; reopen My orders to see saved orders.

## API reference

| Method | Path | Body | Response | Protected? |
|---|---|---|---|---|
| GET | /api/health | None | { status, service } | No |
| GET | /api/products | None | { products } | No |
| POST | /api/auth/register | { name, email, password } | { token, user } | No |
| POST | /api/auth/login | { email, password } | { token, user } | No |
| POST | /api/orders | { items: [{ productId, quantity }] } | { order } | Yes |
| GET | /api/orders | None | { orders } | Yes |

Protected requests use an Authorization header with the Bearer scheme and the issued token.
The address bar can demonstrate GET requests; use the application or an API client for JSON POST requests.
Common statuses are 200/201 (success), 400 (invalid input), 401 (authentication failure), 404 (unknown route), 409 (email conflict) and 500 (unexpected server error).

---

# Stage 6 - Check understanding and behavior

## Manual checklist

1. Open /api/health, then /api/products. Health alone does not test every database operation.
2. Browse products; search name/description and combine it with a category.
3. Add, increment, decrement and remove cart items; verify the quantity cap of 20.
4. Refresh and verify the cart survives.
5. Try checkout signed out; expect the authentication screen, not a saved order.
6. Register, log out, try incorrect credentials, and log in correctly.
7. Return to the cart and place a demo order.
8. With default seed prices, two bottles plus a lamp should total INR 3,097.
9. Refresh, reopen My orders and confirm persistence.
10. Sign in as another test user and confirm private history.
11. Check that failed API requests produce visible errors rather than pretending to succeed.
12. Submit an empty/invalid auth form. Expect field errors and no API request; correct it and submit successfully.
13. Visit My orders, place another order, and confirm the new receipt appears alongside the cached ones.
14. Switch from registration to login with a missing name; that hidden field must not block login.

## Optional instructor tests

The test dependencies do not run in the production app.
These tests use **real Express routes, real MongoDB queries and a real Chromium browser**.
mongodb-memory-server starts an isolated MongoDB process with throwaway data; it is not a mock of the database API.
The first run downloads a MongoDB binary (large on Windows) and Chromium, so prepare before class.

The test database does not use your classroom connection string, seed or real accounts.
The helper creates its own random signing secret and test products, then stops the owned processes.
Backend tests use temporary ports. Browser tests require ports **5105 and 5175** to be free and deliberately refuse to reuse an existing server.

**Backend tests:**

~~~powershell
Set-Location .\server
npm.cmd test
~~~

**Browser tests, from a fresh root terminal:**

~~~powershell
Set-Location .\client
npx.cmd playwright install chromium
npm.cmd test
npm.cmd run build
~~~

Install dependencies in both folders before browser tests. Playwright starts the API and Vite for you.
Most browser journeys cross the real API/database boundary; a small number deliberately simulate network/server failures to check error UI.
Tests block external image/font requests so third-party availability does not determine the result.

If the first browser run times out while downloading MongoDB, finish the backend test run once, then retry.
If binary downloads are blocked by your network, report that limitation; do not change the tests to silently use a live database.

### What the tests cover

- Active product filtering, sorting and read-back after a database change.
- Registration, hashed passwords, normalized email and duplicate accounts.
- Incorrect credentials, missing/invalid/expired tokens.
- Trusted checkout totals, duplicate quantities and invalid carts.
- Historical price snapshots and user-specific orders.
- Browser search/category interaction, cart persistence and quantity controls.
- Session persistence, logout/login, complete checkout and failed-checkout behavior.
- React Hook Form validation, error focus, mode switching, hidden-field cleanup and pending submissions.
- Refreshing cached order history after checkout, hiding cached receipts on auth errors and cancelling private queries on logout.

### Complete test source (instructor appendix)

You can skip reading this appendix during the introductory lesson.
If rebuilding every file from scratch and using npm test, create these files as well.

### Create [server/tests/helpers.js](./server/tests/helpers.js)

Shared isolated database/server setup and cleanup.

<!-- source: server/tests/helpers.js -->
~~~javascript
import { execFile, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import net from "node:net";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Product } from "../src/models/Product.js";
import { User } from "../src/models/User.js";

async function unusedPort() {
  const socket = net.createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  return port;
}

export async function startTestServer(requestedPort) {
  const database = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  let child;

  async function stop() {
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      child.kill();
      await exited;
    }
    await mongoose.disconnect();
    await database.stop();
  }

  try {
    await mongoose.connect(database.getUri());
    await User.init();
    const products = await Product.create([
      { name: "Insulated Bottle", slug: "bottle", description: "A reusable bottle", category: "Lifestyle", price: 799, imageUrl: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" },
      { name: "Desk Lamp", slug: "lamp", description: "A study light", category: "Home", price: 1499, imageUrl: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" },
      { name: "Hidden Product", slug: "hidden", description: "Not for sale", category: "Home", price: 10, active: false },
    ]);
    const port = requestedPort || await unusedPort();
    const url = `http://127.0.0.1:${port}`;
    const secret = randomBytes(32).toString("hex");
    child = spawn(process.execPath, [fileURLToPath(new URL("../src/server.js", import.meta.url))], {
      env: {
        ...process.env,
        PORT: String(port),
        MONGODB_URI: database.getUri(),
        JWT_SECRET: secret,
        CLIENT_ORIGIN: "http://127.0.0.1:5175",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let logs = "";
    child.stdout.on("data", (data) => { logs += data; });
    child.stderr.on("data", (data) => { logs += data; });
    let spawnError;
    child.on("error", (error) => { spawnError = error; });
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null) throw new Error(`Test server exited: ${logs}`);
      try {
        const response = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(500) });
        if (response.ok) {
          ready = true;
          break;
        }
      } catch (error) {
        if (attempt === 99) throw new Error(`Test server did not become ready: ${logs}`, { cause: error });
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error(`Test server did not become ready: ${logs}`);

    async function request(path, { method = "GET", body, token } = {}) {
      const headers = {};
      if (body !== undefined) headers["Content-Type"] = "application/json";
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(url + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: response.status, data: await response.json() };
    }

    async function seed() {
      return promisify(execFile)(
        process.execPath,
        [fileURLToPath(new URL("../src/seed/seedProducts.js", import.meta.url))],
        { env: { ...process.env, MONGODB_URI: database.getUri() } },
      );
    }

    return { url, request, products, secret, seed, stop };
  } catch (error) {
    await stop();
    throw error;
  }
}

export async function register(request, email) {
  const response = await request("/api/auth/register", {
    method: "POST",
    body: { name: "Student", email, password: "classroom-test-password" },
  });
  if (response.status !== 201) throw new Error(JSON.stringify(response));
  return response.data;
}
~~~

### Create [server/tests/products.test.js](./server/tests/products.test.js)

Product route behavior and database read-back.

<!-- source: server/tests/products.test.js -->
~~~javascript
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers.js";
import { Product } from "../src/models/Product.js";

let app;
before(async () => { app = await startTestServer(); });
after(async () => { if (app) await app.stop(); });

test("catalogue returns active products in name order and reflects database updates", async () => {
  const first = await app.request("/api/products");
  assert.equal(first.status, 200);
  assert.deepEqual(first.data.products.map((product) => product.name), ["Desk Lamp", "Insulated Bottle"]);

  await Product.updateOne({ slug: "bottle" }, { $set: { price: 899 } });
  const second = await app.request("/api/products");
  assert.equal(second.data.products.find((product) => product.slug === "bottle").price, 899);
  assert.equal((await app.request("/api/orders")).status, 401);
  assert.equal((await app.request("/api/not-a-route")).status, 404);
});

test("seeding updates matching slugs without duplicating the eight demo products", async () => {
  await app.seed();
  assert.equal(await Product.countDocuments(), 11);
  await Product.updateOne({ slug: "insulated-bottle" }, { $set: { price: 1 } });
  await app.seed();
  assert.equal(await Product.countDocuments(), 11);
  const result = await app.request("/api/products");
  assert.equal(result.data.products.length, 10);
  assert.equal(result.data.products.find((product) => product.slug === "insulated-bottle").price, 799);
});
~~~

### Create [server/tests/auth.test.js](./server/tests/auth.test.js)

Account lifecycle, password storage and authentication failure.

<!-- source: server/tests/auth.test.js -->
~~~javascript
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { startTestServer, register } from "./helpers.js";
import { User } from "../src/models/User.js";

let app;
before(async () => { app = await startTestServer(); });
after(async () => { if (app) await app.stop(); });

test("registration hashes passwords, normalizes email and supports later login", async () => {
  const session = await register(app.request, " STUDENT@example.com ");
  assert.equal(session.user.email, "student@example.com");
  assert.equal(session.user.passwordHash, undefined);
  assert.ok(session.token);
  const stored = await User.findOne({ email: session.user.email }).select("+passwordHash");
  assert.notEqual(stored.passwordHash, "classroom-test-password");
  assert.equal(await bcrypt.compare("classroom-test-password", stored.passwordHash), true);

  const login = await app.request("/api/auth/login", {
    method: "POST", body: { email: "STUDENT@example.com", password: "classroom-test-password" },
  });
  assert.equal(login.status, 200);
  assert.equal(login.data.user.id, session.user.id);
  assert.equal(login.data.user.passwordHash, undefined);

  const wrong = await app.request("/api/auth/login", {
    method: "POST", body: { email: session.user.email, password: "wrong-password" },
  });
  const unknown = await app.request("/api/auth/login", {
    method: "POST", body: { email: "nobody@example.com", password: "wrong-password" },
  });
  assert.equal(wrong.status, 401);
  assert.deepEqual(wrong, unknown);
  const duplicate = await app.request("/api/auth/register", {
    method: "POST", body: { name: "Student", email: session.user.email, password: "classroom-test-password" },
  });
  assert.equal(duplicate.status, 409);
});

test("invalid registration and missing or invalid tokens are rejected", async () => {
  for (const body of [
    { name: "", email: "a@example.com", password: "long-password" },
    { name: "A", email: "bad", password: "long-password" },
    { name: "A", email: "a@example.com", password: "short" },
  ]) {
    assert.equal((await app.request("/api/auth/register", { method: "POST", body })).status, 400);
  }
  assert.equal((await app.request("/api/orders")).status, 401);
  assert.equal((await app.request("/api/orders", { token: "invalid-token" })).status, 401);
});
~~~

### Create [server/tests/orders.test.js](./server/tests/orders.test.js)

Checkout integrity, validation and private persistent history.

<!-- source: server/tests/orders.test.js -->
~~~javascript
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { startTestServer, register } from "./helpers.js";
import { Product } from "../src/models/Product.js";

let app;
before(async () => { app = await startTestServer(); });
after(async () => { if (app) await app.stop(); });

test("checkout calculates trusted totals, merges quantities and preserves private history", async () => {
  const alice = await register(app.request, "alice@example.com");
  const bob = await register(app.request, "bob@example.com");
  const [bottle, lamp] = app.products;
  const placed = await app.request("/api/orders", {
    method: "POST", token: alice.token,
    body: {
      user: bob.user.id, totalAmount: 1,
      items: [
        { productId: bottle.id, quantity: 1, price: 1 },
        { productId: bottle.id, quantity: 1 },
        { productId: lamp.id, quantity: 1 },
      ],
    },
  });
  assert.equal(placed.status, 201);
  assert.equal(placed.data.order.totalAmount, 3097);
  assert.equal(placed.data.order.user, alice.user.id);
  assert.equal(placed.data.order.status, "placed");
  assert.equal(placed.data.order.items.length, 2);
  assert.equal(placed.data.order.items[0].quantity, 2);

  await Product.updateOne({ _id: bottle.id }, { $set: { name: "New bottle name", price: 1 } });
  const history = await app.request("/api/orders", { token: alice.token });
  assert.equal(history.data.orders[0].items[0].name, "Insulated Bottle");
  assert.equal(history.data.orders[0].items[0].price, 799);
  assert.equal(history.data.orders[0].totalAmount, 3097);
  assert.deepEqual((await app.request("/api/orders", { token: bob.token })).data.orders, []);
  assert.equal((await app.request("/api/orders", { method: "POST", body: { items: [] } })).status, 401);
  const expired = jwt.sign({ sub: alice.user.id }, app.secret, { expiresIn: -1 });
  assert.equal((await app.request("/api/orders", { token: expired })).status, 401);
});

test("checkout rejects bad IDs, unavailable products and invalid or excessive quantities", async () => {
  const session = await register(app.request, "validation@example.com");
  const bottleId = app.products[0].id;
  const invalidCarts = [
    [], [null], [{ productId: "invalid", quantity: 1 }],
    [{ productId: "000000000000000000000001", quantity: 1 }],
    [{ productId: app.products[2].id, quantity: 1 }],
    ...[0, -1, 21, 1.5, "2"].map((quantity) => [{ productId: bottleId, quantity }]),
    [{ productId: bottleId, quantity: 11 }, { productId: bottleId, quantity: 10 }],
    Array.from({ length: 51 }, () => ({ productId: bottleId, quantity: 1 })),
  ];
  for (const items of invalidCarts) {
    const result = await app.request("/api/orders", { method: "POST", token: session.token, body: { items } });
    assert.equal(result.status, 400, JSON.stringify(items));
    assert.equal(typeof result.data.message, "string");
  }
  assert.deepEqual((await app.request("/api/orders", { token: session.token })).data.orders, []);
});

test("mixed-case ObjectIds refer to the same product and share the quantity limit", async () => {
  const session = await register(app.request, "id-case@example.com");
  const productId = app.products[1].id;
  const body = { items: [
    { productId: productId.toUpperCase(), quantity: 10 },
    { productId, quantity: 10 },
  ] };
  const valid = await app.request("/api/orders", { method: "POST", token: session.token, body });
  assert.equal(valid.status, 201);
  assert.equal(valid.data.order.items.length, 1);
  assert.equal(valid.data.order.items[0].quantity, 20);
  assert.equal(valid.data.order.totalAmount, 29980);
  body.items[0].quantity = 11;
  const invalid = await app.request("/api/orders", { method: "POST", token: session.token, body });
  assert.equal(invalid.status, 400);
  assert.equal((await app.request("/api/orders", { token: session.token })).data.orders.length, 1);
});
~~~

### Create [server/tests/start-test-server.js](./server/tests/start-test-server.js)

Start a disposable API for browser tests and clean up on shutdown.

<!-- source: server/tests/start-test-server.js -->
~~~javascript
import { startTestServer } from "./helpers.js";

const app = await startTestServer(5105);
console.log(`Isolated browser-test API ready at ${app.url}`);

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await app.stop();
  process.exit(0);
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
~~~

### Create [client/playwright.config.js](./client/playwright.config.js)

Start isolated test servers and select Chromium; keep test output separate.

<!-- source: client/playwright.config.js -->
~~~javascript
import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

const apiScript = fileURLToPath(new URL("../server/tests/start-test-server.js", import.meta.url));

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5175",
    browserName: "chromium",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: `node "${apiScript}"`,
      url: "http://127.0.0.1:5105/api/health",
      timeout: 600000,
      reuseExistingServer: false,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5175 --strictPort",
      url: "http://127.0.0.1:5175",
      env: { VITE_API_URL: "http://127.0.0.1:5105" },
      reuseExistingServer: false,
    },
  ],
});
~~~

### Create [client/tests/helpers.js](./client/tests/helpers.js)

Browser setup, runtime-error checking and test registration helper.

<!-- source: client/tests/helpers.js -->
~~~javascript
import { randomUUID } from "node:crypto";
import { test as base, expect } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route("https://**", (route) => route.abort());
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await use(page);
    expect(errors).toEqual([]);
  },
});
export { expect };

export async function signUp(page) {
  const email = `${randomUUID()}@example.com`;
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("heading", { name: /^(Welcome back|Create your account)$/ })).toBeVisible();
  if (await page.getByRole("heading", { name: "Welcome back" }).isVisible()) {
    await page.getByRole("button", { name: "Create an account", exact: true }).click();
  }
  await page.getByLabel("Full name").fill("Student");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("classroom-test-password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("Hi, Student")).toBeVisible();
  return email;
}
~~~

### Create [client/tests/storefront.spec.js](./client/tests/storefront.spec.js)

Catalogue and cart user journeys.

<!-- source: client/tests/storefront.spec.js -->
~~~javascript
import { test, expect } from "./helpers.js";

test("search, category and cart updates persist across refresh", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Add to cart", exact: true })).toHaveCount(2);
  await page.getByRole("textbox", { name: "Search products" }).fill("bottle");
  await expect(page.getByRole("button", { name: "Add to cart", exact: true })).toHaveCount(1);
  await page.getByRole("combobox", { name: "Filter by category" }).selectOption("Home");
  await expect(page.getByText("No products found")).toBeVisible();
  await page.getByRole("combobox", { name: "Filter by category" }).selectOption("All");
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await page.getByRole("button", { name: "Cart (1)", exact: true }).click();
  const increase = page.getByRole("button", { name: "Increase quantity" });
  for (let count = 1; count < 20; count++) await increase.click();
  await expect(increase).toBeDisabled();
  await page.reload();
  await page.getByRole("button", { name: "Cart (20)", exact: true }).click();
  await expect(increase).toBeDisabled();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.getByText("Your cart is empty")).toBeVisible();
});

test("product request failure is visible instead of an empty catalogue", async ({ page }) => {
  await page.route("**/api/products", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("Cannot reach the API");
  await expect(page.getByText("No products found")).toHaveCount(0);
});

test("unreadable API responses show an explicit error", async ({ page }) => {
  await page.route("**/api/products", (route) => route.fulfill({
    status: 200, contentType: "text/html", body: "<h1>Not JSON</h1>",
  }));
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("The API returned an unreadable response");
});

test("saved cart validation keeps valid items and removing the last unit empties the cart", async ({ page, request }) => {
  const response = await request.get("http://127.0.0.1:5105/api/products");
  const { products } = await response.json();
  await page.addInitScript((productId) => {
    localStorage.setItem("shoplite_cart", JSON.stringify([
      null, { productId, quantity: 1 }, { productId, quantity: 21 },
    ]));
  }, products[0]._id);
  await page.goto("/");
  await page.getByRole("button", { name: "Cart (1)", exact: true }).click();
  await page.getByRole("button", { name: "Decrease quantity" }).click();
  await expect(page.getByText("Your cart is empty")).toBeVisible();
});

test("unavailable browser storage produces a visible persistence warning", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException("Storage blocked", "SecurityError"); };
  });
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("Your cart could not be saved");
  await page.getByRole("button", { name: "Add to cart", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "Cart (1)", exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Your cart could not be saved");
});

test("search remains selected after a cart visit", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Search products" }).fill("bottle");
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await page.getByRole("button", { name: "Cart (1)", exact: true }).click();
  await page.getByRole("button", { name: "Shop", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Search products" })).toHaveValue("bottle");
  await expect(page.getByRole("button", { name: "Add to cart", exact: true })).toHaveCount(1);
});

test("request helper preserves string bodies, custom headers and empty successful responses", async ({ page }) => {
  await page.goto("/");
  await page.route("**/api/helper-check", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.postData()).toBe('{"example":true}');
    expect(request.headers()["x-classroom"]).toBe("yes");
    expect(request.headers().authorization).toBe("Bearer test-session");
    await route.fulfill({ status: 204 });
  });
  const result = await page.evaluate(async () => {
    const { apiRequest } = await import("/src/api.js");
    return apiRequest("/api/helper-check", {
      method: "POST",
      token: "test-session",
      body: '{"example":true}',
      headers: { "X-Classroom": "yes" },
    });
  });
  expect(result).toBeNull();
});
~~~

### Create [client/tests/account.spec.js](./client/tests/account.spec.js)

Registration, reload, logout and login journey.

<!-- source: client/tests/account.spec.js -->
~~~javascript
import { test, expect, signUp } from "./helpers.js";
import { randomUUID } from "node:crypto";

test("registration persists session; logout and login handle incorrect credentials", async ({ page }) => {
  await page.goto("/");
  const email = await signUp(page);
  await page.reload();
  await expect(page.getByText("Hi, Student")).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("incorrect-password");
  await page.getByRole("button", { name: "Log in", exact: true }).last().click();
  await expect(page.getByRole("alert")).toHaveText("Email or password is incorrect.");
  await page.getByLabel("Password").fill("classroom-test-password");
  await page.getByRole("button", { name: "Log in", exact: true }).last().click();
  await expect(page.getByText("Hi, Student")).toBeVisible();
});

test("React Hook Form validates fields before sending registration", async ({ page }) => {
  let submissions = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/auth/register")) submissions++;
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.getByRole("button", { name: "Create an account", exact: true }).click();
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("Name is required.", { exact: true })).toBeVisible();
  await expect(page.getByText("Email is required.", { exact: true })).toBeVisible();
  await expect(page.getByText("Password is required.", { exact: true })).toBeVisible();
  await expect(page.locator('input[aria-invalid="true"]:focus')).toHaveCount(1);
  await page.getByLabel("Full name").fill("   ");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("A valid email is required.", { exact: true })).toBeVisible();
  await expect(page.getByText("Password must be at least 8 characters.", { exact: true })).toBeVisible();
  expect(submissions).toBe(0);

  await page.getByLabel("Full name").fill("Student");
  await page.getByLabel("Email").fill(`${randomUUID()}@example.com`);
  await page.getByLabel("Password").fill("classroom-test-password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("Hi, Student")).toBeVisible();
  expect(submissions).toBe(1);
});

test("switching to login clears registration errors and excludes the unmounted name field", async ({ page }) => {
  let sentBody;
  await page.route("**/api/auth/login", async (route) => {
    sentBody = route.request().postDataJSON();
    await route.fulfill({
      status: 401, contentType: "application/json",
      body: JSON.stringify({ message: "Email or password is incorrect." }),
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.getByRole("button", { name: "Create an account", exact: true }).click();
  await page.getByLabel("Email").fill("student@example.com");
  await page.getByLabel("Password").fill("classroom-test-password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("Name is required.", { exact: true })).toBeVisible();
  await page.getByRole("main").getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByLabel("Full name")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Log in", exact: true }).last().click();
  await expect(page.getByRole("alert")).toHaveText("Email or password is incorrect.");
  expect(sentBody).toEqual({ email: "student@example.com", password: "classroom-test-password" });
  await page.getByRole("button", { name: "Create an account", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("pending auth mutation disables submit and mode switch without retrying failures", async ({ page }) => {
  let release;
  const ready = new Promise((resolve) => { release = resolve; });
  let submissions = 0;
  await page.route("**/api/auth/login", async (route) => {
    submissions++;
    await ready;
    await route.fulfill({
      status: 401, contentType: "application/json",
      body: JSON.stringify({ message: "Email or password is incorrect." }),
    });
  });
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.getByLabel("Email").fill("student@example.com");
    await page.getByLabel("Password").fill("classroom-test-password");
    await page.getByRole("button", { name: "Log in", exact: true }).last().click();
    await expect(page.getByRole("button", { name: "Please wait…" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Create an account", exact: true })).toBeDisabled();
    release();
    await expect(page.getByRole("alert")).toHaveText("Email or password is incorrect.");
    await expect(page.getByRole("button", { name: "Log in", exact: true }).last()).toBeEnabled();
    expect(submissions).toBe(1);
  } finally {
    release();
  }
});
~~~

### Create [client/tests/checkout.spec.js](./client/tests/checkout.spec.js)

Complete order lifecycle and failure recovery.

<!-- source: client/tests/checkout.spec.js -->
~~~javascript
import { test, expect, signUp } from "./helpers.js";

test("checkout requires login, saves a trusted order and isolates another user's history", async ({ page }) => {
  await page.goto("/");
  const bottle = page.locator("article").filter({ has: page.getByRole("heading", { name: "Insulated Bottle" }) });
  await bottle.getByRole("button", { name: "Add to cart", exact: true }).click();
  await bottle.getByRole("button", { name: "Add to cart", exact: true }).click();
  const lamp = page.locator("article").filter({ has: page.getByRole("heading", { name: "Desk Lamp" }) });
  await lamp.getByRole("button", { name: "Add to cart", exact: true }).click();
  await page.getByRole("button", { name: "Cart (3)", exact: true }).click();
  await page.getByRole("button", { name: "Place demo order", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.getByRole("button", { name: "Shop", exact: true }).click();
  await signUp(page);
  await page.getByRole("button", { name: "Cart (3)", exact: true }).click();
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/orders") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Place demo order", exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const { order } = await response.json();
  expect(order.totalAmount).toBe(3097);
  await expect(page.getByText(order._id, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cart (0)", exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(page.getByText(order._id, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await signUp(page);
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(page.getByText("No orders yet")).toBeVisible();
  await expect(page.getByText(order._id, { exact: true })).toHaveCount(0);
});

test("failed checkout keeps the cart and shows the API error", async ({ page }) => {
  await page.goto("/");
  await signUp(page);
  await page.getByRole("button", { name: "Add to cart", exact: true }).first().click();
  await page.getByRole("button", { name: "Cart (1)", exact: true }).click();
  await page.route("**/api/orders", (route) => route.fulfill({
    status: 400, contentType: "application/json",
    body: JSON.stringify({ message: "One or more products are unavailable." }),
  }));
  await page.getByRole("button", { name: "Place demo order", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("One or more products are unavailable.");
  await expect(page.getByRole("button", { name: "Cart (1)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Place demo order", exact: true })).toBeEnabled();
});

test("checkout invalidates already cached order history and displays both receipts", async ({ page }) => {
  await page.goto("/");
  await signUp(page);
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(page.getByText("No orders yet")).toBeVisible();

  const orderIds = [];
  for (let count = 1; count <= 2; count++) {
    await page.getByRole("button", { name: "Shop", exact: true }).click();
    await page.getByRole("button", { name: "Add to cart", exact: true }).first().click();
    await page.getByRole("button", { name: "Cart (1)", exact: true }).click();
    const placed = page.waitForResponse((response) =>
      response.url().endsWith("/api/orders") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Place demo order", exact: true }).click();
    const { order } = await (await placed).json();
    orderIds.push(order._id);
    await expect(page.locator(".order-card")).toHaveCount(count);
    for (const id of orderIds) {
      await expect(page.getByText(id, { exact: true })).toBeVisible();
    }
  }
});

test("an expired session error hides cached orders when history is revisited", async ({ page }) => {
  await page.goto("/");
  await signUp(page);
  await page.getByRole("button", { name: "Add to cart", exact: true }).first().click();
  await page.getByRole("button", { name: "Cart (1)", exact: true }).click();
  await page.getByRole("button", { name: "Place demo order", exact: true }).click();
  await expect(page.locator(".order-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Shop", exact: true }).click();
  await page.route("**/api/orders", (route) => route.fulfill({
    status: 401, contentType: "application/json",
    body: JSON.stringify({ message: "Invalid or expired token." }),
  }));
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Invalid or expired token.");
  await expect(page.locator(".order-card")).toHaveCount(0);
});

test("logout cancels a pending private query before another account loads history", async ({ page }) => {
  await page.goto("/");
  await signUp(page);
  let release;
  const ready = new Promise((resolve) => { release = resolve; });
  let requested = false;
  let cancelled = false;
  page.on("requestfailed", (request) => {
    if (request.url().endsWith("/api/orders")) cancelled = true;
  });
  await page.route("**/api/orders", async (route) => {
    requested = true;
    await ready;
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"orders":[]}' });
  });
  try {
    await page.getByRole("button", { name: "My orders", exact: true }).click();
    await expect.poll(() => requested).toBe(true);
    await expect(page.getByText("Loading your orders…")).toBeVisible();
    cancelled = false;
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await expect.poll(() => cancelled).toBe(true);
    release();
    await page.unroute("**/api/orders");
    await signUp(page);
    await page.getByRole("button", { name: "My orders", exact: true }).click();
    await expect(page.getByText("No orders yet")).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  } finally {
    release();
  }
});

test("a late checkout response cannot clear a different account's cart", async ({ page }) => {
  await page.goto("/");
  await signUp(page);
  let release;
  const ready = new Promise((resolve) => { release = resolve; });
  let saved = false;
  await page.route("**/api/orders", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    expect(response.status()).toBe(201);
    saved = true;
    await ready;
    await route.fulfill({ response });
  });
  try {
    await page.getByRole("button", { name: "Add to cart", exact: true }).first().click();
    await page.getByRole("button", { name: "Cart (1)", exact: true }).click();
    await page.getByRole("button", { name: "Place demo order", exact: true }).click();
    await expect.poll(() => saved).toBe(true);
    await expect(page.getByRole("button", { name: "Placing order…" })).toBeDisabled();
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await signUp(page);
    await page.getByRole("button", { name: "Add to cart", exact: true }).first().click();
    await page.getByRole("button", { name: "Cart (2)", exact: true }).click();
    release();
    await expect(page.getByRole("button", { name: "Place demo order", exact: true })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Cart (2)", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Shopping cart", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "My orders", exact: true }).click();
    await expect(page.getByText("No orders yet")).toBeVisible();
  } finally {
    release();
  }
});
~~~

## Troubleshooting

| Symptom | Check first | Next step |
|---|---|---|
| npm.ps1 cannot run | PowerShell execution policy | Use npm.cmd; do not change machine policy for this lesson |
| Vite or Express module missing | Dependencies installed in correct folder? | Run npm.cmd ci in an existing checkout |
| Backend does not start | Backend terminal and configuration | Check database availability and required server settings |
| Empty catalogue | /api/products response and intended database | Seed only the correct disposable classroom DB |
| API unreachable | API process and client API origin | Start backend and align VITE_API_URL |
| CORS rejection | Actual browser origin | Match CLIENT_ORIGIN and restart backend |
| Orders return 401 | Missing or expired session | Log out and log in again |
| Cart storage warning | Browser storage permissions or corrupted data | Restore access/clear only the affected ShopLite storage key |
| Image missing | External image host/network | Continue using product names and prices |
| Test startup fails | Download permissions and test port availability | Finish binary installation; free only processes you own |

Do not disable browser security to fix CORS.
Do not delete important databases to fix seeding.
Do not expose secrets in logs, source control or screenshots.

## Production limitations

This is a learning project, not a production-commerce template.
Before deployment, review HTTPS, session storage and token revocation/refresh, rate limiting, validation, money representation, idempotency, inventory handling and operational testing.
Order status is currently only placed. Prices use JavaScript numbers and two-decimal rounding.
There is no payment gateway or delivery workflow.

## A final student explanation

> "React shows the products and remembers the cart. The browser calls Express, which checks requests and talks to MongoDB. Login gives us a signed token. At checkout, the server checks the items, calculates current database prices, saves the order and shows only our own order history."
