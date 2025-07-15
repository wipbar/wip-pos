import { css } from "@emotion/css";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash";
import { isBefore, subDays } from "date-fns";
import type { Mongo } from "meteor/mongo";
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
import PageProductsItem from "./PageProductsItem";
import PageStockItem from "./PageStockItem";

const NEW = Symbol("New");
export default function PageStock() {
  const user = useCurrentUser();
  const camp = useCurrentCamp();
  const [removeStock] = useMethod("Stock.removeStock");
  const [isEditing, setIsEditing] = useState<null | StockID | typeof NEW>(null);
  const [sortBy, setSortBy] = useState<keyof IStock | undefined>(undefined);
  const [onlyShowStockedItems, setOnlyShowStockedItems] = useState(false);
  const [onlyShowStockWithoutProducts, setOnlyShowStockWithoutProducts] =
    useState(false);

  const stocks: IStock[] = useFind(
    () =>
      Stocks.find(
        { removedAt: { $exists: false } },
        {
          sort: sortBy
            ? ({
                [sortBy.split(".")[0]!]: sortBy.split(".")[1]!,
              } as Mongo.SortSpecifier)
            : { updatedAt: -1, createdAt: -1 },
        },
      ),
    [sortBy],
  );
  const [isCreatingProductFromStock, setIsCreatingProductFromStock] =
    useState<null | StockID>(null);
  const stockToCreateProductFrom = stocks.find(
    ({ _id }) => _id === isCreatingProductFromStock,
  );

  const products = useFind(() =>
    Products.find({ removedAt: { $exists: false } }),
  );

  return (
    <div>
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
      ) : isCreatingProductFromStock && stockToCreateProductFrom ? (
        <Modal onDismiss={() => setIsCreatingProductFromStock(null)}>
          <PageProductsItem
            onCancel={() => setIsCreatingProductFromStock(null)}
            defaultValues={{
              name: stockToCreateProductFrom.name,
              components: [
                {
                  stockId: stockToCreateProductFrom._id,
                  unitSize: stockToCreateProductFrom.unitSize,
                  sizeUnit: stockToCreateProductFrom.sizeUnit,
                },
              ],
              tags:
                stockToCreateProductFrom.packageType === "CNG"
                  ? ["can"]
                  : stockToCreateProductFrom.packageType === "BO"
                  ? ["bottle"]
                  : undefined,
            }}
          />
        </Modal>
      ) : null}
      <div
        className={css`
          display: grid;
          grid-gap: 0.5vw 1vw;
          padding: 1vw;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          text-align: center;
          > label {
            display: flex;
            align-items: center;
            background-color: ${(camp &&
              getCorrectTextColor(camp?.color, true)) ||
            "initial"};
            border: 2px solid black;
            color: ${(camp && getCorrectTextColor(camp?.color)) || "initial"};
            padding: 0 6px;
            border-radius: 3px;
            font-size: 1em;
            > input {
              margin-right: 4px;
            }
          }
        `}
      >
        <button onClick={() => setIsEditing(NEW)}>Create Stock</button>
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
        <label>
          <input
            type="checkbox"
            onChange={(e) => setOnlyShowStockedItems(e.target.checked)}
            checked={onlyShowStockedItems}
          />
          show only stock that is in stock
        </label>
        <label>
          <input
            type="checkbox"
            onChange={(e) => setOnlyShowStockWithoutProducts(e.target.checked)}
            checked={onlyShowStockWithoutProducts}
          />
          show only stock without products
        </label>
      </div>
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
            {stocks
              .filter((stock) => {
                const mostRecentLevel = stock.levels?.sort(
                  (a, b) => Number(b.timestamp) - Number(a.timestamp),
                )[0];

                if (
                  onlyShowStockedItems &&
                  !(
                    mostRecentLevel &&
                    mostRecentLevel.count &&
                    isBefore(
                      subDays(new Date(), 14),
                      new Date(mostRecentLevel.timestamp),
                    )
                  )
                )
                  return false;
                if (
                  onlyShowStockWithoutProducts &&
                  products.some(
                    (product) =>
                      product?.components?.some(
                        (component) => component.stockId === stock._id,
                      ),
                  )
                )
                  return false;
                return true;
              })
              .map((stock) => {
                const mostRecentLevel = stock.levels?.sort(
                  (a, b) => Number(b.timestamp) - Number(a.timestamp),
                )[0];

                return (
                  <tr key={stock._id}>
                    <td style={{ whiteSpace: "nowrap" }} align="right">
                      <button onClick={() => setIsEditing(stock._id)}>
                        <FontAwesomeIcon icon={faPencilAlt} />
                      </button>
                      {stock && isUserAdmin(user) && (
                        <button
                          onClick={async () => {
                            if (
                              window.confirm(
                                "Are you sure you want to delete " + stock.name,
                              )
                            ) {
                              await removeStock({ stockId: stock._id });
                            }
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </td>
                    <td align="right">
                      {!(
                        mostRecentLevel &&
                        isBefore(
                          subDays(new Date(), 14),
                          new Date(mostRecentLevel.timestamp),
                        )
                      )
                        ? `⌛️ (${
                            stock.approxCount?.toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            }) ?? "❔"
                          })`
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
                          {products.filter(
                            (product) =>
                              product?.components?.some(
                                (component) => component.stockId === stock._id,
                              ),
                          ).length || "0️⃣"}{" "}
                          products -{" "}
                          <button
                            onClick={(e) => {
                              e.preventDefault();

                              setIsCreatingProductFromStock(stock._id);
                            }}
                          >
                            Create Product From Stock
                          </button>
                        </small>
                      </small>
                    </td>
                    <td>
                      {stock.unitSize}
                      {stock.sizeUnit}
                    </td>
                    <td>
                      {
                        packageTypes.find(
                          ({ code }) => code === stock.packageType,
                        )?.name
                      }
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
