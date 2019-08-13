import {
  addHours,
  endOfHour,
  format,
  getHours,
  isAfter,
  isBefore,
  setHours,
  startOfHour,
} from "date-fns";
import { css } from "emotion";
import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Products from "../api/products";
import Sales from "../api/sales";
import useSubscription from "../hooks/useSubscription";
import useTracker from "../hooks/useTracker";

export default function PageStats() {
  useSubscription("sales");
  const sales = useTracker(() => Sales.find().fetch());
  useSubscription("products");
  const products = useTracker(() =>
    Products.find({ removedAt: { $exists: false } }).fetch(),
  );
  const [firstSale] = useMemo(
    () => (sales ? [...sales].sort((a, b) => a.timestamp - b.timestamp) : []),
    [sales],
  );
  const currentDate = new Date();
  const allHours = useMemo(() => {
    let hours = [];
    if (firstSale) {
      const from = startOfHour(setHours(firstSale.timestamp, 6));
      const to = endOfHour(setHours(currentDate, 5));
      for (let i = from; isBefore(i, to); i = addHours(i, 1)) {
        hours.push(i);
      }
    }
    return hours;
  }, [firstSale, currentDate]);
  const allDays = useMemo(() => {
    let days = [[]];
    if (firstSale) {
      const from = startOfHour(setHours(firstSale.timestamp, 6));
      const to = endOfHour(currentDate);
      console.log({ from, to });
      let dayI = 0;
      let hourI = 0;
      for (let i = from; isBefore(i, to); i = addHours(i, 1)) {
        console.log({ dayI, hourI });
        days[dayI].push(i);
        hourI++;
        if (hourI == 24) {
          hourI = 0;
          dayI++;
          days[dayI] = [];
        }
      }
    }
    return days;
  }, [firstSale, currentDate]);
  let mostSoldProductsPerHour = useMemo(
    () =>
      allHours.reduce((m, hour) => {
        const hourEnd = endOfHour(hour);
        const numberOfProductsSoldThisHour = sales
          .filter(
            ({ timestamp }) =>
              isAfter(timestamp, hour) && isBefore(timestamp, hourEnd),
          )
          .reduce((mn, sale) => sale.products.length + mn, 0);
        return numberOfProductsSoldThisHour > m
          ? numberOfProductsSoldThisHour
          : m;
      }, 0),
    [allHours, sales],
  );
  const salesByHour = useMemo(
    () =>
      allHours.map(hour => {
        const hourEnd = endOfHour(hour);
        const salesOfHour = sales.filter(
          sale =>
            isAfter(sale.timestamp, hour) && isBefore(sale.timestamp, hourEnd),
        );
        return [hour, salesOfHour];
      }),
    [allHours, sales],
  );
  const salesByDayAndHour = useMemo(
    () =>
      allDays.map(hours =>
        hours.map(hour => {
          const hourEnd = endOfHour(hour);
          return [
            hour,
            sales.filter(
              sale =>
                isAfter(sale.timestamp, hour) &&
                isBefore(sale.timestamp, hourEnd),
            ),
          ];
        }),
      ),
    [allDays, sales],
  );
  const mostSold = useMemo(
    () =>
      Object.entries(
        sales.reduce((m, sale) => {
          sale.products.forEach(product => {
            m[product._id] = m[product._id] ? m[product._id] + 1 : 1;
          });
          return m;
        }, {}),
      ).sort(([, a], [, b]) => b - a),
    [sales],
  );
  const data = useMemo(
    () =>
      salesByHour.map(([hour, hourSales]) => {
        return {
          hour: getHours(hour),
          beer: hourSales.reduce(
            (m, hourSale) =>
              hourSale.products.filter(({ _id, tags }) => {
                const product = products.find(product => product._id == _id);
                if (product)
                  return product.tags && product.tags.includes("beer");
                return tags && tags.includes("beer");
              }).length + m,
            0,
          ),
          mate: hourSales.reduce(
            (m, hourSale) =>
              hourSale.products.filter(({ _id, name }) => {
                const product = products.find(product => product._id == _id);
                if (product)
                  return (
                    product.name && product.name.toLowerCase().includes("mate")
                  );
                return name && name.toLowerCase().includes("mate");
              }).length + m,
            0,
          ),
        };
      }),
    [products, salesByHour],
  );
  console.log(mostSoldProductsPerHour);
  return (
    <>
      {salesByDayAndHour &&
      salesByDayAndHour.length &&
      salesByDayAndHour[0] &&
      salesByDayAndHour[0].length ? (
        <table
          className={css`
            border-collapse: collapse;
          `}
        >
          <thead>
            <tr>
              <th />
              {salesByDayAndHour[0].map(([hour]) => (
                <th key={hour}>{format(hour, "HH")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {salesByDayAndHour.map(hours => (
              <tr key={hours[0][0]}>
                <th key={format(hours[0][0], "DD")}>
                  {format(hours[0][0], "ddd")}
                </th>
                {hours.map(([hour, hourSales]) => {
                  const beer = hourSales.reduce(
                    (m, hourSale) =>
                      hourSale.products.filter(({ _id, tags }) => {
                        const product = products.find(
                          product => product._id == _id,
                        );
                        if (product)
                          return product.tags && product.tags.includes("beer");
                        return tags && tags.includes("beer");
                      }).length + m,
                    0,
                  );
                  const mate = hourSales.reduce(
                    (m, hourSale) =>
                      hourSale.products.filter(({ _id, name }) => {
                        const product = products.find(
                          product => product._id == _id,
                        );
                        if (product)
                          return (
                            product.name &&
                            product.name.toLowerCase().includes("mate")
                          );
                        return name && name.toLowerCase().includes("mate");
                      }).length + m,
                    0,
                  );
                  const others = hourSales.reduce(
                    (m, hourSale) =>
                      hourSale.products
                        .filter(({ _id, name }) => {
                          const product = products.find(
                            product => product._id == _id,
                          );
                          if (product)
                            return !(
                              product.name &&
                              product.name.toLowerCase().includes("mate")
                            );
                          return !name && name.toLowerCase().includes("mate");
                        })
                        .filter(({ _id, tags }) => {
                          const product = products.find(
                            product => product._id == _id,
                          );
                          if (product)
                            return (
                              product.tags && product.tags.includes("beer")
                            );
                          return tags && tags.includes("beer");
                        }).length + m,
                    0,
                  );
                  return (
                    <td
                      key={hour}
                      className={css`
                        text-align: center;
                        border-top: 1px solid rgba(255, 255, 255, 0.4);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.4);
                        padding-top: calc(100% / 24);
                        position: relative;
                      `}
                    >
                      <div
                        className={css`
                          position: absolute;
                          height: 100%;
                          width: 100%;
                          bottom: 0;
                          left: 0;
                          right: 0;
                          top: 0;
                          display: flex;
                          flex-direction: column-reverse;
                        `}
                      >
                        {[mate, beer, others].map((productSales, i) => (
                          <div
                            key={["mate", "beer", "others"][i]}
                            className={css`
                              height: ${(productSales /
                                mostSoldProductsPerHour) *
                                100}%;
                              background-color: ${[
                                "yellow",
                                "red",
                                "lightgray",
                              ][i]};
                            `}
                          />
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <Legend verticalAlign="top" height={36} />
          <XAxis dataKey="hour" interval={2} />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="beer"
            stackId="1"
            stroke="red"
            fill="red"
          />
          <Area
            type="monotone"
            dataKey="mate"
            stackId="1"
            stroke="yellow"
            fill="yellow"
          />
        </AreaChart>
      </ResponsiveContainer>
      <hr />
      Most sold:
      <ul>
        {mostSold.map(([productId, count]) => {
          const product = products.find(({ _id }) => _id == productId);
          if (!product) return null;
          return (
            <li key={productId}>
              <big>{count}x </big>
              {product.brandName ? <>{product.brandName} - </> : null}
              {product.name}({product.unitSize}
              {product.sizeUnit})
            </li>
          );
        })}
      </ul>
    </>
  );
}
