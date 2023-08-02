import { css } from "@emotion/css";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash";
import { useFind } from "meteor/react-meteor-data";
import React, { useState } from "react";
import { isUserAdmin } from "../api/accounts";
import Products from "../api/products";
import Stocks, { StockID } from "../api/stocks";
import FontAwesomeIcon from "../components/FontAwesomeIcon";
import { packageTypes } from "../data";
import useCurrentUser from "../hooks/useCurrentUser";
import useMethod from "../hooks/useMethod";
import { Modal } from "./PageProducts";
import PageStockItem from "./PageStockItem";
import useCurrentCamp from "../hooks/useCurrentCamp";
import { getCorrectTextColor } from "../util";

const NEW = Symbol("New");
export default function PageStock() {
  const user = useCurrentUser();
  const camp = useCurrentCamp();
  const [removeStock] = useMethod("Stock.removeStock");
  const [isEditing, setIsEditing] = useState<null | StockID | typeof NEW>(null);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);

  const stocks = useFind(
    () =>
      Stocks.find(
        { removedAt: { $exists: false } },
        { sort: sortBy ? { [sortBy]: 1 } : { updatedAt: -1, createdAt: -1 } },
      ),
    [sortBy],
  );

  const products = useFind(
    () => Products.find({ removedAt: { $exists: false } }),
    [],
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
        onChange={(event) => setSortBy(event.target.value || undefined)}
        value={sortBy}
      >
        <option value={""}>Sort By...</option>
        {stocks[0]
          ? Object.keys(stocks[0]).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))
          : null}
      </select>
      <hr />
      <div
        className={css`
          overflow-x: auto;
        `}
      >
        <table
          className={css`
            width: 100%;
            > tbody > tr > td {
              border-top: 1px solid ${camp && getCorrectTextColor(camp.color)};
            }
          `}
        >
          <thead>
            <tr>
              <th align="right">Count</th>
              <th align="left">UPC</th>
              <th align="left">Name</th>
              <th>Size</th>
              <th>Type</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr key={stock._id}>
                <td align="right">
                  {stock.approxCount?.toLocaleString("en-US", {
                    maximumSignificantDigits: 3,
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
