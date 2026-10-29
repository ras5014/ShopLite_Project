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
