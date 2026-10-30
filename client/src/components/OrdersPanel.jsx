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
