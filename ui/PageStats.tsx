import { css } from "@emotion/css";
import { useFind, useTracker } from "meteor/react-meteor-data";
import { Session } from "meteor/session";
import React, { useCallback, useEffect } from "react";
import Products from "../api/products";
import Styles, { type IStyle } from "../api/styles";
import CampByCamp from "../components/CampByCamp";
import DayByDay from "../components/DayByDay";
import RemainingStock from "../components/RemainingStock";
import SalesSankey from "../components/SalesSankey";
import useCurrentCamp from "../hooks/useCurrentCamp";
import { useInterval } from "../hooks/useCurrentDate";
import useMethod from "../hooks/useMethod";
import { emptyArray, emptyObject } from "../util";

export default function PageStats() {
  const currentCamp = useCurrentCamp();
  // If no current camp is set, we use the first camp in the list

  const GALAXY_APP_VERSION_ID = useTracker(
    () => Session.get("GALAXY_APP_VERSION_ID") as string | undefined,
  );

  const products = useFind(() =>
    Products.find({ removedAt: { $exists: false } }),
  );

  const [getMostSoldData, result] = useMethod("Sales.stats.MostSold");
  const mostSoldData = result?.data || emptyArray;

  const updateDayByDayData = useCallback(async () => {
    await getMostSoldData({ campSlug: currentCamp?.slug });
  }, [currentCamp?.slug, getMostSoldData]);

  useEffect(() => {
    updateDayByDayData();
  }, [updateDayByDayData]);
  useInterval(() => updateDayByDayData(), 30000);

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
        {currentCamp ? <SalesSankey currentCamp={currentCamp} /> : null}
        <div
          className={css`
            display: flex;
            flex-wrap: wrap;
            > * {
              width: 100%;
            }

            @media (min-width: 900px) {
              > * {
                ${currentCamp ? `width: 50%;` : `flex: 1;`}
              }
            }
          `}
        >
          <CampByCamp />
          {currentCamp ? <DayByDay /> : null}
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
        {currentCamp ? (
          <big>Most sold @ {currentCamp.name}:</big>
        ) : (
          <big>Most sold of all time:</big>
        )}
        <ul
          className={css`
            padding: 0;
          `}
        >
          {mostSoldData.length ? (
            mostSoldData.map(([productId, count, stockPercentage]) => {
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
                    {stockPercentage ? (
                      <small>
                        (
                        {(stockPercentage * 100).toLocaleString("en-DK", {
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
