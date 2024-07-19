import convert from "convert";
import { subDays } from "date-fns";
import { useFind } from "meteor/react-meteor-data";
import React, { useMemo } from "react";
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
import Stocks, { IStock } from "../api/stocks";
import useCurrentCamp from "../hooks/useCurrentCamp";
import { emptyArray, getCorrectTextColor } from "../util";

const HOUR_IN_MS = 3600 * 1000;
const offset = -6;
const XYAxisDomain = ["dataMin", "dataMax"];
export default function RemainingStock() {
  return null;
  /*
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

  function getStockLevelAtTime(stock: IStock, timestamp: Date) {
    const precedingLevel = stock.levels
      ?.filter((level) => level.timestamp <= timestamp)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    if (!precedingLevel) return null;

    const amountSoldSinceMostRecentLevel = sales.reduce(
      (memo, sale) =>
        sale.timestamp > timestamp
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
                        )
                      );
                    } catch (e) {
                      console.error(e);
                      console.log({
                        component,
                        stock,
                      });
                    }
                    return compMemo;
                  }, 0) || 0),
              0,
            )
          : memo,
      0,
    );

    const amountAtMostRecentLevel = precedingLevel.count * stock.unitSize;
    const remainingStock =
      amountAtMostRecentLevel - amountSoldSinceMostRecentLevel;

    return remainingStock;
  }

  const data = useMemo(async () => {
    const now = new Date();

    const [camps, sales] = await Promise.all([
      Camps.find(
        {},
        { sort: { start: 1 }, fields: { slug: 1, start: 1, end: 1 } },
      ).fetchAsync() as Promise<Pick<ICamp, "slug" | "start" | "end">[]>,
      Sales.find(
        {},
        { fields: { timestamp: 1, amount: 1 } },
      ).fetchAsync() as Promise<Pick<ISale, "_id" | "amount" | "timestamp">[]>,
    ]);

    const now2 = new Date();

    const longestCamp = camps.reduce<Pick<
      ICamp,
      "slug" | "start" | "end"
    > | null>((memo, camp) => {
      if (!memo) return camp;

      if (
        Number(camp.end) - Number(camp.start) >
        Number(memo.end) - Number(memo.start)
      ) {
        memo = camp;
      }
      return memo;
    }, null);

    const longestCampHours = longestCamp
      ? differenceInHours(longestCamp.end, longestCamp.start)
      : 0;

    const data: { [key: string]: number; hour: number }[] = [];
    const campTotals: Record<string, number> = {};
    for (let i = 0; i < longestCampHours; i++) {
      // avoid blocking the event loop for too long at a time
      await new Promise((y) => setImmediate(y));

      const datapoint: (typeof data)[number] = { hour: i };

      for (const { slug, start } of camps) {
        const hourStart = Number(start) + (i + offset) * HOUR_IN_MS;
        const hourEnd = hourStart + HOUR_IN_MS;

        let count = 0;
        for (const { timestamp, amount } of sales) {
          const ts = Number(timestamp);

          if (ts >= hourStart && ts < hourEnd) count += amount;
        }

        if (count) {
          campTotals[slug] = datapoint[slug] = (campTotals[slug] || 0) + count;
        }
      }

      data.push(datapoint);
    }
  }, []);

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
      {stocks
        .map((stock) => {
          const remainingStock = getStockLevelAtTime(stock, new Date());

          if (remainingStock === null) return null;

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
  */
}
