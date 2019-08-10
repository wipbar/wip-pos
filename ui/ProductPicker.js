import { css } from "emotion";
import React, { useCallback, useEffect, useState } from "react";
import Products from "../api/products";
import useSession from "../hooks/useSession";
import useSubscription from "../hooks/useSubscription";
import useTracker from "../hooks/useTracker";

const removeItem = (items, i) =>
  items.slice(0, i).concat(items.slice(i + 1, items.length));

export default function ProductPicker(props) {
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
  useSubscription("products");
  const products = useTracker(() =>
    Products.find({ removedAt: { $exists: false } }).fetch(),
  );
  const toggleTag = useCallback(
    tag => {
      if (activeFilters.includes(tag.trim()))
        setActiveFilters(
          removeItem(activeFilters, activeFilters.indexOf(tag.trim())),
        );
      else {
        setActiveFilters([...activeFilters, tag.trim()]);
      }
    },
    [activeFilters],
  );
  const allTags = [
    ...products.reduce((memo, product) => {
      if (product.tags) {
        product.tags.split(",").forEach(tag => memo.add(tag.trim()));
      }
      return memo;
    }, new Set()),
  ];

  return (
    <div {...props}>
      <div
        className={css`
          display: flex;
          justify-content: space-around;
          margin-top: 1em;
          margin-bottom: 0.5em;

          flex-wrap: wrap;
        `}
      >
        {allTags.map(tag => (
          <label
            key={tag}
            className={css`
              display: inline-block;
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
              checked={activeFilters.includes(tag.trim())}
              onChange={() => toggleTag(tag)}
            />{" "}
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
              ? (
                  (a.tags ? "!!!!" : "") +
                  (a.brandName || "ZZZZZZZZZ") +
                  a.name
                ).localeCompare(
                  (b.tags ? "!!!!" : "") +
                    (b.brandName || "ZZZZZZZZZ") +
                    b.name,
                )
              : ((a.brandName || "ZZZZZZZZZ") + a.name).localeCompare(
                  (b.brandName || "ZZZZZZZZZ") + b.name,
                ),
          )
          .filter(product => {
            if (!activeFilters.length) return true;
            if (!product.tags) return true;

            return activeFilters.every(filter =>
              product.tags
                .split(",")
                .map(tag => tag.trim())
                .includes(filter.trim()),
            );
          })
          .map(product => (
            <button
              key={product._id}
              onClick={() =>
                setPickedProductIds(pickedProductIds => [
                  ...pickedProductIds,
                  product._id,
                ])
              }
              className={css`
                @media (orientation: portrait) {
                  width: 32%;
                }
                width: 24%;
                background: rgba(255, 255, 255, 1);
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
                    <small>{product.brandName}</small>
                  </div>
                ) : null}
                <div>
                  <b>
                    <big>{product.name}</big>
                  </b>
                  <br />
                  <small>
                    <small>
                      <i>
                        {product.unitSize}
                        {product.sizeUnit}
                      </i>{" "}
                      {product.tags &&
                        product.tags.split(",").map(tag => (
                          <span
                            key={tag}
                            className={css`
                              display: inline-block;
                              background: rgba(0, 0, 0, 0.4);
                              color: white;
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
                </div>
              </div>
              <div
                className={css`
                  margin-top: 6px;
                  opacity: 0.5;
                `}
              >
                <b>{product.salePrice} HAX</b>
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
      </div>
    </div>
  );
}
