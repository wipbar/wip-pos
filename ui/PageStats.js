import {
  addHours,
  endOfHour,
  getHours,
  isAfter,
  isBefore,
  startOfHour,
} from "date-fns";
import { css } from "emotion";
import React, { useMemo } from "react";
import Products from "../api/products";
import Sales from "../api/sales";
import useSubscription from "../hooks/useSubscription";
import useTracker from "../hooks/useTracker";

export default function PageStats() {
  useSubscription("sales");
  const sales = useTracker(() => Sales.find().fetch());
  useSubscription("products");
  const products = useTracker(() =>
    Products.find({ removedAt: { $exists: false } }).fetch(),
  );
  const [firstSale] = useMemo(
    () => (sales ? [...sales].sort((a, b) => a.timestamp - b.timestamp) : []),
    [sales],
  );
  const allHours = useMemo(() => {
    let hours = [];
    if (firstSale) {
      const from = startOfHour(firstSale.timestamp);
      const to = endOfHour(new Date());
      for (let i = from; isBefore(i, to); i = addHours(i, 1)) {
        hours.push(i);
      }
    }
    return hours;
  }, [firstSale, sales]);
  console.log(allHours);
  const salesByHour = allHours.map(hour => {
    const hourEnd = endOfHour(hour);
    return [
      hour,
      sales.filter(
        sale =>
          isAfter(sale.timestamp, hour) && isBefore(sale.timestamp, hourEnd),
      ),
    ];
  });
  console.log(salesByHour);

  const mostSold = useMemo(
    () =>
      Object.entries(
        sales.reduce((m, sale) => {
          sale.products.forEach(product => {
            m[product._id] = m[product._id] ? m[product._id] + 1 : 1;
          });
          return m;
        }, {}),
      ).sort(([, a], [, b]) => b - a),
    [sales],
  );
  const mostSalesInAnHour = salesByHour.reduce((m, [, hourSales]) => {
    const total = hourSales.reduce(
      (m, hourSale) =>
        hourSale.products.filter(({ _id, tags }) => {
          const product = products.find(product => product._id == _id);
          if (product) return product.tags && product.tags.includes("beer");
          return tags && tags.includes("beer");
        }).length + m,
      0,
    );
    if (total > m) m = total;
    return m;
  }, 0);
  return (
    <>
      <div
        className={css`
          display: flex;
          max-width: 100%;
          height: 10em;
          align-items: flex-end;
          margin-bottom: 1em;
        `}
      >
        {salesByHour.map(([hour, hourSales]) => {
          return (
            <div
              key={hour}
              className={css`
                flex: 1;
                text-align: center;
                font-size: 0.8em;
                background-color: red;
                height: ${(hourSales.reduce(
                  (m, hourSale) =>
                    hourSale.products.filter(({ _id, tags }) => {
                      const product = products.find(
                        product => product._id == _id,
                      );
                      if (product)
                        return product.tags && product.tags.includes("beer");
                      return tags && tags.includes("beer");
                    }).length + m,
                  0,
                ) /
                  mostSalesInAnHour) *
                  10}em;
              `}
            >
              {getHours(hour)}
            </div>
          );
        })}
      </div>
      <hr />
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
