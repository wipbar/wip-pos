import convert from "convert";
import { subDays } from "date-fns";
import { useFind } from "meteor/react-meteor-data";
import React from "react";
import Sales from "../api/sales";
import Stocks from "../api/stocks";
import useCurrentCamp from "../hooks/useCurrentCamp";
import { emptyArray } from "../util";

export default function RemainingStock() {
  const currentCamp = useCurrentCamp();

  const sales =
    useFind(
      () =>
        Sales.find({
          timestamp: { $gte: currentCamp?.start, $lte: currentCamp?.end },
        }),
      [currentCamp],
    ) || emptyArray;
  const stocks = useFind(
    () =>
      Stocks.find({
        levels: {
          $elemMatch: {
            timestamp: {
              $gte: subDays(currentCamp?.start || new Date(0), 14),
              $lte: currentCamp?.end,
            },
          },
        },
      }),
    [currentCamp],
  );

  return (
    <>
      stocks:{" "}
      {stocks.map((stock) => {
        const mostRecentLevel = stock.levels?.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        )[0];
        if (!mostRecentLevel) return null;
        const amountSoldSinceMostRecentLevel = sales.reduce(
          (memo, sale) =>
            sale.timestamp > mostRecentLevel?.timestamp
              ? memo +
                sale.products.reduce(
                  (productMemo, product) =>
                    productMemo +
                    (product.components
                      ?.filter((c) => c.stockId === stock._id)
                      .reduce(
                        (compMemo, component) =>
                          compMemo +
                          convert(component.unitSize, component.sizeUnit).to(
                            stock.sizeUnit,
                          ),
                        0,
                      ) || 0),
                  0,
                )
              : memo,
          0,
        );

        const amountAtMostRecentLevel = mostRecentLevel.count * stock.unitSize;
        const remainingStock =
          amountAtMostRecentLevel - amountSoldSinceMostRecentLevel;

        if (remainingStock > 0) {
          //          return null
        }
        console.log({
          name: stock.name,
          amountAtMostRecentLevel,
          amountSoldSinceMostRecentLevel,
        });
        return (
          <div key={stock._id}>
            {stock.name}:{" "}
            {stock.sizeUnit === "l" ||
            stock.sizeUnit === "cl" ||
            stock.sizeUnit === "ml"
              ? `${convert(remainingStock, stock.sizeUnit)
                  .to("l")
                  .toLocaleString("en-DK", { maximumFractionDigits: 1 })}l`
              : stock.sizeUnit === "kg" || stock.sizeUnit === "g"
              ? `${convert(remainingStock, stock.sizeUnit)
                  .to("kg")
                  .toLocaleString("en-DK", { maximumFractionDigits: 1 })}l`
              : `${remainingStock * stock.unitSize}${stock.sizeUnit}`}
          </div>
        );
      })}
    </>
  );
}
