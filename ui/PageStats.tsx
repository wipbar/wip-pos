import {
  addDays,
  endOfHour,
  isAfter,
  isPast,
  min,
  setHours,
  startOfHour,
} from "date-fns";
import { css } from "emotion";
import React, { useMemo } from "react";
import Countdown from "react-countdown";
import Products from "../api/products";
import Sales from "../api/sales";
import CampByCamp from "../components/CampByCamp";
import DayByDay from "../components/DayByDay";
import SalesSankey from "../components/SalesSankey";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentDate from "../hooks/useCurrentDate";
import useMongoFetch from "../hooks/useMongoFetch";

const rolloverOffset = 5;
const renderer = ({
  hours,
  minutes,
  seconds,
}: {
  hours: number;
  minutes: number;
  seconds: number;
}) => {
  return (
    <span
      className={css`
        font-size: 5em;
        display: inline-block;
        transform-origin: 50% 50%;
        ${hours == 0 && minutes <= 4
          ? `animation: blink-animation 1s steps(5, start) infinite, flash-animation 500ms steps(5, start) infinite, shake 300ms infinite;`
          : hours == 0 && minutes <= 14
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

function CurfewCountdown() {
  const currentDate = useCurrentDate(50);
  const next2am = useMemo(
    () =>
      isAfter(startOfHour(setHours(currentDate, 6)), currentDate)
        ? startOfHour(setHours(currentDate, 2))
        : startOfHour(setHours(addDays(currentDate, 1), 2)),
    [currentDate],
  );
  return (
    <div
      className={css`
        text-align: center;
      `}
    >
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
    </div>
  );
}

export default function PageStats() {
  const currentDate = useCurrentDate(2000);
  const currentCamp = useCurrentCamp();
  const from = useMemo(
    () =>
      currentCamp &&
      startOfHour(
        setHours(
          isPast(currentCamp.start) ? currentCamp.start : currentCamp.buildup,
          rolloverOffset,
        ),
      ),
    [currentCamp],
  );
  const to = useMemo(
    () =>
      currentCamp &&
      endOfHour(min(setHours(currentCamp.end, rolloverOffset), currentDate)),
    [currentCamp, currentDate],
  );

  const { data: sales } = useMongoFetch(
    from && to && Sales.find({ timestamp: { $gt: from, $lt: to } }),
    [from, to],
  );
  const { data: products } = useMongoFetch(
    Products.find({ removedAt: { $exists: false } }),
  );
  const mostSold = useMemo(
    () =>
      Object.entries(
        sales.reduce<Record<string, number>>((m, sale) => {
          sale.products.forEach((product) => {
            m[product._id] = m[product._id] ? m[product._id] + 1 : 1;
          });
          return m;
        }, {}),
      ).sort(([, a], [, b]) => b - a),
    [sales],
  );

  return (
    <div
      className={css`
        padding-top: 8px;
        font-family: monospace;
        display: flex;
        height: 100%;
        width: 100%;
        max-width: 100%;
        flex-wrap: wrap;
      `}
    >
      <div
        className={css`
          flex: 2;
          min-height: 100%;
          min-width: 400px;
        `}
      >
        <SalesSankey currentCamp={currentCamp} />
        <div
          className={css`
            display: flex;
            flex-wrap: wrap;
            > * {
              width: 100%;
            }

            @media (min-width: 900px) {
              > * {
                width: 50%;
              }
            }
          `}
        >
          <CampByCamp />
          <DayByDay />
        </div>
      </div>
      <div
        className={css`
          padding-left: 32px;
          flex: 1;
        `}
      >
        <CurfewCountdown />
        <hr />
        <big>Most sold @ {currentCamp?.name}:</big>
        <ul
          className={css`
            padding: 0;
          `}
        >
          {mostSold.length ? (
            mostSold.map(([productId, count]) => {
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
                      flex-shrink: 0;
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
            })
          ) : (
            <i>Nothing has been sold yet :(</i>
          )}
        </ul>
      </div>
    </div>
  );
}
