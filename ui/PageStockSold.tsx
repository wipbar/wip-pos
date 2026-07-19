import { css } from "@emotion/css";
import { useFind } from "meteor/react-meteor-data";
import { useCallback, useEffect } from "react";
import Stocks from "../api/stocks";
import { packageTypes } from "../data";
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
            .sort(([, , countA], [, , countB]) => countB - countA)
            .map(
              ([
                stockId,
                approxCount,
                servingsSold,
                expectedServingsSoldByEndOfCamp,
                servingsPerDay,
              ]) => {
                const stock = stocks.find(({ _id }) => _id == stockId);
                if (!stock) return null;

                const packageName =
                  packageTypes
                    .find(({ code }) => stock.packageType === code)
                    ?.name.toLowerCase() + "s";

                const salesSpanEfterslaeb =
                  expectedServingsSoldByEndOfCamp !== null
                    ? approxCount !== null
                      ? approxCount -
                        (expectedServingsSoldByEndOfCamp - servingsSold)
                      : null
                    : null;

                const campSpanForTheRestOfTheCamp =
                  camp &&
                  (servingsSold /
                    ((new Date().valueOf() - camp.start.valueOf()) /
                      (1000 * 60 * 60 * 24))) *
                    ((camp.end.valueOf() - camp.start.valueOf()) /
                      (1000 * 60 * 60 * 24)) -
                    servingsSold;

                const campSpanEfterslaeb =
                  campSpanForTheRestOfTheCamp &&
                  expectedServingsSoldByEndOfCamp !== null &&
                  camp
                    ? approxCount !== null
                      ? approxCount - campSpanForTheRestOfTheCamp
                      : null
                    : null;

                const campSpanEfterslaebRatio =
                  camp && campSpanForTheRestOfTheCamp != null
                    ? approxCount !== null
                      ? approxCount / campSpanForTheRestOfTheCamp
                      : null
                    : null;

                const isCriticallyLow =
                  campSpanEfterslaebRatio !== null &&
                  campSpanEfterslaebRatio < 0.5;

                const salesSpanEfterslaebRatio =
                  expectedServingsSoldByEndOfCamp !== null &&
                  salesSpanEfterslaeb !== null
                    ? approxCount !== null
                      ? approxCount /
                        (expectedServingsSoldByEndOfCamp - servingsSold)
                      : null
                    : null;

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
                        {servingsSold.toLocaleString("en", {
                          maximumSignificantDigits: 2,
                        })}
                      </b>
                      <small>x</small>
                    </div>
                    <div
                      className={css`
                        flex: 1;
                      `}
                    >
                      <div
                        className={css`
                          display: flex;
                          align-items: center;
                        `}
                      >
                        {isCriticallyLow ? (
                          <b
                            className={css`
                              color: red;
                            `}
                          >
                            🚨
                          </b>
                        ) : null}
                        <StockItem key={stock._id} stock={stock} />
                      </div>
                      {expectedServingsSoldByEndOfCamp !== null && camp && (
                        <>
                          <small
                            className={css`
                              display: block;
                              font-size: 0.5em;
                              line-height: 1em;
                            `}
                          >
                            That&apos;s{" "}
                            {(servingsPerDay || 0).toLocaleString("en-DK", {
                              maximumSignificantDigits: 2,
                            })}{" "}
                            {packageName} per day on average, first sale to
                            last, at that rate we would use{" "}
                            {expectedServingsSoldByEndOfCamp.toLocaleString(
                              "en",
                              { maximumSignificantDigits: 2 },
                            )}{" "}
                            over the{" "}
                            {Math.round(
                              (camp.end.valueOf() - camp.start.valueOf()) /
                                (1000 * 60 * 60 * 24),
                            )}{" "}
                            day camp.
                            {salesSpanEfterslaeb !== null && (
                              <>
                                <br />
                                We have{" "}
                                {approxCount?.toLocaleString("en", {
                                  maximumSignificantDigits: 2,
                                })}{" "}
                                {packageName} in stock and we need{" "}
                                {(
                                  expectedServingsSoldByEndOfCamp - servingsSold
                                ).toLocaleString("en-DK", {
                                  maximumSignificantDigits: 2,
                                })}{" "}
                                for the rest of the camp, that means{" "}
                                <span
                                  className={css`
                                    color: ${salesSpanEfterslaeb > 0
                                      ? "inherit"
                                      : "red"};
                                  `}
                                >
                                  we have{" "}
                                  {Math.abs(salesSpanEfterslaeb).toLocaleString(
                                    "en",
                                    { maximumSignificantDigits: 2 },
                                  )}{" "}
                                  {packageName}
                                  {salesSpanEfterslaeb > 0 ? (
                                    <b> too many.</b>
                                  ) : (
                                    <b> too few.</b>
                                  )}{" "}
                                  {salesSpanEfterslaebRatio != null
                                    ? `${
                                        (
                                          salesSpanEfterslaebRatio * 100
                                        ).toLocaleString("en", {
                                          maximumSignificantDigits: 2,
                                        }) + "% of what we need"
                                      }`
                                    : null}
                                </span>
                              </>
                            )}
                          </small>{" "}
                          <small
                            className={css`
                              display: block;
                              font-size: 0.5em;
                              line-height: 1em;
                            `}
                          >
                            That&apos;s{" "}
                            {(
                              servingsSold /
                              ((Math.min(
                                new Date().valueOf(),
                                camp.end.valueOf(),
                              ) -
                                camp.start.valueOf()) /
                                (1000 * 60 * 60 * 24))
                            ).toLocaleString("en-DK", {
                              maximumSignificantDigits: 2,
                            })}{" "}
                            {packageName} per day on average, camp start to{" "}
                            {new Date().valueOf() < camp.end.valueOf()
                              ? "now"
                              : "end"}
                            , at that rate we would use{" "}
                            {(
                              (servingsSold /
                                ((new Date().valueOf() - camp.start.valueOf()) /
                                  (1000 * 60 * 60 * 24))) *
                              ((camp.end.valueOf() - camp.start.valueOf()) /
                                (1000 * 60 * 60 * 24))
                            ).toLocaleString("en", {
                              maximumSignificantDigits: 2,
                            })}{" "}
                            by the end of the{" "}
                            {Math.round(
                              (camp.end.valueOf() - camp.start.valueOf()) /
                                (1000 * 60 * 60 * 24),
                            )}{" "}
                            day camp.
                            {campSpanEfterslaeb !== null && (
                              <>
                                <br />
                                We have{" "}
                                {approxCount?.toLocaleString("en", {
                                  maximumSignificantDigits: 2,
                                })}{" "}
                                {packageName} in stock and we need{" "}
                                {campSpanForTheRestOfTheCamp?.toLocaleString(
                                  "en-DK",
                                  {
                                    maximumSignificantDigits: 2,
                                  },
                                )}{" "}
                                for the rest of the camp, that means{" "}
                                <span
                                  className={css`
                                    color: ${campSpanEfterslaeb > 0
                                      ? "inherit"
                                      : "red"};
                                  `}
                                >
                                  we have{" "}
                                  {Math.abs(campSpanEfterslaeb).toLocaleString(
                                    "en",
                                    { maximumSignificantDigits: 2 },
                                  )}{" "}
                                  {packageName}
                                  {campSpanEfterslaeb > 0 ? (
                                    <b> too many.</b>
                                  ) : (
                                    <b> too few.</b>
                                  )}{" "}
                                  {campSpanEfterslaebRatio != null
                                    ? `${
                                        (
                                          campSpanEfterslaebRatio * 100
                                        ).toLocaleString("en", {
                                          maximumSignificantDigits: 2,
                                        }) + "% of what we need"
                                      }`
                                    : null}
                                </span>
                              </>
                            )}
                          </small>
                        </>
                      )}
                    </div>
                  </li>
                );
              },
            )
        ) : (
          <i>Nothing has been used yet :(</i>
        )}
      </ul>
    </div>
  );
}
