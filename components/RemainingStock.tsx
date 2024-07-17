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
        const salesSinceMostRecentLevel = sales.filter(
          (sale) => sale.timestamp > mostRecentLevel?.timestamp,
        );
        const remainingStock =
          mostRecentLevel.count - salesSinceMostRecentLevel.length;

        if (remainingStock < 1) {
          return null;
        }
        return (
          <div key={stock._id}>
            {stock.name}: {remainingStock}
          </div>
        );
      })}
    </>
  );
}
