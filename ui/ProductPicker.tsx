import { css } from "emotion";
import React, { HTMLProps, useCallback, useEffect, useState } from "react";
import Products, { isAlcoholic } from "../api/products";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useMongoFetch from "../hooks/useMongoFetch";
import useSession from "../hooks/useSession";
import { getCorrectTextColor, stringToColour } from "../util";
import Camps from "/api/camps";

function removeItem<T>(items: T[], i: number) {
  return items.slice(0, i).concat(items.slice(i + 1, items.length));
}
const tagsToString = (tags: string[] = []) => [...tags].sort().join(",");

export default function ProductPicker(props: HTMLProps<HTMLDivElement>) {
  const { location } = useCurrentLocation();
  const {
    data: [currentCamp],
  } = useMongoFetch(Camps.find({}, { sort: { end: -1 } }));
  const [showOnlyMenuItems, setShowOnlyMenuItems] = useState(true);
  const [showItemDetails, setShowItemDetails] = useState(true);
  const toggleOnlyMenuItems = useCallback(
    () => setShowOnlyMenuItems(!showOnlyMenuItems),
    [showOnlyMenuItems],
  );
  const toggleItemDetails = useCallback(
    () => setShowItemDetails(!showItemDetails),
    [showItemDetails],
  );
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [pickedProductIds, setPickedProductIds] = useSession<string[]>(
    "pickedProductIds",
    [],
  );
  const [prevPickedProductIds, setPrevPickedProductIds] =
    useState(activeFilters);
  useEffect(() => {
    if (pickedProductIds?.length == 0 && prevPickedProductIds?.length > 0) {
      setActiveFilters([]);
    }
    setPrevPickedProductIds(pickedProductIds);
  }, [pickedProductIds, prevPickedProductIds]);
  const { data: products, loading } = useMongoFetch(
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
      .filter((product) =>
        showOnlyMenuItems && location
          ? product.locationIds?.includes(location._id)
          : true,
      )
      .reduce((memo, product) => {
        product.tags?.forEach((tag) => memo.add(tag.trim()));

        return memo;
      }, new Set<string>()),
  ];

  if (loading) return <>Loading...</>;

  return (
    <div {...props}>
      <div
        className={css`
          text-align: center;
          padding-top: 1em;
        `}
      >
        <small>
          <label
            className={css`
              display: inline-flex;
              align-items: center;
              background-color: ${currentCamp?.color};
              color: ${getCorrectTextColor(currentCamp?.color)};
              padding: 0 6px;
              border-radius: 4px;
              margin-right: 2px;
              margin-bottom: 4px;
              font-size: 1.5em;
            `}
          >
            <input
              type="checkbox"
              onChange={toggleOnlyMenuItems}
              checked={showOnlyMenuItems}
              className={css`
                margin-right: 4px;
              `}
            />
            show only items on the menu
          </label>{" "}
          <label
            className={css`
              display: inline-flex;
              align-items: center;
              background-color: ${currentCamp?.color};
              color: ${getCorrectTextColor(currentCamp?.color)};
              padding: 0 6px;
              border-radius: 4px;
              margin-right: 2px;
              margin-bottom: 4px;
              font-size: 1.5em;
            `}
          >
            <input
              type="checkbox"
              onChange={toggleItemDetails}
              checked={showItemDetails}
              className={css`
                margin-right: 4px;
              `}
            />
            show item details
          </label>
        </small>
      </div>
      <div
        className={css`
          display: flex;
          justify-content: space-around;
          margin-top: 1em;
          margin-bottom: 0.5em;

          flex-wrap: wrap;
        `}
      >
        {allTags.map((tag) => (
          <label
            key={tag}
            className={css`
              display: inline-flex;
              align-items: center;
              background: ${stringToColour(tag) || `rgba(255, 255, 255, 0.4)`};
              color: ${getCorrectTextColor(stringToColour(tag)) || "white"};
              padding: 0 6px;
              border-radius: 4px;
              margin-right: 2px;
              margin-bottom: 4px;
              font-size: 1.5em;
            `}
          >
            <input
              type="checkbox"
              checked={activeFilters.includes(tag.trim())}
              onChange={() => toggleTag(tag)}
              className={css`
                margin-right: 4px;
              `}
            />
            {tag}
          </label>
        ))}
      </div>
      <div
        className={css`
          display: flex;
          justify-content: space-around;
          flex-wrap: wrap;
          width: 100%;
          max-width: 100%;
          padding: 0.5em;
        `}
      >
        {[...products]
          .filter((product) =>
            location?.curfew ? !isAlcoholic(product) : true,
          )
          .sort((a, b) => a.name.localeCompare(b.name))
          .sort((a, b) => a.brandName.localeCompare(b.brandName))
          .sort((a, b) => a.tap?.localeCompare(b.tap || "") || 0)
          .sort((a, b) =>
            tagsToString(a.tags).localeCompare(tagsToString(b.tags)),
          )
          .filter((product) => {
            if (!activeFilters.length) return true;
            if (!product.tags) return true;

            return activeFilters.every((filter) =>
              product.tags?.map((tag) => tag.trim()).includes(filter.trim()),
            );
          })
          .filter((product) =>
            showOnlyMenuItems && location
              ? product.locationIds?.includes(location._id)
              : true,
          )
          .map((product) => (
            <button
              key={product._id}
              onClick={() =>
                setPickedProductIds((pickedProductIds) => [
                  ...pickedProductIds,
                  product._id,
                ])
              }
              className={css`
                width: 100%;
                @media (min-width: 500px) {
                  width: 49%;
                }
                @media (min-width: 700px) {
                  width: 32%;
                }
                @media (min-width: 1400px) {
                  width: 24%;
                }
                background: ${stringToColour(
                  [...(product.tags || [])].sort().join(","),
                  0.69,
                ) || "rgba(255, 255, 255, 1)"};
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                border-radius: 5px;
                align-items: center;
                margin-bottom: 5px;
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
              <div
                className={css`
                  margin-top: 6px;
                `}
              >
                {showItemDetails && (
                  <span
                    className={css`
                      opacity: 0.75;
                    `}
                  >
                    <code>
                      <b>{product.salePrice}</b>
                    </code>
                    <small>HAX</small>
                  </span>
                )}
                {product.tap ? <small> 🚰 {product.tap}</small> : null}
              </div>
            </button>
          ))}
        <div
          className={css`
            @media (orientation: portrait) {
              width: 32%;
            }
            width: 24%;
          `}
        />
        <div
          className={css`
            @media (orientation: portrait) {
              width: 32%;
            }
            width: 24%;
          `}
        />
        <div
          className={css`
            @media (orientation: portrait) {
              width: 32%;
            }
            width: 24%;
          `}
        />
      </div>
    </div>
  );
}
