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
