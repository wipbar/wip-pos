import { css } from "@emotion/css";
import { addDays, isAfter, setHours, startOfHour } from "date-fns";
import { useFind } from "meteor/react-meteor-data";
import React, { useMemo } from "react";
import Countdown from "react-countdown";
import Camps from "../api/camps";
import Products, { ProductID } from "../api/products";
import Sales from "../api/sales";
import CampByCamp from "../components/CampByCamp";
import DayByDay from "../components/DayByDay";
import SalesSankey from "../components/SalesSankey";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentDate from "../hooks/useCurrentDate";
import useMongoFetch from "../hooks/useMongoFetch";

const renderer = ({
  days,
  hours,
  minutes,
  seconds,
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}) => {
  return (
    <span
      className={css`
        font-size: 5em;
        white-space: nowrap;
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
      {days > 2 ? (
        <>{Math.round(days + hours / 24)} DAYS TILL</>
      ) : (
        <>
          {String(days * 24 + hours).padStart(2, "0")}:
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </>
      )}
    </span>
  );
};

function CurfewCountdown() {
  const currentDate = useCurrentDate(50);
  const currentCamp = useCurrentCamp();
  const [newestCamp] = useFind(() => Camps.find({}, { sort: { end: -1 } }));
  const camp = currentCamp || newestCamp;
  const next2am = useMemo(
    () =>
      isAfter(startOfHour(setHours(currentDate, 6)), currentDate)
        ? startOfHour(setHours(currentDate, 2))
        : startOfHour(setHours(addDays(currentDate, 1), 2)),
    [currentDate],
  );
  const countDownTo = useMemo(
    () =>
      (camp && isAfter(camp.buildup, currentDate) && camp.buildup) ||
      (camp && isAfter(camp.start, currentDate) && camp.start) ||
      next2am,
    [camp, currentDate, next2am],
  );

  if (!camp) return null;

  return (
    <div
      className={css`
        text-align: center;
      `}
    >
      <big>
        <Countdown date={countDownTo} renderer={renderer} daysInHours />
        <br />
        <span
          className={css`
            font-size: 3.5em;
            white-space: nowrap;
          `}
        >
          {next2am !== countDownTo ? (
            <>
              {camp.name.toUpperCase()}
              <br />
              {countDownTo === camp.buildup ? " BUILDUP" : " START"}
            </>
          ) : (
            <>TILL CURFEW</>
          )}
        </span>
      </big>
    </div>
  );
}

export default function PageStats() {
  const currentCamp = useCurrentCamp();

  const { data: allSales } = useMongoFetch(() => Sales.find(), []);
  const { data: campSales } = useMongoFetch(
    () =>
      currentCamp
        ? Sales.find({
            timestamp: {
              $gte: currentCamp.buildup,
              $lte: currentCamp.teardown,
            },
          })
        : undefined,
    [currentCamp],
  );
  const sales = useMemo(
    () => (campSales?.length ? campSales : allSales),
    [campSales, allSales],
  );

  const products = useFind(() =>
    Products.find({ removedAt: { $exists: false } }),
  );
  const mostSold = useMemo(
    () =>
      Object.entries(
        sales.reduce<Record<ProductID, number>>((m, sale) => {
          sale.products.forEach((product) => {
            m[product._id] = (m[product._id] || 0) + 1;
          });
          return m;
        }, {}),
      ).sort(([, a], [, b]) => b - a),
    [sales],
  );

  const productsSold = campSales.map(({ products }) => products).flat();

  console.log(`${campSales.reduce(
    (revenue, { amount }) => revenue + amount,
    0,
  )} ʜᴀx revenue
${productsSold.length} items sold
${campSales.length} discrete transactions
${Math.round(
  productsSold
    .filter(({ tags }) => tags?.includes("beer"))
    .reduce(
      (totalLiters, { unitSize, sizeUnit }) =>
        unitSize && sizeUnit === "cl"
          ? totalLiters + Number(unitSize) / 100
          : totalLiters,
      0,
    ),
)} liters of beer
${Math.round(
  productsSold
    .filter(({ brandName }) => brandName === "Club Mate")
    .reduce(
      (totalLiters, { unitSize, sizeUnit }) =>
        unitSize && sizeUnit === "cl"
          ? totalLiters + Number(unitSize) / 100
          : totalLiters,
      0,
    ),
)} liters of mate
${
  productsSold.filter(({ tags }) => tags?.includes("cocktail")).length
} cocktails
${
  productsSold.filter(({ name }) => name.includes("Tsunami")).length
} tsunamis`);

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
                ${campSales?.length ? `width: 50%;` : `flex: 1;`}
              }
            }
          `}
        >
          <CampByCamp />
          {campSales?.length ? <DayByDay /> : null}
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
        {currentCamp && campSales?.length ? (
          <big>Most sold @ {currentCamp.name}:</big>
        ) : (
          <big>Most sold of all time:</big>
        )}
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
                    {product.name}{" "}
                    <small>
                      ({product.unitSize} {product.sizeUnit})
                    </small>
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
