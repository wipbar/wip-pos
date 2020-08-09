import { css } from "emotion";
import React, { useCallback, useEffect, useState } from "react";
import Products from "../api/products";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useMongoFetch from "../hooks/useMongoFetch";
import useSession from "../hooks/useSession";

const removeItem = (items, i) =>
  items.slice(0, i).concat(items.slice(i + 1, items.length));

function stringToColour(inputString, alpha = 1) {
  var sum = 0;

  for (var i in inputString) sum += inputString.charCodeAt(i);

  let r = ~~(
    ("0." +
      Math.sin(sum + 1)
        .toString()
        .substr(6)) *
    256
  );
  let g = ~~(
    ("0." +
      Math.sin(sum + 2)
        .toString()
        .substr(6)) *
    256
  );
  let b = ~~(
    ("0." +
      Math.sin(sum + 3)
        .toString()
        .substr(6)) *
    256
  );

  return `rgba(${r},${g},${b},${alpha})`;
}

function getCorrectTextColor(hex) {
  const threshold = 170; /* about half of 256. Lower threshold equals more dark text on dark background  */
  let hRed, hGreen, hBlue;
  if (hex.startsWith("rgba(")) {
    const [, vals] = hex.match(/^rgba\((.+)\)$/);
    if (vals) {
      [hRed, hGreen, hBlue] = vals.split(",");
    }
  } else {
    hRed = hexToR(hex);
    hGreen = hexToG(hex);
    hBlue = hexToB(hex);
  }

  const cutHex = (h) => (h.charAt(0) == "#" ? h.substring(1, 7) : h);
  const hexToR = (h) => parseInt(cutHex(h).substring(0, 2), 16);
  const hexToG = (h) => parseInt(cutHex(h).substring(2, 4), 16);
  const hexToB = (h) => parseInt(cutHex(h).substring(4, 6), 16);

  return (hRed * 299 + hGreen * 587 + hBlue * 114) / 1000 > threshold
    ? "#000000"
    : "#ffffff";
}

export default function ProductPicker(props) {
  const { location } = useCurrentLocation();
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
  const [activeFilters, setActiveFilters] = useState([]);
  const [pickedProductIds, setPickedProductIds] = useSession(
    "pickedProductIds",
    [],
  );
  const [prevPickedProductIds, setPrevPickedProductIds] = useState(
    activeFilters,
  );
  useEffect(() => {
    if (
      pickedProductIds &&
      pickedProductIds.length == 0 &&
      prevPickedProductIds &&
      prevPickedProductIds.length > 0
    ) {
      setActiveFilters([]);
    }
    setPrevPickedProductIds(pickedProductIds);
  }, [pickedProductIds, prevPickedProductIds]);
  const { data: products } = useMongoFetch(
    Products.find({ removedAt: { $exists: false } }),
  );
  const toggleTag = useCallback(
    (tag) =>
      setActiveFilters(
        activeFilters.includes(tag.trim())
          ? removeItem(activeFilters, activeFilters.indexOf(tag.trim()))
          : [...activeFilters, tag.trim()],
      ),
    [activeFilters],
  );
  const allTags = [
    ...products.reduce((memo, product) => {
      if (product.tags) {
        product.tags.split(",").forEach((tag) => memo.add(tag.trim()));
      }
      return memo;
    }, new Set()),
  ];

  return (
    <div {...props}>
      <div
        className={css`
          text-align: center;
          padding-top: 1em;
        `}
      >
        <label
          className={css`
            display: inline-flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.4);
            color: white;
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
        </label>
        <label
          className={css`
            display: inline-flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.4);
            color: white;
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
          .sort((a, b) =>
            activeFilters.length
              ? ((a.tags ? "!!!!" : "") + a.name).localeCompare(
                  (b.tags ? "!!!!" : "") + b.name,
                )
              : ((a.brandName || "ZZZZZZZZZ") + a.name).localeCompare(
                  (b.brandName || "ZZZZZZZZZ") + b.name,
                ),
          )
          .filter((product) => {
            if (!activeFilters.length) return true;
            if (!product.tags) return true;

            return activeFilters.every((filter) =>
              product.tags
                .split(",")
                .map((tag) => tag.trim())
                .includes(filter.trim()),
            );
          })
          .filter((product) =>
            showOnlyMenuItems
              ? product.locationIds &&
                product.locationIds.includes(location._id)
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
                @media (orientation: portrait) {
                  width: 32%;
                }
                width: 24%;
                background: ${stringToColour(product.brandName, 0.4) ||
                "rgba(255, 255, 255, 1)"};
                color: white;
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
                  <b>
                    <big>{product.name}</big>
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
                          {product.tags &&
                            product.tags.split(",").map((tag) => (
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
              {showItemDetails && (
                <div
                  className={css`
                    margin-top: 6px;
                    opacity: 0.75;
                  `}
                >
                  <code>
                    <b>{product.salePrice}</b>
                  </code>
                  <small>HAX</small>
                </div>
              )}
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
      </div>
    </div>
  );
}
