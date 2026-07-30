import { css } from "@emotion/css";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash";
import { isBefore, subDays } from "date-fns";
import { useFind } from "meteor/react-meteor-data";
import { Fragment, lazy, useEffect, useState } from "react";
import { useParams } from "react-router";
import { isUserAdmin } from "../api/accounts";
import Products from "../api/products";
import Stocks, { type IStock, type StockID } from "../api/stocks";
import FontAwesomeIcon from "../components/FontAwesomeIcon";
import { packageTypes } from "../data";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentUser from "../hooks/useCurrentUser";
import useMethod from "../hooks/useMethod";
import { getCorrectTextColor } from "../util";
import { Modal } from "./PageProducts";

const PageStockItem = lazy(() => import("./PageStockItem"));
const PageProductsItem = lazy(() => import("./PageProductsItem"));

const NEW = Symbol("New");
export default function PageStock() {
  const { locationSlug } = useParams();
  const user = useCurrentUser();
  const camp = useCurrentCamp();
  const [removeStock] = useMethod("Stock.removeStock");
  const [isEditing, setIsEditing] = useState<null | StockID | typeof NEW>(null);
  const [sortBy, setSortBy] = useState<keyof IStock | undefined>(undefined);
  const [onlyShowStockedItems, setOnlyShowStockedItems] = useState<
    null | boolean
  >(null);
  const [onlyShowStockWithProducts, setOnlyShowStockWithProducts] = useState<
    null | boolean
  >(null);
  const [onlyShowStockUsedThisCamp, setOnlyShowStockUsedThisCamp] = useState<
    null | boolean
  >(null);
  const [showStockTakenDuringCamp, setShowStockTakenDuringCamp] = useState<
    null | boolean
  >(null);

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
  const [getStockIdsUsedDuringCamp, { data: stockIdsUsedDuringCamp }] =
    useMethod("Stock.getStockIdsUsedDuringCamp");
  useEffect(() => {
    if (onlyShowStockUsedThisCamp && camp) {
      void getStockIdsUsedDuringCamp({ campSlug: camp.slug });
    }
  }, [onlyShowStockUsedThisCamp, camp, getStockIdsUsedDuringCamp]);
  const [isCreatingProductFromStock, setIsCreatingProductFromStock] =
    useState<null | StockID>(null);
  const stockToCreateProductFrom = stocks.find(
    ({ _id }) => _id === isCreatingProductFromStock,
  );

  const products = useFind(
    () => Products.find({ removedAt: { $exists: false } }),
    [],
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
              name: null,
              components: [
                {
                  stockId: stockToCreateProductFrom._id,
                  unitSize: stockToCreateProductFrom.unitSize,
                  sizeUnit: stockToCreateProductFrom.sizeUnit,
                },
              ],
              tags: [
                ...(stockToCreateProductFrom.packageType === "CNG"
                  ? ["can"]
                  : stockToCreateProductFrom.packageType === "BO"
                  ? ["bottle"]
                  : stockToCreateProductFrom.packageType === "BA"
                  ? ["tap"]
                  : []),
              ],
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
          <PlusMinusNeitherCheckbox
            value={onlyShowStockedItems}
            onChange={setOnlyShowStockedItems}
          />{" "}
          in stock
        </label>
        <label>
          <PlusMinusNeitherCheckbox
            value={onlyShowStockWithProducts}
            onChange={setOnlyShowStockWithProducts}
          />
          has products
        </label>
        <label>
          <PlusMinusNeitherCheckbox
            value={onlyShowStockUsedThisCamp}
            onChange={setOnlyShowStockUsedThisCamp}
          />
          used this current camp
        </label>
        <label>
          <PlusMinusNeitherCheckbox
            value={showStockTakenDuringCamp}
            onChange={setShowStockTakenDuringCamp}
          />
          taken during this current camp
        </label>
        <a
          href={`/${locationSlug}/stock/sold`}
          className={css`
            margin-left: 1vw;
            color: ${camp && getCorrectTextColor(camp.color)};
          `}
        >
          View Used Stock
        </a>
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
              <th align="center">UPC</th>
              <th align="left">Name</th>
              <th>Size</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {stocks
              .filter((stock) => {
                if (onlyShowStockedItems !== null) {
                  const isStocked =
                    typeof stock.approxCount === "number" &&
                    stock.approxCount > 0;
                  return onlyShowStockedItems ? isStocked : !isStocked;
                }
                if (onlyShowStockWithProducts !== null) {
                  const stockHasProducts = products.some(
                    (product) =>
                      product?.components?.some(
                        (component) => component.stockId === stock._id,
                      ),
                  );
                  if (onlyShowStockWithProducts && !stockHasProducts) {
                    return false;
                  }
                  if (!onlyShowStockWithProducts && stockHasProducts) {
                    return false;
                  }
                }

                if (onlyShowStockUsedThisCamp !== null) {
                  const usedDuringCamp = stockIdsUsedDuringCamp?.includes(
                    stock._id,
                  );
                  if (onlyShowStockUsedThisCamp && !usedDuringCamp) {
                    return false;
                  }
                  if (!onlyShowStockUsedThisCamp && usedDuringCamp) {
                    return false;
                  }
                }

                if (showStockTakenDuringCamp !== null && camp) {
                  const takenDuringCamp =
                    stock.levels?.some(
                      (level) =>
                        new Date(level.timestamp) >= camp.buildup &&
                        new Date(level.timestamp) <= camp.teardown,
                    ) ?? false;
                  if (showStockTakenDuringCamp && !takenDuringCamp) {
                    return false;
                  }
                  if (!showStockTakenDuringCamp && takenDuringCamp) {
                    return false;
                  }
                }

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
                        ) &&
                        // Don't show recency doubt if it the stock was zeroed out
                        stock.approxCount === 0
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
                    <td align="center">{stock.barCode ? "✅" : "❌"}</td>
                    <td>
                      {stock.brandName} {stock.name}{" "}
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

function PlusMinusNeitherCheckbox({
  value,
  onChange,
}: {
  value: null | boolean;
  onChange: (value: null | boolean) => void;
}) {
  return (
    <button
      onClick={() => {
        if (value === null) {
          onChange(true);
        } else if (value === true) {
          onChange(false);
        } else {
          onChange(null);
        }
      }}
    >
      {value === null ? "⏹" : value === true ? "✅" : "❌"}
    </button>
  );
}
