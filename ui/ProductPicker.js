import React from "react";
import Products from "../api/products";
import useTracker from "../hooks/useTracker";
import useSubscription from "../hooks/useSubscription";

export default function ProductPicker({ onProductPicked, ...props }) {
  useSubscription("products");
  const products = useTracker(() => Products.find().fetch());

  return (
    <div {...props}>
      <h2>products!</h2>
      <ul>
        {products.map(product => (
          <li key={product._id}>
            <button onClick={() => onProductPicked(product._id)}>
              <big>{product.name}</big>
              <br />
              <i>
                {product.unitSize}
                {product.sizeUnit}
              </i>
              <br />
              <b>{product.salePrice} HAX</b>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
