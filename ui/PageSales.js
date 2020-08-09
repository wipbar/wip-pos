import { format, setHours, setMinutes, startOfDay, subHours } from "date-fns";
import { css } from "emotion";
import { groupBy } from "lodash";
import React, { useMemo } from "react";
import Sales from "../api/sales";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useMongoFetch from "../hooks/useMongoFetch";

const rolloverOffset = 4;

export default function PageSales() {
  const { location } = useCurrentLocation();
  const { data: sales, loading: salesLoading } = useMongoFetch(
    Sales.find({ locationId: location?._id }, { sort: { timestamp: -1 } }),
    [location],
  );
  const salesByDay = useMemo(
    () =>
      Object.entries(
        groupBy(sales, ({ timestamp }) =>
          startOfDay(subHours(timestamp, rolloverOffset)).toISOString(),
        ),
      )
        .map(([date, data]) => [new Date(date), data])
        .sort((a, b) => a[0] - b[0]),
    [sales],
  );

  if (salesLoading) return "Loading...";

  return (
    <>
      <ul
        className={css`
          padding: 0;
          margin: 0;
          list-style: none;
        `}
      >
        {salesByDay.map(([day, salesOfDay], i) => (
          <li
            key={day}
            className={css`
              padding: 0 4px;
              border: 2px solid red;
            `}
          >
            <details open={i === salesByDay.length - 1 ? "open" : undefined}>
              <summary
                className={css`
                  white-space: nowrap;
                `}
              >
                {format(day, "DD/MM/YYYY")}{" "}
                <code>
                  <b>
                    {salesOfDay.reduce((memo, { amount }) => memo + amount, 0)}
                  </b>
                </code>
                <small>{salesOfDay[0].currency}</small>
              </summary>
              <ul>
                {salesOfDay.map(({ products, ...sale }) => (
                  <li key={sale._id}>
                    {format(sale.timestamp, "HH:mm:ss")}{" "}
                    <code>
                      <b>{sale.amount}</b>
                    </code>
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
            </details>
          </li>
        ))}
      </ul>
      <small>
        Date rollover at{" "}
        {format(setMinutes(setHours(new Date(), rolloverOffset), 0), "HH:mm")}
      </small>
    </>
  );
}
