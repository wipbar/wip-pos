import { css } from "@emotion/css";
import { useFind, useTracker } from "meteor/react-meteor-data";
import { Session } from "meteor/session";
import React, { useEffect, useMemo } from "react";
import Camps from "../api/camps";
import Products, { ProductID } from "../api/products";
import Sales from "../api/sales";
import Stocks from "../api/stocks";
import Styles, { type IStyle } from "../api/styles";
import CampByCamp from "../components/CampByCamp";
import DayByDay from "../components/DayByDay";
import RemainingStock, {
  getRemainingServings,
  getRemainingServingsEver,
} from "../components/RemainingStock";
import SalesSankey from "../components/SalesSankey";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useMethod from "../hooks/useMethod";
import useSubscription from "../hooks/useSubscription";
import { emptyObject } from "../util";

export default function PageStats() {
  const campsLoading = useSubscription("camps");

  const pastCamps = useFind(() =>
    Camps.find({ start: { $lt: new Date() } }, { sort: { end: -1 } }),
  );
  const currentCamp = useCurrentCamp();
  const lastCamp = useMemo(() => pastCamps[0], [pastCamps]);
  // If no current camp is set, we use the first camp in the list

  useSubscription(
    !campsLoading && (currentCamp || lastCamp) && "sales",
    !campsLoading &&
      currentCamp && {
        from: currentCamp.buildup,
        to: currentCamp.teardown,
      },
    [campsLoading, currentCamp],
  );

  const campSales = useFind(
    () =>
      currentCamp
        ? Sales.find({
            timestamp: {
              $gte: currentCamp.buildup,
              $lte: currentCamp.teardown,
            },
          })
        : Sales.find({}),
    [currentCamp],
  );

  const stocks = useFind(() => Stocks.find());

  const GALAXY_APP_VERSION_ID = useTracker(
    () => Session.get("GALAXY_APP_VERSION_ID") as string | undefined,
  );

  const sales = useMemo(
    () => (currentCamp || lastCamp ? campSales : []),
    [currentCamp, lastCamp, campSales],
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

  const [getGoodbyeWorld] = useMethod("Sales.stats.GoodbyeWorld");
  useEffect(() => {
    if (currentCamp) {
      getGoodbyeWorld({ campSlug: currentCamp.slug }).then(console.log);
    }
  }, [currentCamp, getGoodbyeWorld]);

  const style =
    useFind(() => Styles.find({ page: "menu" }))?.[0]?.style ||
    (emptyObject as IStyle["style"]);

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
      style={style}
    >
      <div
        className={css`
          flex: 2;
          min-height: 100%;
          min-width: 400px;
        `}
      >
        {campSales?.length && currentCamp ? (
          <SalesSankey currentCamp={currentCamp} />
        ) : null}
        <div
          className={css`
            display: flex;
            flex-wrap: wrap;
            > * {
              width: 100%;
            }

            @media (min-width: 900px) {
              > * {
                ${campSales?.length && currentCamp ? `width: 50%;` : `flex: 1;`}
              }
            }
          `}
        >
          <CampByCamp />
          {campSales?.length && currentCamp ? <DayByDay /> : null}
        </div>
        {!GALAXY_APP_VERSION_ID ||
        Number(GALAXY_APP_VERSION_ID) !== 69 ? null : (
          <RemainingStock />
        )}
      </div>
      <div
        className={css`
          padding-left: 32px;
          flex: 1;
        `}
      >
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
                      width: 80px;
                      text-align: right;
                      margin-right: 12px;
                      flex-shrink: 0;
                    `}
                  >
                    <b>{count}</b>x
                  </div>
                  <div>
                    {product.brandName ? <>{product.brandName} - </> : null}
                    {product.name}{" "}
                    {product?.components?.[0] && currentCamp ? (
                      <small>
                        (
                        {(
                          Math.min(
                            1,
                            1 -
                              getRemainingServings(
                                sales,
                                stocks,
                                product,
                                new Date(),
                              )! /
                                getRemainingServingsEver(stocks, product),
                          ) * 100
                        ).toLocaleString("en-DK", {
                          maximumFractionDigits: 1,
                        })}
                        % sold)
                      </small>
                    ) : null}
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
