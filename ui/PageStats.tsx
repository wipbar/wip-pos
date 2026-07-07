import { css } from "@emotion/css";
import { useFind } from "meteor/react-meteor-data";
import { useCallback, useEffect } from "react";
import Products from "../api/products";
import Stocks, { IStock } from "../api/stocks";
import Styles from "../api/styles";
import CampByCamp from "../components/CampByCamp";
import DayByDay from "../components/DayByDay";
import RemainingStock from "../components/RemainingStock";
import SalesSankey from "../components/SalesSankey";
import useCurrentCamp from "../hooks/useCurrentCamp";
import { useInterval } from "../hooks/useCurrentDate";
import useMethod from "../hooks/useMethod";
import { emptyArray } from "../util";
import { ProductsItem } from "./PageMenu";

export default function PageStats() {
  const currentCamp = useCurrentCamp();

  const products = useFind(
    () => Products.find({ removedAt: { $exists: false } }),
    [],
  );
  const stocks = useFind(
    () => Stocks.find({ removedAt: { $exists: false } }),
    [],
  );

  const [getMostSoldData, result] = useMethod("Sales.stats.MostSold");
  const mostSoldData = result?.data || emptyArray;
  const updateMostSoldData = useCallback(
    () => getMostSoldData({ campSlug: currentCamp?.slug }),
    [currentCamp?.slug, getMostSoldData],
  );
  useEffect(() => void updateMostSoldData(), [updateMostSoldData]);
  useInterval(() => void updateMostSoldData(), 30000);

  const [getGoodbyeWorld] = useMethod("Sales.stats.GoodbyeWorld");
  useEffect(() => {
    if (currentCamp) {
      // void getGoodbyeWorld({ campSlug: currentCamp.slug }).then(console.log);
    }
  }, [currentCamp, getGoodbyeWorld]);

  const style = useFind(() => Styles.find({ page: "stats" }), [])?.[0]?.style;

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
          min-width: 300px;
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
          {currentCamp ? <DayByDay currentCamp={currentCamp} /> : null}
        </div>
        {Math.random() !== 69 ? null : <RemainingStock />}
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
            display: flex;
            flex-direction: column;
            padding: 0;
            gap: 1px;
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
                      width: 2.5em;
                      text-align: right;
                      margin-right: 0.25em;
                      flex-shrink: 0;
                    `}
                  >
                    <b>{count}</b>
                    <small>x</small>
                  </div>
                  <ProductsItem
                    key={product._id}
                    product={product}
                    soldOutRatio={stockPercentage}
                    componentStocks={product.components
                      ?.map((component) =>
                        stocks.find((stock) => stock._id === component.stockId),
                      )
                      .filter((s): s is IStock => Boolean(s))}
                    showBrandName
                    hidePrice
                  />
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
