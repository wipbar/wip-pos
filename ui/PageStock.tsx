import { css } from "@emotion/css";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash";
import { isBefore } from "date-fns";
import { useFind } from "meteor/react-meteor-data";
import React, { Fragment, useState } from "react";
import { isUserAdmin } from "../api/accounts";
import Products from "../api/products";
import Stocks, { IStock, StockID } from "../api/stocks";
import FontAwesomeIcon from "../components/FontAwesomeIcon";
import { packageTypes } from "../data";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentUser from "../hooks/useCurrentUser";
import useMethod from "../hooks/useMethod";
import { getCorrectTextColor } from "../util";
import { Modal } from "./PageProducts";
import PageStockItem from "./PageStockItem";

const NEW = Symbol("New");
export default function PageStock() {
  const user = useCurrentUser();
  const camp = useCurrentCamp();
  const [removeStock] = useMethod("Stock.removeStock");
  const [isEditing, setIsEditing] = useState<null | StockID | typeof NEW>(null);
  const [sortBy, setSortBy] = useState<keyof IStock | undefined>(undefined);

  const stocks = useFind(
    () =>
      Stocks.find(
        { removedAt: { $exists: false } },
        {
          sort: sortBy
            ? { [sortBy.split(".")[0]!]: sortBy.split(".")[1]! }
            : { updatedAt: -1, createdAt: -1 },
        },
      ),
    [sortBy],
  );

  const products = useFind(() =>
    Products.find({ removedAt: { $exists: false } }),
  );

  return (
    <div>
      <button onClick={() => setIsEditing(NEW)}>Create Stock</button>
      {isEditing === NEW ? (
        <Modal onDismiss={() => setIsEditing(null)}>
          <PageStockItem onCancel={() => setIsEditing(null)} />
        </Modal>
      ) : isEditing ? (
        <Modal onDismiss={() => setIsEditing(null)}>
          <PageStockItem
            onCancel={() => setIsEditing(null)}
            stock={stocks.find(({ _id }) => _id === isEditing)}
          />
        </Modal>
      ) : null}
      <select
        onChange={(event) =>
          setSortBy(
            (event.target.value as keyof IStock | undefined) || undefined,
          )
        }
        value={sortBy}
      >
        <option value={""}>Sort By...</option>
        {stocks[0]
          ? Object.keys(stocks[0]).map((key) => (
              <Fragment key={key}>
                <option value={key + ".-1"}>-{key}</option>
                <option value={key + ".1"}>+{key}</option>
              </Fragment>
            ))
          : null}
      </select>
      <hr />
      <div
        className={css`
          overflow-x: auto;
          display: flex;
          justify-content: center;
        `}
      >
        <table
          className={css`
            width: 99%;
            max-width: 1000px;

            > tbody > tr:nth-child(even) > td {
              color: ${camp && getCorrectTextColor(camp.color)};
              background: ${camp && camp.color};
            }
            > tbody > tr:nth-child(odd) > td {
              background: ${camp && getCorrectTextColor(camp.color)};
              color: ${camp && camp.color};
            }
          `}
        >
          <thead>
            <tr>
              <th />
              <th align="right">Count</th>
              <th align="left">UPC</th>
              <th align="left">Name</th>
              <th>Size</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr key={stock._id}>
                <td style={{ whiteSpace: "nowrap" }} align="right">
                  <button onClick={() => setIsEditing(stock._id)}>
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </button>
                  {stock && isUserAdmin(user) && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete " + stock.name,
                          )
                        ) {
                          removeStock({ stockId: stock._id });
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </td>
                <td align="right">
                  {stock.levels?.some(
                    (level) =>
                      isBefore(
                        level.timestamp,
                        new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
                      ) && level.count,
                  )
                    ? `🚨 (${stock.approxCount?.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                      })})`
                    : stock.approxCount?.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      }) ?? "❔"}
                </td>
                <td>{stock.barCode ? "✅" : "❌"}</td>
                <td>
                  {stock.name}{" "}
                  <small>
                    <small>
                      Part of{" "}
                      {
                        products.filter(
                          (product) =>
                            product?.components?.some(
                              (component) => component.stockId === stock._id,
                            ),
                        ).length
                      }{" "}
                      products
                    </small>
                  </small>
                </td>
                <td>
                  {stock.unitSize}
                  {stock.sizeUnit}
                </td>
                <td>
                  {
                    packageTypes.find(({ code }) => code === stock.packageType)
                      ?.name
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
