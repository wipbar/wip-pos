import React from "react";
import Products from "../api/products";
import useTracker from "../hooks/useTracker";
import useSubscription from "../hooks/useSubscription";

export default function ProductPicker({ onProductPicked }) {
  useSubscription("products");
  const products = useTracker(() => Products.find().fetch());

  return (
    <div>
      <h2>products!</h2>
      <ul>
        {products.map(product => (
          <li key={product._id}>
            <button onClick={() => onProductPicked(product._id)}>
              {product.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
