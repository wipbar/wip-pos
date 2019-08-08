import React from "react";
import Products from "../api/products";
import useTracker from "../hooks/useTracker";
import useSubscription from "../hooks/useSubscription";
import { css } from "emotion";

export default function ProductPicker({ onProductPicked, ...props }) {
  useSubscription("products");
  const products = useTracker(() => Products.find().fetch());
  return (
    <div {...props}>
      <h2>products!</h2>
      <div
        className={css`
          display: grid;
          grid-template-columns: repeat(3, 31%);
          grid-template-rows: repeat(3, auto);
          width: 100%;
          grid-gap: 0.5em;
        `}
      >
        {products.map(product => (
          <button
            key={product._id}
            onClick={() => onProductPicked(product._id)}
            className={css`
              background: lightgray;
              display: block;
              border-radius: 5px;
            `}
          >
            <big>{product.name}</big>
            <br />
            <i>
              {product.unitSize}
              {product.sizeUnit}
            </i>
            <br />
            <b>{product.salePrice} HAX</b>
          </button>
        ))}
      </div>
    </div>
  );
}
