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
