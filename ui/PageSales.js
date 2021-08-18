import { format, setHours, setMinutes, startOfDay, subHours } from "date-fns";
import { css } from "emotion";
import { groupBy } from "lodash";
import React, { useMemo } from "react";
import Sales from "../api/sales";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useMongoFetch from "../hooks/useMongoFetch";

const rolloverOffset = 5;

function saveAs(blob, type, name) {
  const a = window.document.createElement("a");
  a.href = window.URL.createObjectURL(new Blob([blob], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function PageSales() {
  const { location, error } = useCurrentLocation(true);
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
        .sort(([a], [b]) => a - b),
    [sales],
  );

  if (salesLoading) return "Loading...";

  if (error) return error;

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
                  (+{" "}
                  {salesOfDay
                    .map(({ products }) =>
                      products.reduce(
                        (m, product) =>
                          m +
                          (product.salePrice -
                            ([...(product.shopPrices || [])].sort(
                              (a, b) => b.timestamp - a.timestamp,
                            )?.[0]?.buyPrice || NaN)),
                        0,
                      ),
                    )
                    .reduce((memo, profit) => memo + profit)}
                  )
                </code>
                <small>{salesOfDay[0].currency}</small>{" "}
                <small>
                  <button
                    type="button"
                    onClick={() =>
                      saveAs(
                        JSON.stringify(
                          salesOfDay.map(({ timestamp, amount }) => ({
                            timestamp,
                            amount,
                          })),
                        ),
                        "application/json;charset=utf-8;",
                        `${location.slug}-${format(day, "YYYY-MM-DD")}.json`,
                      )
                    }
                  >
                    Download as JSON
                  </button>
                </small>
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
                          {product.brandName ? (
                            <>{product.brandName} - </>
                          ) : null}{" "}
                          {product.name}
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
