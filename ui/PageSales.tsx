import { css } from "@emotion/css";
import {
  format,
  max,
  min,
  setHours,
  setMinutes,
  startOfDay,
  subHours,
} from "date-fns";
import { groupBy, sumBy } from "lodash";
import { useFind } from "meteor/react-meteor-data";
import React, { useMemo } from "react";
import { isUserResponsible } from "../api/accounts";
import Products, { IProduct } from "../api/products";
import Sales, { ISale } from "../api/sales";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useCurrentUser from "../hooks/useCurrentUser";
import useSubscription from "../hooks/useSubscription";
import { emptyArray } from "../util";

const rolloverOffset = 6;

function saveAs(blob: string, type: string, name: string) {
  const a = window.document.createElement("a");
  a.href = window.URL.createObjectURL(new Blob([blob], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const getSaleExpenses = (sale: ISale, products: IProduct[]) =>
  sale.products.reduce((m, saleProduct) => {
    const currentProduct =
      products.find(({ _id }) => _id === saleProduct._id) || saleProduct;
    const shopPrice = (currentProduct.shopPrices || emptyArray)
      .filter(({ timestamp }) => timestamp < sale.timestamp)
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))?.[0]?.buyPrice;

    if (!shopPrice) return m + Number(saleProduct.salePrice);

    return m + Number(shopPrice);
  }, 0);

export default function PageSales() {
  const { location, error } = useCurrentLocation(true);
  const currentUser = useCurrentUser();
  const selectedCamp = useCurrentCamp();
  useSubscription(
    "sales",
    { from: selectedCamp?.buildup, to: selectedCamp?.teardown },
    [selectedCamp],
  );
  const sales = useFind(
    () =>
      selectedCamp &&
      Sales.find(
        {
          locationId: location?._id,
          timestamp: {
            $gte: selectedCamp?.buildup,
            $lte: selectedCamp?.teardown,
          },
        },
        { sort: { timestamp: -1 } },
      ),
    [location?._id, selectedCamp],
  );
  const products = useFind(() =>
    Products.find({ removedAt: { $exists: false } }),
  );
  const salesByDay = useMemo(
    () =>
      Object.entries(
        groupBy(sales, ({ timestamp }) =>
          min(
            max(
              startOfDay(subHours(timestamp, rolloverOffset)),
              startOfDay(subHours(selectedCamp!.start!, rolloverOffset)),
            ),
            startOfDay(subHours(selectedCamp!.end!, rolloverOffset)),
          ).toISOString(),
        ),
      )
        .map(([date, data]) => [new Date(date), data] as const)
        .sort(([a], [b]) => Number(a) - Number(b)),
    [sales, selectedCamp],
  );

  if (error) return error;

  return (
    <div>
      <ul
        className={css`
          padding: 0;
          margin: 0;
          list-style: none;
        `}
      >
        {salesByDay.map(([day, salesOfDay], i) => (
          <li
            key={Number(day)}
            className={css`
              padding: 0 4px;
              border: 2px solid red;
            `}
          >
            <details open={i === salesByDay.length - 1 ? true : undefined}>
              <summary
                className={css`
                  white-space: nowrap;
                `}
              >
                {format(
                  min(...salesOfDay.map(({ timestamp }) => timestamp)),
                  "DD/MM/YYYY",
                )}
                -
                {format(
                  max(...salesOfDay.map(({ timestamp }) => timestamp)),
                  "DD/MM/YYYY",
                )}{" "}
                <code>
                  <b>{sumBy(salesOfDay, "amount")}</b>
                  {isUserResponsible(currentUser) ? (
                    <span style={{ color: "limegreen" }}>
                      (+{" "}
                      {sumBy(
                        salesOfDay.map(
                          (sale) =>
                            sale.amount - getSaleExpenses(sale, products),
                        ),
                      )}
                      )
                    </span>
                  ) : null}
                </code>
                <small>{salesOfDay[0]?.currency}</small>{" "}
                <small>
                  <button
                    type="button"
                    disabled={!location}
                    onClick={async () => {
                      const userIsResponsible = await isUserResponsible(
                        currentUser,
                      );
                      const statements = salesOfDay.map((sale) => ({
                        timestamp: sale.timestamp,
                        amount: sale.amount,
                        cost: userIsResponsible
                          ? getSaleExpenses(sale, products)
                          : undefined,
                      }));

                      saveAs(
                        JSON.stringify(statements),
                        "application/json;charset=utf-8;",
                        `${location?.slug}-${format(day, "YYYY-MM-DD")}.json`,
                      );
                    }}
                  >
                    Download as JSON
                  </button>
                </small>
              </summary>
              <ul>
                {salesOfDay.map((sale) => (
                  <li key={sale._id}>
                    {format(sale.timestamp, "HH:mm:ss")}{" "}
                    <code>
                      <b>{sale.amount}</b>
                      {isUserResponsible(currentUser) ? (
                        <span style={{ color: "limegreen" }}>
                          (+ {sale.amount - getSaleExpenses(sale, products)})
                        </span>
                      ) : null}
                    </code>
                    <small>{sale.currency}</small>
                    <ul>
                      {sale.products.map((product, i) => (
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
    </div>
  );
}
