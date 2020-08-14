import {
  addDays,
  addHours,
  differenceInDays,
  endOfHour,
  format,
  getHours,
  isAfter,
  isBefore,
  isFuture,
  isPast,
  min,
  setHours,
  startOfHour,
} from "date-fns";
import { css } from "emotion";
import React, { useMemo } from "react";
import Camps from "../api/camps";
import Products from "../api/products";
import Sales from "../api/sales";
import CampByCamp from "../components/CampByCamp";
import useMongoFetch from "../hooks/useMongoFetch";
import Countdown from "react-countdown";

const rolloverOffset = 4;
const renderer = ({ hours, minutes, seconds, completed }) => {
  return (
    <span
      className={css`
        font-size: 5em;
        ${hours == 0 && minutes <= 9
          ? `animation: blink-animation 1s steps(5, start) infinite, flash-animation 500ms steps(5, start) infinite;`
          : hours == 0
          ? `animation: blink-animation 1s steps(5, start) infinite;`
          : ""}
      `}
    >
      {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
      {String(seconds).padStart(2, "0")}
    </span>
  );
};

export default function PageStats() {
  const currentDate = new Date();
  const {
    data: [currentCamp],
    loading: campsLoading,
  } = useMongoFetch(Camps.find({}, { sort: { end: -1 } }));
  const from = startOfHour(
    setHours(
      isPast(currentCamp?.start) ? currentCamp?.start : currentCamp?.buildup,
      rolloverOffset,
    ),
  );
  const to = endOfHour(
    min(setHours(currentCamp?.end, rolloverOffset), currentDate),
  );

  const { data: sales, loading: salesLoading } = useMongoFetch(
    Sales.find({ timestamp: { $gt: from, $lt: to } }),
    [from, to],
  );
  const { data: products, loading: productsLoading } = useMongoFetch(
    Products.find({ removedAt: { $exists: false } }),
  );
  const earliestSale = useMemo(
    () => Math.min(...sales.map((sale) => getHours(sale.timestamp))),
    [sales],
  );
  const latestSale = useMemo(
    () => Math.max(...sales.map((sale) => getHours(sale.timestamp))),
    [sales],
  );
  const allHours = useMemo(() => {
    let hours = [];
    for (let i = from; isBefore(i, to); i = addHours(i, 1)) hours.push(i);

    return hours;
  }, [from, to]);
  const allDays = useMemo(() => {
    let days = [[]];
    let dayI = 0;
    let hourI = 0;
    for (let i = from; isBefore(i, to); i = addHours(i, 1)) {
      days[dayI].push(i);
      hourI++;
      if (hourI == 24) {
        hourI = 0;
        dayI++;
        days[dayI] = [];
      }
    }
    return days;
  }, [from, to]);
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
  const salesByDayAndHour = useMemo(
    () =>
      allDays.map((hours) =>
        hours.map((hour) => {
          const hourEnd = endOfHour(hour);
          return [
            hour,
            sales.filter(
              (sale) =>
                isAfter(sale.timestamp, hour) &&
                isBefore(sale.timestamp, hourEnd),
            ),
          ];
        }),
      ),
    //.filter((hours) => hours.length),
    [allDays, sales],
  );
  const mostSold = useMemo(
    () =>
      Object.entries(
        sales.reduce((m, sale) => {
          sale.products.forEach((product) => {
            m[product._id] = m[product._id] ? m[product._id] + 1 : 1;
          });
          return m;
        }, {}),
      ).sort(([, a], [, b]) => b - a),
    [sales],
  );
  const showHour = (hour) => getHours(hour) >= 13 || getHours(hour) <= 3;
  if (salesLoading || productsLoading || campsLoading) return "Loading...";

  const next2am = isAfter(startOfHour(setHours(currentDate, 6)), currentDate)
    ? startOfHour(setHours(currentDate, 2))
    : startOfHour(setHours(addDays(currentDate, 1), 2));
  return (
    <div
      className={css`
        padding-top: 8px;
        font-family: monospace;
        display: flex;
        height: 100%;
      `}
    >
      <div
        className={css`
          flex: 2;
          height: 100%;
        `}
      >
        {salesByDayAndHour?.some?.((d) => d.some(({ length }) => length)) ? (
          <table
            className={css`
              border-collapse: collapse;
              width: 100%;
            `}
          >
            <thead>
              <tr>
                <th />
                {salesByDayAndHour[0].map(([hour]) =>
                  showHour(hour) ? (
                    <th key={hour}>{format(hour, "HH")}</th>
                  ) : null,
                )}
              </tr>
            </thead>
            <tbody>
              {salesByDayAndHour.map((hours, i) =>
                hours.length ? (
                  <tr
                    key={hours[0][0]}
                    className={css`
                      background: ${(i + 1) % 2
                        ? "rgba(255,255,0,0.1)"
                        : "rgba(0,0,0,0)"};
                    `}
                  >
                    <th key={format(hours[0][0], "DD")}>
                      <div style={{ marginBottom: "-5px" }}>
                        <small>
                          DAY
                          <br />
                        </small>
                      </div>
                      <big>
                        {((diff) =>
                          diff === 0 ? (
                            <big>
                              <big style={{ lineHeight: 0 }}>{diff}</big>
                            </big>
                          ) : diff > 0 ? (
                            String(diff).padStart(2, "0")
                          ) : (
                            diff
                          ))(
                          differenceInDays(
                            hours[0][0],
                            setHours(currentCamp.start, rolloverOffset),
                          ) + 1,
                        )}
                      </big>
                    </th>
                    {hours.map(([hour, hourSales]) => {
                      if (!showHour(hour)) return null;
                      const beer = hourSales.reduce(
                        (m, hourSale) =>
                          hourSale.products.filter(({ _id, tags }) => {
                            const product = products.find(
                              (product) => product._id == _id,
                            );
                            if (product) return product.tags?.includes("beer");
                            return tags?.includes("beer");
                          }).length + m,
                        0,
                      );
                      const mate = hourSales.reduce(
                        (m, hourSale) =>
                          hourSale.products.filter(({ _id, name }) => {
                            const product = products.find(
                              (product) => product._id == _id,
                            );
                            if (product)
                              return product.name
                                ?.toLowerCase()
                                .includes("mate");
                            return name?.toLowerCase().includes("mate");
                          }).length + m,
                        0,
                      );
                      const others = hourSales.reduce(
                        (m, hourSale) =>
                          hourSale.products
                            .filter(({ _id, name }) => {
                              const product = products.find(
                                (product) => product._id == _id,
                              );
                              if (product)
                                return !product.name
                                  ?.toLowerCase()
                                  .includes("mate");
                              return !name?.toLowerCase().includes("mate");
                            })
                            .filter(({ _id, tags }) => {
                              const product = products.find(
                                (product) => product._id == _id,
                              );
                              if (product)
                                return !product.tags?.includes("beer");
                              return !tags?.includes("beer");
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
                            padding-top: calc(100% / 25);
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
                            {[mate, beer].map((productSales, i) => (
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
                ) : null,
              )}
            </tbody>
          </table>
        ) : null}
        <br />
        <CampByCamp />
      </div>
      <div
        className={css`
          padding-left: 32px;
          flex: 1;
        `}
      >
        <center>
          <big>
            <Countdown date={next2am} renderer={renderer} daysInHours />
            <br />
            <span
              className={css`
                font-size: 3.5em;
              `}
            >
              TILL CURFEW
            </span>
          </big>
        </center>
        <hr />
        Most sold @ {currentCamp.name}:
        <ul
          className={css`
            padding: 0;
          `}
        >
          {mostSold.map(([productId, count]) => {
            const product = products.find(({ _id }) => _id == productId);
            if (!product) return null;
            return (
              <li
                key={productId}
                className={css`
                  list-style: none;
                  display: flex;
                  align-items: flex-start;
                `}
              >
                <div
                  className={css`
                    width: 50px;
                    text-align: right;
                    margin-right: 8px;
                  `}
                >
                  <b>{count}</b>x
                </div>
                <div>
                  {product.brandName ? <>{product.brandName} - </> : null}
                  {product.name}({product.unitSize}
                  {product.sizeUnit})
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
