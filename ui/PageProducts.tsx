import { css } from "@emotion/css";
import {
  faBan,
  faFolderMinus,
  faFolderPlus,
  faPencilAlt,
  faPlus,
  faSort,
  faSortDown,
  faSortUp,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { isBefore, subDays } from "date-fns";
import { useFind } from "meteor/react-meteor-data";
import { opacify, transparentize } from "polished";
import React, { ReactNode, useCallback, useMemo, useState } from "react";
import { isUserAdmin, isUserResponsible } from "../api/accounts";
import type { ILocation } from "../api/locations";
import Products, { IProduct, ProductID, isAlcoholic } from "../api/products";
import Stocks from "../api/stocks";
import FontAwesomeIcon from "../components/FontAwesomeIcon";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useCurrentUser from "../hooks/useCurrentUser";
import useMethod from "../hooks/useMethod";
import useSession from "../hooks/useSession";
import {
  emptyArray,
  getCorrectTextColor,
  removeItem,
  stringToColour,
} from "../util";
import PageProductsItem from "./PageProductsItem";

export const Modal = ({
  children,
  onDismiss,
}: {
  children: ReactNode | ReactNode[];
  onDismiss?: () => void;
}) => {
  const currentCamp = useCurrentCamp();
  return (
    <div
      onClick={onDismiss}
      className={css`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${opacify(
          -0.25,
          getCorrectTextColor(currentCamp?.color ?? "#000000"),
        )};
        z-index: 665;
      `}
    >
      <div
        className={css`
          background-color: ${getCorrectTextColor(
            currentCamp?.color ?? "#000000",
          )};
          color: ${currentCamp?.color ?? "#000000"};
          box-shadow: 0 0 24px
            ${opacify(
              -0.25,
              getCorrectTextColor(currentCamp?.color ?? "#000000", true),
            )};
          padding: 8px 8px;
          border-radius: 8px;
          position: relative;
          z-index: 667;
        `}
        onClick={(e) => {
          //  e.preventDefault();
          e.stopPropagation();
        }}
      >
        {children}
      </div>
    </div>
  );
};
function CurfewButton({ location }: { location: ILocation }) {
  const [toggleCurfew] = useMethod("Locations.toggleCurfew");
  return (
    <button
      type="button"
      onClick={() => toggleCurfew({ locationId: location._id })}
    >
      {location.curfew ? "Exit curfew" : "Enter curfew"}
    </button>
  );
}
function OpenCloseButton({ location }: { location: ILocation }) {
  const [toggleClosed] = useMethod("Locations.toggleClosed");
  return (
    <button
      type="button"
      onClick={() => toggleClosed({ locationId: location._id })}
    >
      {location.closed ? `Open ${location.name}` : `Close ${location.name}`}
    </button>
  );
}

function SortHeader({
  sortBy,
  toggleSortBy,
  children,
  field,
}: {
  sortBy: string | undefined;
  toggleSortBy: (newSortBy: keyof IProduct) => void;
  children: any;
  field: keyof IProduct;
}) {
  return (
    <th
      onClick={() => toggleSortBy(field)}
      className={css`
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
      `}
    >
      {children}{" "}
      <FontAwesomeIcon
        icon={
          sortBy === field
            ? faSortUp
            : sortBy === `-${field}`
            ? faSortDown
            : faSort
        }
      />
    </th>
  );
}

const NEW = Symbol("New");
export default function PageProducts() {
  const user = useCurrentUser();
  const camp = useCurrentCamp();
  const [editProduct] = useMethod("Products.editProduct");
  const [removeProduct] = useMethod("Products.removeProduct");
  const { location, error } = useCurrentLocation(true);
  const [isEditing, setIsEditing] = useState<null | ProductID | typeof NEW>(
    null,
  );
  const [showOnlyMenuItems, setShowOnlyMenuItems] = useState(false);
  const [sortBy, setSortBy] = useState<
    keyof IProduct | `-${keyof IProduct}` | undefined
  >(undefined);

  const toggleSortBy = useCallback(
    (newSortBy: keyof IProduct) =>
      setSortBy((currentSortBy) =>
        currentSortBy === `-${newSortBy}`
          ? undefined
          : currentSortBy === newSortBy
          ? `-${newSortBy}`
          : newSortBy,
      ),
    [],
  );

  const products = useFind(
    () =>
      Products.find(
        { removedAt: { $exists: false } },
        {
          sort: sortBy?.startsWith("-")
            ? { [sortBy.slice(1)]: -1 }
            : sortBy
            ? { [sortBy]: 1 }
            : { updatedAt: -1, createdAt: -1 },
        },
      ),
    [sortBy],
  );
  const stocks = useFind(() => Stocks.find({ removedAt: { $exists: false } }));

  const currentUser = useCurrentUser();
  const currentCamp = useCurrentCamp();
  const [showOnlyBarCodeLessItems, setShowOnlyBarCodeLessItems] = useSession<
    boolean | null
  >("showOnlyBarCodeLessItems", null);
  const [showOnlyStockedProducts, setShowOnlyStockedProducts] = useSession<
    boolean | null
  >("showOnlyStockedProducts", null);
  const [
    showOnlyProductsWithoutComponents,
    setShowOnlyProductsWithoutComponents,
  ] = useSession<boolean | null>("showOnlyProductsWithoutComponents", null);

  const toggleOnlyMenuItems = useCallback(
    () => setShowOnlyMenuItems(!showOnlyMenuItems),
    [setShowOnlyMenuItems, showOnlyMenuItems],
  );
  const toggleShowOnlyBarCodeLessItems = useCallback(
    () => setShowOnlyBarCodeLessItems(!showOnlyBarCodeLessItems),
    [setShowOnlyBarCodeLessItems, showOnlyBarCodeLessItems],
  );
  const [activeFilters, setActiveFilters] = useState<string[]>(emptyArray);

  const toggleTag = useCallback(
    (tag: string) =>
      setActiveFilters(
        activeFilters.includes(tag.trim())
          ? removeItem(activeFilters, activeFilters.indexOf(tag.trim()))
          : [...activeFilters, tag.trim()],
      ),
    [activeFilters],
  );
  const allTags = useMemo(() => {
    const collator = new Intl.Collator("en");
    return [
      ...products
        .filter(({ locationIds }) =>
          showOnlyMenuItems && location
            ? locationIds?.includes(location._id)
            : true,
        )
        .filter(({ barCode }) => (showOnlyBarCodeLessItems ? !barCode : true))
        .reduce((memo, { tags }) => {
          tags?.forEach((tag) => memo.add(tag.trim()));

          return memo;
        }, new Set<string>(activeFilters)),
    ].sort(collator.compare.bind(collator));
  }, [
    activeFilters,
    location,
    products,
    showOnlyBarCodeLessItems,
    showOnlyMenuItems,
  ]);

  const allProductKeys = useMemo(() => {
    const keys = new Set<string>();
    products.forEach((product) => {
      Object.keys(product).forEach((key) => keys.add(key));
    });
    return Array.from(keys);
  }, [products]);

  if (error) return error;

  return (
    <div>
      {isEditing === NEW ? (
        <Modal onDismiss={() => setIsEditing(null)}>
          <PageProductsItem onCancel={() => setIsEditing(null)} />
        </Modal>
      ) : isEditing ? (
        <Modal onDismiss={() => setIsEditing(null)}>
          <PageProductsItem
            onCancel={() => setIsEditing(null)}
            product={products.find(({ _id }) => _id === isEditing)}
          />
        </Modal>
      ) : null}
      <div
        className={css`
          width: 99%;
          max-width: 1000px;
          margin: 0 auto;
        `}
      >
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
              background-color: ${(currentCamp &&
                getCorrectTextColor(currentCamp?.color, true)) ||
              "initial"};
              border: 2px solid black;
              color: ${(currentCamp &&
                getCorrectTextColor(currentCamp?.color)) ||
              "initial"};
              padding: 0 6px;
              border-radius: 3px;
              font-size: 1em;
              > input {
                margin-right: 4px;
              }
            }
          `}
        >
          <label>
            <input
              type="checkbox"
              onChange={toggleOnlyMenuItems}
              checked={showOnlyMenuItems}
            />
            show only items on the menu
          </label>
          <label>
            <input
              type="checkbox"
              onChange={toggleShowOnlyBarCodeLessItems}
              checked={Boolean(showOnlyBarCodeLessItems)}
            />
            show only items without barcodes
          </label>
          <label>
            <input
              type="checkbox"
              onChange={(e) => setShowOnlyStockedProducts(e.target.checked)}
              checked={Boolean(showOnlyStockedProducts)}
              disabled={Boolean(showOnlyProductsWithoutComponents)}
            />
            show only products with all components in stock
          </label>
          <label>
            <input
              type="checkbox"
              onChange={(e) =>
                setShowOnlyProductsWithoutComponents(e.target.checked)
              }
              checked={Boolean(showOnlyProductsWithoutComponents)}
              disabled={Boolean(showOnlyStockedProducts)}
            />
            show only products without components
          </label>
        </div>
        <div
          className={css`
            display: grid;
            grid-gap: 0.5vw 1vw;
            padding: 1vw;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));

            > label {
              > input {
                margin-right: 4px;
              }
            }
          `}
        >
          {allTags.map((tag) => (
            <label
              key={tag}
              className={css`
                display: flex;
                align-items: center;
                background: ${stringToColour(tag) ||
                `rgba(255, 255, 255, 0.4)`};
                color: ${getCorrectTextColor(stringToColour(tag)) || "white"};
                border: 2px solid black;
                padding: 0 6px;
                border-radius: 3px;
                margin-right: 2px;
                margin-bottom: 4px;
                font-size: 1.5em;
              `}
            >
              <input
                type="checkbox"
                checked={activeFilters.includes(tag.trim())}
                onChange={() => toggleTag(tag)}
              />
              {tag}
            </label>
          ))}
        </div>
        <select
          onChange={(event) =>
            setSortBy((event.target.value as keyof IProduct | "") || undefined)
          }
          value={sortBy ?? ""}
        >
          <option value="">Sort By...</option>
          {allProductKeys?.length
            ? allProductKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))
            : null}
        </select>
        {location ? <CurfewButton location={location} /> : null}
        {location ? <OpenCloseButton location={location} /> : null}
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

            > tbody > tr > td {
              color: ${camp && getCorrectTextColor(camp.color)};
              background: ${camp && camp.color};
            }

            > tbody > tr:nth-child(odd) > td {
              background: ${camp &&
              transparentize(4 / 5, getCorrectTextColor(camp?.color))};
            }
          `}
        >
          <thead>
            <tr>
              <th
                className={css`
                  > button {
                    white-space: nowrap;
                    width: 100%;
                    text-align: left;
                    padding: 6px;
                    > svg {
                      margin-right: 4px;
                    }
                  }
                `}
              >
                <button onClick={() => setIsEditing(NEW)}>
                  <FontAwesomeIcon icon={faPlus} /> Create
                </button>
              </th>
              <SortHeader
                field="name"
                sortBy={sortBy}
                toggleSortBy={toggleSortBy}
              >
                Brand & Name
              </SortHeader>
              <SortHeader
                field="salePrice"
                sortBy={sortBy}
                toggleSortBy={toggleSortBy}
              >
                Price
              </SortHeader>
              <SortHeader
                field="tags"
                sortBy={sortBy}
                toggleSortBy={toggleSortBy}
              >
                Tags
              </SortHeader>
              <SortHeader
                field="description"
                sortBy={sortBy}
                toggleSortBy={toggleSortBy}
              >
                Description
              </SortHeader>
              <SortHeader
                field="abv"
                sortBy={sortBy}
                toggleSortBy={toggleSortBy}
              >
                ABV
              </SortHeader>
              <SortHeader
                field="tap"
                sortBy={sortBy}
                toggleSortBy={toggleSortBy}
              >
                Tap
              </SortHeader>
              {isUserAdmin(user) && <th />}
            </tr>
          </thead>
          <tbody>
            {[...products]
              .filter((product) =>
                location?.curfew ? !isAlcoholic(product) : true,
              )
              .filter((product) => {
                if (!activeFilters.length) return true;
                if (!product.tags) return true;

                return activeFilters.every(
                  (filter) =>
                    product.tags
                      ?.map((tag) => tag.trim())
                      .includes(filter.trim()),
                );
              })
              .filter(({ locationIds }) =>
                showOnlyMenuItems && location
                  ? locationIds?.includes(location._id)
                  : true,
              )
              .filter(({ barCode }) =>
                showOnlyBarCodeLessItems ? !barCode : true,
              )
              .filter(({ components }) => {
                if (showOnlyStockedProducts) {
                  if (!components?.length) return false;

                  return components?.every((component) => {
                    const stock = stocks.find(
                      (stock) => component.stockId === stock._id,
                    );
                    if (!stock || !stock.levels?.length) return false;
                    if (
                      !stock.levels?.some((level) =>
                        isBefore(
                          subDays(new Date(), 14),
                          new Date(level.timestamp),
                        ),
                      )
                    ) {
                      return false;
                    }

                    return (stock?.approxCount ?? 0) > 0;
                  });
                } else if (
                  showOnlyProductsWithoutComponents &&
                  components?.length
                ) {
                  return false;
                }

                return true;
              })
              .map((product) => {
                const isOnMenu =
                  location && product.locationIds?.includes(location?._id);
                return (
                  <tr key={product._id}>
                    <td
                      className={css`
                        > button {
                          white-space: nowrap;
                          width: 100%;
                          text-align: left;
                          padding: 6px;
                          > svg {
                            margin-right: 4px;
                          }
                        }
                      `}
                    >
                      <button
                        onClick={async () => {
                          if (!location) return;

                          await editProduct({
                            productId: product._id,
                            data: isOnMenu
                              ? {
                                  locationIds: product.locationIds?.filter(
                                    (id) => id !== location._id,
                                  ),
                                }
                              : {
                                  locationIds: [
                                    ...(product.locationIds || emptyArray),
                                    location._id,
                                  ],
                                },
                          });
                        }}
                        disabled={location?.curfew && isAlcoholic(product)}
                        style={{
                          background:
                            location?.curfew && isAlcoholic(product)
                              ? "gray"
                              : isOnMenu
                              ? "red"
                              : "limegreen",
                          color: "white",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={
                            location?.curfew && isAlcoholic(product)
                              ? faBan
                              : isOnMenu
                              ? faFolderMinus
                              : faFolderPlus
                          }
                        />{" "}
                        Menu
                      </button>
                      <button onClick={() => setIsEditing(product._id)}>
                        <FontAwesomeIcon icon={faPencilAlt} /> Edit
                      </button>
                    </td>
                    <td>
                      <small>{product.brandName}</small>
                      <br />
                      <b>{product.name}</b>
                      <br />
                      {product.unitSize}
                      {product.sizeUnit}
                    </td>
                    <td
                      align="center"
                      className={css`
                        white-space: nowrap;
                      `}
                    >
                      {product.salePrice}{" "}
                      {!isUserResponsible(
                        currentUser,
                      ) ? null : product.shopPrices?.some(
                          ({ buyPrice }) =>
                            buyPrice &&
                            Number(buyPrice) !== Number(product.salePrice) &&
                            Number(buyPrice) < Number(product.salePrice),
                        ) ? null : (
                        <small>?</small>
                      )}
                      ʜᴀx
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {[...(product.tags || emptyArray)].sort()?.map((tag) => (
                        <span
                          key={tag}
                          className={css`
                            display: inline-block;
                            background: ${stringToColour(tag) ||
                            `rgba(0, 0, 0, 0.4)`};
                            color: ${getCorrectTextColor(stringToColour(tag)) ||
                            "white"};
                            padding: 0 3px;
                            border-radius: 4px;
                            margin-left: 2px;
                          `}
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </td>
                    <td>{product.description}</td>
                    <td>{product.abv ? `${product.abv}%` : null}</td>
                    <td>{product.tap}</td>
                    {isUserAdmin(user) && (
                      <td>
                        <button
                          onClick={async () => {
                            if (
                              window.confirm(
                                "Are you sure you want to delete " +
                                  product.name,
                              )
                            ) {
                              await removeProduct({ productId: product._id });
                            }
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
