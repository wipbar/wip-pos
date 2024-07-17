import convert from "convert";
import { subDays } from "date-fns";
import { useFind } from "meteor/react-meteor-data";
import React from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Sales from "../api/sales";
import Stocks from "../api/stocks";
import useCurrentCamp from "../hooks/useCurrentCamp";
import { emptyArray, getCorrectTextColor } from "../util";

const XYAxisDomain = ["dataMin", "dataMax"];
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

  const data = stocks.reduce(
    (memo: { timestamp: Date; amount: number }[], stock) => {
      const salesOfStock = sales.reduce(
        (memo: { timestamp: Date; amount: number }[], sale) => {
          const amountSold = sale.products.reduce(
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
          );
          if (amountSold) {
            memo.push({
              timestamp: sale.timestamp,
              amount: amountSold,
            });
          }

          return memo;
        },
        [],
      );
      return memo.concat(salesOfStock);
    },
    [],
  );

  console.log({ data });

  return (
    <>
      stocks:{" "}
      <div>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart
            data={data}
            margin={{ top: 24, right: 8, left: 16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" interval={23} />
            <YAxis
              domain={XYAxisDomain}
              tickFormatter={(amount: number) => String(~~amount)}
            />
            <Tooltip
              contentStyle={{
                background: currentCamp?.color,
                color:
                  currentCamp?.color && getCorrectTextColor(currentCamp?.color),
              }}
            />
            <Legend />
            {stocks.map((stock) => (
              <Line
                type="monotone"
                key={stock._id}
                dataKey={stock._id}
                name={stock.name}
                dot={false}
                connectNulls
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
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
        /*
        console.log({
          name: stock.name,
          amountAtMostRecentLevel,
          amountSoldSinceMostRecentLevel,
        });
        */
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
