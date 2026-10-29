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
