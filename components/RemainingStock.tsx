import convert from "convert";
import { differenceInHours, isBefore, subDays } from "date-fns";
import { useFind } from "meteor/react-meteor-data";
import React, { useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Products, { IProduct } from "../api/products";
import Sales, { ISale } from "../api/sales";
import Stocks, { IStock } from "../api/stocks";
import useCurrentCamp from "../hooks/useCurrentCamp";
import { emptyArray, getCorrectTextColor } from "../util";

export const getMaxStockLevelEver = (stock: IStock) => {
  const levels = stock.levels?.map((level) => level.count) || [];
  return Math.max(...levels);
};

export const getStockLevelAtTime = (
  sales: ISale[],
  stock: IStock,
  timestamp: Date,
) => {
  if (isBefore(new Date(), timestamp)) return NaN;
  const precedingLevel = stock.levels
    ?.filter(
      (level) =>
        level.timestamp <= timestamp &&
        isBefore(subDays(new Date(), 14), new Date(level.timestamp)),
    )
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

  if (!precedingLevel) {
    return NaN;
  }

  const amountSoldSinceMostRecentLevel = sales.reduce(
    (memo, sale) =>
      sale.timestamp > precedingLevel.timestamp && sale.timestamp <= timestamp
        ? memo +
          sale.products.reduce(
            (productMemo, product) =>
              productMemo +
              (product.components
                ?.filter((c) => c.stockId === stock._id)
                .reduce((compMemo, component) => {
                  try {
                    return (
                      compMemo +
                      convert(component.unitSize, component.sizeUnit).to(
                        stock.sizeUnit,
                      ) /
                        stock.unitSize
                    );
                  } catch (e) {
                    /*
                      console.error(e);
                      console.log({
                        component,
                        stock,
                      });
                      */
                  }
                  return compMemo;
                }, 0) || 0),
            0,
          )
        : memo,
    0,
  );

  const amountAtMostRecentLevel = precedingLevel.count;
  const remainingStock =
    amountAtMostRecentLevel - amountSoldSinceMostRecentLevel;

  return remainingStock;
};

export function getRemainingServings(
  sales: ISale[],
  stocks: IStock[],
  product: IProduct,
  timestamp: Date,
) {
  let minServings;
  for (const component of product.components || []) {
    const stock = stocks.find((stock) => stock._id === component.stockId);
    if (!stock) continue;
    try {
      const componentServings =
        convert(
          getStockLevelAtTime(sales, stock, timestamp)!,
          stock.sizeUnit,
        ).to(component.sizeUnit) / component.unitSize;

      if (minServings === undefined || componentServings < minServings) {
        minServings = componentServings;
      }
    } catch {
      continue;
    }
  }

  if (minServings === undefined) {
    return NaN;
  }

  return minServings;
}
export function getApproxRemainingServings(
  stocks: IStock[],
  product: IProduct,
) {
  let minServings;
  for (const component of product.components || []) {
    const stock = stocks.find((stock) => stock._id === component.stockId);
    if (!stock) continue;

    try {
      const componentServings =
        convert(stock.approxCount ?? NaN, stock.sizeUnit).to(
          component.sizeUnit,
        ) / component.unitSize;

      if (minServings === undefined || componentServings < minServings) {
        minServings = componentServings;
      }
    } catch {
      continue;
    }
  }

  if (minServings === undefined) {
    return NaN;
  }

  return minServings;
}
export function getRemainingServingsEver(stocks: IStock[], product: IProduct) {
  let minServings;
  for (const component of product.components || []) {
    const stock = stocks.find((stock) => stock._id === component.stockId);
    if (!stock) continue;

    try {
      const componentServings =
        convert(getMaxStockLevelEver(stock), stock.sizeUnit).to(
          component.sizeUnit,
        ) / component.unitSize;

      if (minServings === undefined || componentServings < minServings) {
        minServings = componentServings;
      }
    } catch {
      continue;
    }
  }

  if (minServings === undefined) {
    return NaN;
  }

  return Math.max(0, minServings);
}

const HOUR_IN_MS = 3600 * 1000;
const offset = -6;
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
  const products = useFind(() => Products.find()) || emptyArray;
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

  const data = useMemo(() => {
    if (!currentCamp) return;

    const campHours = differenceInHours(currentCamp.end, currentCamp.start);

    const data: { [key: IProduct["_id"]]: number; hour: number }[] = [];
    for (let i = 0; i < campHours; i++) {
      const hourData: (typeof data)[number] = { hour: i };

      const hourEnd =
        Number(currentCamp.start) + (i + offset) * HOUR_IN_MS + HOUR_IN_MS;

      for (const product of products) {
        const maxLevel = getRemainingServingsEver(stocks, product);
        const level = getRemainingServings(
          sales,
          stocks,
          product,
          new Date(hourEnd),
        );

        if (typeof level === "number") {
          hourData[product._id] = Math.max(level / maxLevel, 0);
        }
      }

      data.push(hourData);
    }

    return data;
  }, [currentCamp, sales, products, stocks]);

  console.log({ data });

  return (
    <>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart
          data={data}
          margin={{ top: 24, right: 8, left: 16, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="hour"
            interval={23}
            tickFormatter={(hour) => "D" + String(Math.ceil((hour + 6) / 24))}
          />
          <YAxis
            domain={XYAxisDomain}
            tickFormatter={(amount: number) =>
              (amount * 100).toLocaleString("en-DK", {
                maximumFractionDigits: 0,
              }) + "%"
            }
          />
          <Tooltip
            contentStyle={{
              background: currentCamp?.color,
              color:
                currentCamp?.color && getCorrectTextColor(currentCamp?.color),
            }}
            formatter={(amount: number) =>
              (amount * 100).toLocaleString("en-DK", {
                maximumFractionDigits: 0,
              }) + "%"
            }
          />
          {/* <Legend /> */}
          {products
            .filter((product) => {
              const level = getRemainingServings(
                sales,
                stocks,
                product,
                new Date(
                  Number(currentCamp?.start) +
                    (6 + offset) * HOUR_IN_MS +
                    HOUR_IN_MS,
                ),
              );

              return level;
            })
            .sort(
              (a, b) =>
                getRemainingServings(sales, stocks, b, new Date())! -
                getRemainingServings(sales, stocks, a, new Date())!,
            )
            .map((product) => (
              <Line
                type="monotone"
                key={product._id}
                dataKey={product._id}
                name={product.name}
                dot={false}
                connectNulls
              />
            ))}
        </ComposedChart>
      </ResponsiveContainer>
      {null &&
        stocks
          .map((stock) => {
            const remainingStock = getStockLevelAtTime(
              sales,
              stock,
              new Date(),
            );

            if (Number.isNaN(remainingStock)) return null;

            return [stock, remainingStock] as const;
          })
          .filter((s): s is [IStock, number] => Boolean(s))
          .map(([stock, remainingStock]) => (
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
          ))}
    </>
  );
}
