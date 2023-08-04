import { css } from "@emotion/css";
import { useFind } from "meteor/react-meteor-data";
import { lighten } from "polished";
import React, { HTMLProps, useCallback, useEffect, useState } from "react";
import Products, { ProductID, isAlcoholic } from "../api/products";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useSession from "../hooks/useSession";
import { getCorrectTextColor, stringToColour } from "../util";

function removeItem<T>(items: T[], i: number) {
  return items.slice(0, i).concat(items.slice(i + 1, items.length));
}
const tagsToString = (tags: string[] = []) => [...tags].sort().join(",");

export default function ProductPicker({
  pickedProductIds,
  setPickedProductIds,
  ...props
}: {
  pickedProductIds: ProductID[];
  setPickedProductIds: (value: ProductID[]) => void;
} & HTMLProps<HTMLDivElement>) {
  const { location } = useCurrentLocation();
  const currentCamp = useCurrentCamp();
  const [showOnlyMenuItems, setShowOnlyMenuItems] = useState(true);
  const [showOnlyBarCodeLessItems, setShowOnlyBarCodeLessItems] = useSession<
    boolean | null
  >("showOnlyBarCodeLessItems", null);
  const [showItemDetails, setShowItemDetails] = useState(true);
  const toggleOnlyMenuItems = useCallback(
    () => setShowOnlyMenuItems(!showOnlyMenuItems),
    [showOnlyMenuItems],
  );
  const toggleShowOnlyBarCodeLessItems = useCallback(
    () => setShowOnlyBarCodeLessItems(!showOnlyBarCodeLessItems),
    [setShowOnlyBarCodeLessItems, showOnlyBarCodeLessItems],
  );
  const toggleItemDetails = useCallback(
    () => setShowItemDetails(!showItemDetails),
    [showItemDetails],
  );
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [prevPickedProductIds, setPrevPickedProductIds] =
    useState(activeFilters);
  useEffect(() => {
    if (pickedProductIds?.length == 0 && prevPickedProductIds?.length > 0) {
      setActiveFilters([]);
    }
    setPrevPickedProductIds(pickedProductIds);
  }, [pickedProductIds, prevPickedProductIds]);

  const products = useFind(() =>
    Products.find({ removedAt: { $exists: false } }),
  );
  const toggleTag = useCallback(
    (tag: string) =>
      setActiveFilters(
        activeFilters.includes(tag.trim())
          ? removeItem(activeFilters, activeFilters.indexOf(tag.trim()))
          : [...activeFilters, tag.trim()],
      ),
    [activeFilters],
  );
  const allTags = [
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
      }, new Set<string>()),
  ];

  return (
    <div
      {...props}
      className={
        css`
          box-shadow: ${currentCamp?.color} 0 0 10px 0px;
          background: ${currentCamp && getCorrectTextColor(currentCamp.color)};
        ` +
        (" " + (props.className || ""))
      }
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
            background-color: ${currentCamp?.color || "initial"};
            border: 2px solid black;
            color: ${(currentCamp && getCorrectTextColor(currentCamp?.color)) ||
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
            checked={showOnlyBarCodeLessItems || false}
          />
          show only items without barcodes
        </label>
        <label>
          <input
            type="checkbox"
            onChange={toggleItemDetails}
            checked={showItemDetails}
          />
          show item details
        </label>
      </div>
      <div
        className={css`
          display: grid;
          grid-gap: 0.5vw 1vw;
          padding: 1vw;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));

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
              background: ${stringToColour(tag) || `rgba(255, 255, 255, 0.4)`};
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
      <div
        className={css`
          display: grid;
          grid-gap: 0.5vw 1vw;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          padding: 1vw;
        `}
      >
        {[...products]
          .filter((product) =>
            location?.curfew ? !isAlcoholic(product) : true,
          )
          .filter((product) => {
            if (!activeFilters.length) return true;
            if (!product.tags) return true;

            return activeFilters.every(
              (filter) =>
                product.tags?.map((tag) => tag.trim()).includes(filter.trim()),
            );
          })
          .filter(({ locationIds }) =>
            showOnlyMenuItems && location
              ? locationIds?.includes(location._id)
              : true,
          )
          .filter(({ barCode }) => (showOnlyBarCodeLessItems ? !barCode : true))
          .sort((a, b) => a.name.localeCompare(b.name))
          .sort((a, b) => a.brandName.localeCompare(b.brandName))
          .sort((a, b) => a.tap?.localeCompare(b.tap || "") || 0)
          .sort((a, b) =>
            tagsToString(a.tags).localeCompare(tagsToString(b.tags)),
          )
          .map((product) => (
            <button
              key={product._id}
              onClick={() =>
                setPickedProductIds([...pickedProductIds, product._id])
              }
              className={css`
                background: linear-gradient(
                  135deg,
                  ${[...(product.tags || [])]
                    .sort()
                    .map((tag) => lighten(0.25, stringToColour(tag, 0.9)))
                    .join(", ")}
                );
                border: 2px solid black;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                border-radius: 5px;
                align-items: center;
              `}
            >
              <div
                className={css`
                  flex: 1;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  flex-direction: column;
                `}
              >
                {product.brandName ? (
                  <div>
                    <small>
                      <small>{product.brandName}</small>
                    </small>
                  </div>
                ) : null}
                <div>
                  <b
                    className={css`
                      font-size: 1.1em;
                    `}
                  >
                    {product.name}
                  </b>
                  {showItemDetails && (
                    <>
                      <br />
                      <small>
                        <small>
                          <i>
                            {product.unitSize}
                            {product.sizeUnit}
                          </i>{" "}
                          {[...(product.tags || [])].sort()?.map((tag) => (
                            <span
                              key={tag}
                              className={css`
                                display: inline-block;
                                background: ${stringToColour(tag) ||
                                `rgba(0, 0, 0, 0.4)`};
                                color: ${getCorrectTextColor(
                                  stringToColour(tag),
                                ) || "white"};
                                padding: 0 3px;
                                border-radius: 4px;
                                margin-left: 2px;
                              `}
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </small>
                      </small>
                    </>
                  )}
                </div>
              </div>
              <div>
                {showItemDetails && (
                  <span>
                    <code>
                      <b>{product.salePrice}</b>
                    </code>
                    <small>ʜᴀx</small>
                  </span>
                )}
                {product.tap ? <small> 🚰 {product.tap}</small> : null}
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
