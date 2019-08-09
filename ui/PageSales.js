import React from "react";
import Sales from "../api/sales";
import useSubscription from "../hooks/useSubscription";
import useTracker from "../hooks/useTracker";

export default function PageSales() {
  useSubscription("sales");
  const sales = useTracker(() => Sales.find().fetch());
  return (
    sales && (
      <ul>
        {sales.map(({ products, ...sale }) => (
          <li key={sale._id}>
            {"" + sale.timestamp} {sale.amount}
            <small>{sale.currency}</small>
            <ul>
              {products.map(product => (
                <li key={sale._id + product._id}>
                  {product.name} {product.brandName}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    )
  );
}
