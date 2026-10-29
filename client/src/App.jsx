import { useEffect, useState } from "react";
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
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState(readCart);
  const [view, setView] = useState("shop");
  const [authMode, setAuthMode] = useState("login");
  const [notice, setNotice] = useState("");
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  // Stage 2: load products, then filter the list in the browser.
  useEffect(() => {
    let isActive = true;

    async function loadProducts() {
      setProductsLoading(true);
      setProductsError("");
      try {
        const data = await apiRequest("/api/products");
        if (isActive) {
          setProducts(data.products);
        }
      } catch (error) {
        if (isActive) {
          setProductsError(error.message);
        }
      } finally {
        if (isActive) {
          setProductsLoading(false);
        }
      }
    }

    loadProducts();
    return () => {
      isActive = false;
    };
  }, []);

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
  async function checkout() {
    if (!token) {
      setAuthMode("login");
      setView("auth");
      setNotice("Log in or create an account before checking out.");
      return;
    }
    if (cart.length === 0 || checkoutSubmitting) {
      return;
    }

    const items = cart.map((item) => {
      return { productId: item.productId, quantity: item.quantity };
    });
    setCheckoutSubmitting(true);
    setNotice("");

    try {
      const data = await apiRequest("/api/orders", {
        method: "POST",
        token,
        body: { items },
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

              {productsLoading && <p className="muted">Loading products…</p>}
              {productsError && (
                <p className="alert alert-error" role="alert">
                  {productsError} Check that the backend is running and MongoDB is connected.
                </p>
              )}
              {!productsLoading && !productsError && filteredProducts.length === 0 && (
                <div className="empty-state panel">
                  <h3>No products found</h3>
                  <p className="muted">Try another search or category.</p>
                </div>
              )}
              {!productsLoading && !productsError && filteredProducts.length > 0 && (
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
            submitting={checkoutSubmitting}
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
