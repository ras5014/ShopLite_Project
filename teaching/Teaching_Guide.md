# ShopLite: a simple three-day teaching guide

**Audience:** students who know basic HTML, CSS and JavaScript, but are new to React and backend development.  
**Schedule:** three classes of 90 minutes, including one five-minute break per class.  
**Language:** simple English.  
**Deck:** [ShopLite_3_Day_Classroom.pptx](./ShopLite_3_Day_Classroom.pptx).  
**Slide handout:** [ShopLite_3_Day_Classroom.pdf](./ShopLite_3_Day_Classroom.pdf).

## 1. The right promise to make

Tell students:

> "We will understand how a small online shop works, follow a click from the screen to the database, and make a small change ourselves."

Do **not** promise to build the whole application from an empty folder in 4.5 hours. Use the supplied working project for a guided walkthrough. The [existing README](../README.md) is the longer build-at-home reference.

By the end, students should be able to:

1. Distinguish the browser, API server and database.
2. Explain components, props, state and a product-loading effect.
3. Follow `GET /api/products` from the browser to the JSON response.
4. Explain login, a signed token and a protected route.
5. Explain why checkout uses database prices and shows only the current user's orders.

## 2. Your opening explanation

Use this almost word for word:

> "Imagine a small neighbourhood shop. The counter shows the items. The shopkeeper checks what a customer wants. The record book remembers products and purchases. In ShopLite, React is the counter, the Express server is the shopkeeper, and MongoDB keeps the records. The browser asks the server for information. The server checks the request, talks to the database, and sends an answer back."

Then show the running shop **before showing the code**.

The main teaching sentence is:

> **React displays. Express checks. MongoDB stores.**

Keep returning to a single example: an Insulated Bottle. With the default seed data, its price is INR 799.

## 3. How to use the PowerPoint

**Code update:** the application is now organized into beginner-friendly learning stages in the [README](../README.md). The slides still describe the same features and flows, but their source excerpts and some implementation-specific notes predate the simplification. Use the README's exact source listings for live coding: request effects now use named async functions, totals use loops, and Express 5 forwards async route failures to the central error handler.

- Slides **1-11:** Day 1.
- Slides **12-22:** Day 2.
- Slides **23-33:** Day 3.
- Slides **34-37:** optional teacher appendix; not part of the 270-minute schedule.
- Each teaching slide shows its time allocation in the header.
- Every slide includes speaker notes with explanations, questions, answers, demo steps and relevant source-file pointers.
- Use PowerPoint **Notes** while preparing and **Presenter View** while teaching. The PDF, if used, is only a slide handout; it does not expose the teaching notes.
- Show a concept, open the relevant file or browser screen, ask students to predict, and then demonstrate.
- Do not read the entire slide or every line of code aloud.

### The repeating classroom pattern

1. **Show:** use the feature.
2. **Ask:** "What do you think happened?"
3. **Explain:** connect one concept to one small code section.
4. **Try:** make or observe one small change.
5. **Check:** students explain the result in their own words.

Teach the familiar JavaScript idea before introducing the framework word:

| Familiar idea | New term |
|---|---|
| A function that returns a screen piece | Component |
| Inputs passed to that function | Props |
| A value whose update changes the UI | State |
| Synchronizing with an external system | Effect |
| A request sent to a server | API call |
| Code selected by method and path | Route |
| A description of data fields and rules | Schema |
| A data interface for queries and writes | Model |
| Checking identity | Authentication |
| Checking which records/actions are allowed | Authorization |

## 4. Minute-by-minute delivery

The same time pattern is used each day so the class feels predictable.

### Day 1: understand the screen and the cart

| Minutes | Slide | Teach / do |
|---|---:|---|
| 0-5 | 1 | Set realistic goals and ask where a cart item is saved. |
| 5-12 | 2 | Demonstrate browse -> cart -> account -> demo order. |
| 12-20 | 3 | Explain browser, server and database using the shop analogy. |
| 20-28 | 4 | Give each tool one job; show the two source folders. |
| 28-38 | 5 | Explain a component, props, JSX and the button callback. |
| 38-43 | 6 | Break and catch-up. |
| 43-53 | 7 | Trace a controlled input and state update. |
| 53-61 | 8 | Distinguish React state, localStorage and saved orders. |
| 61-71 | 9 | Follow the product-loading effect and response. |
| 71-85 | 10 | Pair exercise: change a label, verify behavior, trace search. |
| 85-90 | 11 | Four-question exit ticket. |

**Open these files, in this order:**

1. [main.jsx](../client/src/main.jsx): where the app is mounted; only a brief look.
2. [App.jsx](../client/src/App.jsx): the overall screen and state.
3. [ProductCard.jsx](../client/src/components/ProductCard.jsx): a reusable product card.
4. [CartPanel.jsx](../client/src/components/CartPanel.jsx): cart display and quantity controls.
5. [api.js](../client/src/api.js): the shared request helper, only when tracing product loading.

**Explain simply:**

> "A card does not need to know the whole shop. It receives one product and a function to call when someone clicks."

> "State is changing UI memory. When we update state, React can show the new result."

> "Adding to the cart changes browser state. It does not yet create an order."

**Lab acceptance checks:**

- Change only the existing `Add to cart` label to `Add to my bag`.
- All product cards show the new text.
- Clicking the button still increases the cart count and adds the correct item.
- Restore the original label.
- Search for `bottle`; explain `onChange -> setSearch -> filteredProducts -> rendered cards`.

**Exit ticket answers:**

1. A component is a reusable UI piece; props are its inputs.
2. State updates request a render; changed props can also cause rendering.
3. Add to cart does not call the order API.
4. The app saves and reloads the cart using browser localStorage.

### Day 2: understand the API and data

| Minutes | Slide | Teach / do |
|---|---:|---|
| 0-5 | 12 | Recall the three layers and set the day's goal. |
| 5-12 | 13 | Explain HTTP request/response and show the health endpoint. |
| 12-20 | 14 | Read the six-endpoint route map. |
| 20-28 | 15 | Read a JSON product response and its wrapper object. |
| 28-38 | 16 | Introduce Product, User and Order models. |
| 38-43 | 17 | Break and catch-up. |
| 43-53 | 18 | Trace the complete products route. |
| 53-61 | 19 | Explain server validation and common status codes. |
| 61-71 | 20 | Explain registration and password hashing. |
| 71-85 | 21 | Pair exercise: inspect product requests and search behavior. |
| 85-90 | 22 | Sentence-completion exit ticket. |

**Open these files:**

- [server.js](../server/src/server.js): route mounting and middleware.
- [productRoutes.js](../server/src/routes/productRoutes.js): the shortest complete route.
- [Product.js](../server/src/models/Product.js), [User.js](../server/src/models/User.js), [Order.js](../server/src/models/Order.js): field-level overview.
- [authRoutes.js](../server/src/routes/authRoutes.js): registration only; defer login to Day 3.

**Board trace:**

```text
App effect
  -> apiRequest("/api/products")
  -> Express route mount
  -> product route handler
  -> Product.find(...)
  -> MongoDB result
  -> { products: [...] }
  -> setProducts(data.products)
  -> ProductCard list
```

**Lab acceptance checks:**

- Open DevTools -> Network -> Fetch/XHR before reloading.
- Find `GET /api/products`; do not confuse it with image requests.
- Identify the `products` array inside the response object.
- Find where [App.jsx](../client/src/App.jsx) reads `data.products`.
- Type `bottle`; observe that the filter does not send another request for each keystroke.
- Development StrictMode can cause extra initial effect requests. Those are different from search requests.

**Exit ticket answers:**

1. The products router mounted by the server handles `GET /api/products`.
2. The Product model queries/works with MongoDB product documents through Mongoose.
3. The route responds with `{ products }`, and the client expects that shape.
4. The server stores a password hash, not the original password.

### Day 3: understand login and checkout

| Minutes | Slide | Teach / do |
|---|---:|---|
| 0-5 | 23 | Recall requests, models and why orders need identity. |
| 5-12 | 24 | Follow login from form to password comparison to session. |
| 12-20 | 25 | Explain signed JWTs, expiry and shared frontend auth state. |
| 20-28 | 26 | Follow the authentication middleware. |
| 28-38 | 27 | Inspect checkout input and server validation. |
| 38-43 | 28 | Break and demo preparation. |
| 43-53 | 29 | Calculate a total; explain snapshots and ownership. |
| 53-61 | 30 | Explain loading, success and failure states. |
| 61-71 | 31 | Teacher-led complete order trace with DevTools. |
| 71-85 | 32 | Pair exercise: signed out, signed in, different user. |
| 85-90 | 33 | Final explanation and four-point check. |

**Open these files:**

- [AuthPanel.jsx](../client/src/components/AuthPanel.jsx): form submission.
- [AuthContext.jsx](../client/src/auth/AuthContext.jsx): shared session and browser persistence.
- [authRoutes.js](../server/src/routes/authRoutes.js): login and token creation.
- [requireAuth.js](../server/src/middleware/requireAuth.js): the route gatekeeper.
- [App.jsx](../client/src/App.jsx): checkout handler.
- [orderRoutes.js](../server/src/routes/orderRoutes.js): validation, trusted calculation and ownership.
- [OrdersPanel.jsx](../client/src/components/OrdersPanel.jsx): loading the user's saved orders.

**The worked example:**

```text
2 x Insulated Bottle at INR 799 = INR 1,598
1 x Desk Lamp at INR 1,499    = INR 1,499
Total                       = INR 3,097
```

These are the default prices from the [seed data](../server/src/seed/seedProducts.js); an edited database can have different prices.

**Teacher-led demo checklist:**

1. Start with an empty cart and add the example items.
2. If signed out, choose `Place demo order` to show the auth screen.
3. Log in, then reopen the cart. Login returns to the shop; it does not automatically submit checkout.
4. Place the demo order. No real money is collected.
5. Inspect the request body: items contain `productId` and `quantity`.
6. Observe `POST /api/orders` returning `201` with `{ order }`.
7. Observe the cleared cart and order view, which fetches `GET /api/orders` with `{ orders }`.
8. Refresh, then open My orders again. The view resets to the shop, but the saved order persists.
9. Sign in as another test user, preferably in an incognito window. Only that user's orders should appear.

Do not display real passwords or authorization headers. Do not paste a token into an online JWT decoder.

**Lab acceptance checks:**

- Signed-out checkout opens authentication and does not save an order.
- Signed-in checkout saves an order and clears the cart after success.
- The saved order appears after refresh and reopening My orders.
- Another user sees only their own records (or an empty order history).
- Students can point to the server-side ownership filter, not just a hidden UI button.

**Final four-point check:**

1. React displays the product cards.
2. The Express server checks tokens and calculates prices.
3. MongoDB stores completed orders.
4. A cart is browser-local selection; an order is a saved record associated with a user.

Three or four correct answers demonstrate the basic mental model. If learners score lower, repeat one end-to-end trace rather than adding more features.

## 5. Important project facts to teach accurately

| Topic | What this application actually does |
|---|---|
| Navigation | Uses React `view` state; no React Router setup is present. |
| Search/category | Filters already-loaded products in the browser. |
| Product list | Backend returns active products sorted by name. |
| Cart | React state plus `shoplite_cart` in localStorage; no Cart model/API. |
| Cart ownership | Browser-local, not per-account or synchronized across devices; logout does not clear it. |
| Quantity | Maximum 20 per product; zero/removal removes a cart line. |
| Registration | Validates input, hashes the password, creates a user, and returns a signed-in session. |
| Session | React context plus `shoplite_session` in localStorage. |
| JWT | Signed, not encrypted; contains a user identifier and expires after two hours. |
| Logout | Clears the browser session; does not revoke an already-issued token on the server. |
| Expired session | No refresh-token flow or automatic session clearing; sign out and sign in again. |
| Checkout | Server uses IDs/quantities, verified user identity and current database prices. |
| Order snapshots | Item names and prices are copied into the saved order. |
| Order history | Server filters by authenticated user, newest first. |
| Repeated clicks | UI disables submission while waiting; no server idempotency mechanism is implemented. |
| Scope | Demo checkout only; no real payment, stock reservation, shipping, admin or production deployment. |

Mention production limitations briefly; do not turn this introductory workshop into a security or architecture lecture.

## 6. Before-class preparation

### Complete this outside teaching time

1. Read the [existing setup/build guide](../README.md) and rehearse on the actual classroom machines.
2. Install a supported Node.js version with npm and make MongoDB available.
3. Use an isolated, disposable classroom database, not important existing data.
4. Follow the README's local environment configuration instructions. Keep real connection strings and signing secrets private.
5. Install the existing dependencies in the backend and frontend directories.
6. Seed the products once into the intended classroom database.
7. Start backend and frontend in separate terminals.
8. Confirm health, products, account creation/login, cart and a saved demo order.
9. Prepare two fictitious test accounts and a fallback demonstration.

**PowerShell commands from the existing project root:**

Terminal A, after configuration and MongoDB are ready:

```powershell
Set-Location .\server
npm.cmd install
npm.cmd run seed
npm.cmd run dev
```

Terminal B, also starting from the project root:

```powershell
Set-Location .\client
npm.cmd install
npm.cmd run dev
```

Use `npm` instead of `npm.cmd` on platforms where appropriate. On Windows, `npm.cmd` avoids the common unsigned `npm.ps1` launcher issue without changing the machine's PowerShell execution policy.

**Data warning:** [the seed script](../server/src/seed/seedProducts.js) upserts by product slug. It can overwrite matching product fields, and does not reset users/orders. Run it only against the intended classroom database.

**Default checks:**

- `http://localhost:5000/api/health`: API status response.
- `http://localhost:5000/api/products`: database-backed product list.
- `http://localhost:5173`: frontend, unless Vite prints a different URL.

If ports change, align the client API URL and allowed client origin using the README. A health response alone is not a complete functional check.

### Prevent predictable interruptions

- The frontend manifest uses `latest` versions, so install and rehearse before class rather than discovering new requirements live.
- Product images use external URLs and may not load on restricted networks. Teach using names, prices and diagrams if needed.
- Have the working project available to students in advance.
- Pair students when a machine is blocked; do not spend the whole lesson installing software.
- Keep credentials out of screenshots, slides and shared messages.
- Do not use the production database or real payments for exercises.

## 7. A realistic two-day alternative

For **two 90-minute classes**, reduce the learning scope rather than rushing through every slide.

| Day A | Minutes |
|---|---:|
| Customer demo and shop analogy | 15 |
| Components, state and cart | 25 |
| Break | 5 |
| Product request/response trace | 20 |
| Guided inspection exercise | 20 |
| Recap | 5 |
| **Total** | **90** |

Use selected portions of slides 2-5, 7-9, 13, 15, 18 and 21.

| Day B | Minutes |
|---|---:|
| Recap | 5 |
| Login, signed token and route protection | 20 |
| Checkout, total and ownership | 20 |
| Break | 5 |
| Complete order demo and guided pair exercise | 30 |
| Final explanation | 10 |
| **Total** | **90** |

Use selected portions of slides 23-27 and 29-33.

Have the app running before class. Demonstrate registration rather than teaching its implementation; omit schema detail and move coding practice to homework. This shorter version teaches the mental model, not independent full-stack construction.

## 8. Short answers to common student questions

**Why not connect React directly to MongoDB?**  
The API provides a controlled place to authenticate requests, validate input and enforce rules without giving browser users database credentials.

**Why do we need React if we already know JavaScript?**  
React helps organize reusable UI pieces and keep the display consistent with changing state. It does not replace JavaScript.

**Are localStorage and MongoDB the same?**  
No. localStorage stores strings for this browser origin. MongoDB is server-side persistent storage shared through the API.

**Is JWT an encrypted password?**  
No. It is a signed token used to verify identity claims. The password is not stored inside the JWT here.

**Why calculate the total twice?**  
The browser gives immediate feedback; the server independently calculates the authoritative total from current database prices.

**Will two ordinary browser tabs represent two independent users?**  
Not reliably: they share localStorage for the same origin. Use an incognito session or a different browser profile for the second test user.

**Is this ready to accept real payments?**  
No. It is a learning application with demo checkout. Real deployment needs further security, reliability, testing and payment/inventory design.

## 9. After the workshop

Good next assignments:

1. Draw a complete product request with file names on each step.
2. Explain one checkout request in ordinary English, including who calculates the total.
3. Add a small frontend-only message using the existing filtered product count.
4. Use the [README](../README.md) for a slower from-scratch rebuild.

Keep the closing explanation simple:

> "React shows the shop and remembers the cart. Express checks requests and creates orders. MongoDB keeps the records. Login gives the browser a signed pass, and the server uses that identity to show only the customer's own orders."

### Material scope

The teaching content is based on the inspected application source. Preparing these materials does not itself certify that the application has been run or fully tested on classroom machines. Complete the pre-class rehearsal above before teaching.
