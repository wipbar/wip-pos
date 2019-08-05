import React from "react";
import { useTracker } from "react-meteor-hooks";
import Products from "../api/products";

export default function ProductPicker() {
  const products = useTracker(() => Products.find().fetch());
  return (
    <div>
      <h2>products!</h2>
      <ul>
        {products.map(product => (
          <li key={product._id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
}
