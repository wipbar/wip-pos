import convert from "convert";
import { differenceInHours, subDays } from "date-fns";
import { useFind } from "meteor/react-meteor-data";
import { useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Products, { getProductName, type IProduct } from "../api/products";
import Sales from "../api/sales";
import Stocks, {
  getRemainingServings,
  getRemainingServingsEver,
  getStockLevelAtTime,
  type IStock,
} from "../api/stocks";
import useCurrentCamp from "../hooks/useCurrentCamp";
import { emptyArray, getCorrectTextColor } from "../util";

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
  const products = useFind(() => Products.find(), []) || emptyArray;
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
        const maxLevel = getRemainingServingsEver(currentCamp, stocks, product);
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
            formatter={(amount) =>
              (Number(amount) * 100).toLocaleString("en-DK", {
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
                getRemainingServings(sales, stocks, b, new Date()) -
                getRemainingServings(sales, stocks, a, new Date()),
            )
            .map((product) => (
              <Line
                type="monotone"
                key={product._id}
                dataKey={product._id}
                name={getProductName(product, stocks)}
                dot={false}
                connectNulls
              />
            ))}
        </ComposedChart>
      </ResponsiveContainer>
      {!Math.random() &&
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
                    .toLocaleString("en-DK", { maximumFractionDigits: 1 })}kg`
                : `${remainingStock * stock.unitSize}${stock.sizeUnit}`}
            </div>
          ))}
    </>
  );
}
