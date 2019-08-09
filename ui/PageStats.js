import React from "react";
import useSubscription from "../hooks/useSubscription";
import useTracker from "../hooks/useTracker";
import Sales from "../api/sales";
import Products from "../api/products";

export default function PageStats() {
  useSubscription("sales");
  const sales = useTracker(() => Sales.find().fetch());
  useSubscription("products");
  const products = useTracker(() =>
    Products.find({ removedAt: { $exists: false } }).fetch(),
  );
  const mostSold = Object.entries(
    sales.reduce((m, sale) => {
      sale.products.forEach(product => {
        m[product._id] = m[product._id] ? m[product._id] + 1 : 1;
      });
      return m;
    }, {}),
  ).sort(([, a], [, b]) => b - a);
  return (
    <>
      Most sold:
      <ul>
        {mostSold.map(([productId, count]) => {
          const product = products.find(({ _id }) => _id == productId);
          if (!product) return null;
          return (
            <li key={productId}>
              <big>{count}x </big>
              {product.brandName ? <>{product.brandName} - </> : null}
              {product.name}({product.unitSize}
              {product.sizeUnit})
            </li>
          );
        })}
      </ul>
    </>
  );
}
