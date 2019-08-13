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
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  Legend,
  YAxis,
} from "recharts";
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

  const salesByHour = useMemo(
    () =>
      allHours.map(hour => {
        const hourEnd = endOfHour(hour);
        return [
          hour,
          sales.filter(
            sale =>
              isAfter(sale.timestamp, hour) &&
              isBefore(sale.timestamp, hourEnd),
          ),
        ];
      }),
    [allHours, sales],
  );

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

  const data = useMemo(
    () =>
      salesByHour.map(([hour, hourSales]) => {
        return {
          hour: getHours(hour),
          beer: hourSales.reduce(
            (m, hourSale) =>
              hourSale.products.filter(({ _id, tags }) => {
                const product = products.find(product => product._id == _id);
                if (product)
                  return product.tags && product.tags.includes("beer");
                return tags && tags.includes("beer");
              }).length + m,
            0,
          ),
          mate: hourSales.reduce(
            (m, hourSale) =>
              hourSale.products.filter(({ _id, brandName }) => {
                const product = products.find(product => product._id == _id);
                if (product)
                  return (
                    product.brandName &&
                    product.brandName.toLowerCase().includes("mate")
                  );
                return brandName && brandName.toLowerCase().includes("mate");
              }).length + m,
            0,
          ),
        };
      }),
    [products, salesByHour],
  );

  return (
    <>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <Legend verticalAlign="top" height={36} />
          <XAxis dataKey="hour" interval={2} />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="beer"
            stackId="1"
            stroke="red"
            fill="red"
          />
          <Area
            type="monotone"
            dataKey="mate"
            stackId="1"
            stroke="yellow"
            fill="yellow"
          />
        </AreaChart>
      </ResponsiveContainer>
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
