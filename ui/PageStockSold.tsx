import { css } from "@emotion/css";
import { useFind } from "meteor/react-meteor-data";
import { useCallback, useEffect } from "react";
import Stocks from "../api/stocks";
import useCurrentCamp from "../hooks/useCurrentCamp";
import { useInterval } from "../hooks/useCurrentDate";
import useMethod from "../hooks/useMethod";
import { emptyArray } from "../util";
import { StockItem } from "./PageMenu";

export default function PageStockSold() {
  const camp = useCurrentCamp();

  const stocks = useFind(
    () => Stocks.find({ removedAt: { $exists: false } }, {}),
    [],
  );

  const [getMostSoldData, result] = useMethod("Sales.stats.MostSoldStock");
  const mostSoldData = result?.data || emptyArray;
  const updateMostSoldData = useCallback(
    () => getMostSoldData({ campSlug: camp?.slug }),
    [camp?.slug, getMostSoldData],
  );
  useEffect(() => void updateMostSoldData(), [updateMostSoldData]);
  useInterval(() => void updateMostSoldData(), 30000);

  return (
    <div
      className={css`
        padding: 32px;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      `}
    >
      {camp ? (
        <big>Most used stock @ {camp.name}:</big>
      ) : (
        <big>Most used stock of all time:</big>
      )}
      <ul
        className={css`
          padding: 0;
        `}
      >
        {mostSoldData.length ? (
          Array.from(mostSoldData)
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([stockId, count]) => {
              const stock = stocks.find(({ _id }) => _id == stockId);
              if (!stock) return null;
              return (
                <li
                  key={stockId}
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
                    <b>
                      {count.toLocaleString("en", {
                        maximumSignificantDigits: 2,
                      })}
                    </b>
                    <small>x</small>
                  </div>
                  <StockItem key={stock._id} stock={stock} />
                </li>
              );
            })
        ) : (
          <i>Nothing has been sold yet :(</i>
        )}
      </ul>
    </div>
  );
}
