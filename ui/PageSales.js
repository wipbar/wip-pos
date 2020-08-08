import { format, startOfDay, subHours } from "date-fns";
import { groupBy } from "lodash";
import { useTracker } from "meteor/react-meteor-data";
import React, { useMemo } from "react";
import Sales from "../api/sales";
import useSubscription from "../hooks/useSubscription";

export default function PageSales() {
  const salesLoading = useSubscription("sales");
  const sales = useTracker(
    () => Sales.find({}, { sort: { timestamp: -1 } }).fetch() || [],
  );
  const salesByDay = useMemo(
    () =>
      Object.entries(
        groupBy(sales, ({ timestamp }) =>
          startOfDay(subHours(timestamp, 4)).toISOString(),
        ),
      ).map(([date, data]) => [new Date(date), data]),
    [sales],
  );

  if (salesLoading) return "Loading...";

  return (
    <ul>
      {salesByDay.map(([day, salesOfDay]) => (
        <li key={day}>
          {format(day, "DD/MM/YYYY")}{" "}
          {salesOfDay.reduce((memo, { amount }) => memo + amount, 0)}
          <small>{salesOfDay[0].currency}</small>
          <ul>
            {salesOfDay.map(({ products, ...sale }) => (
              <li key={sale._id}>
                {format(sale.timestamp, "HH:mm:ss")} {sale.amount}
                <small>{sale.currency}</small>
                <ul>
                  {products.map((product, i) => (
                    <li key={sale._id + i + product._id}>
                      {product.name} {product.brandName}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
