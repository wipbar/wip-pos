import React from "react";
import Products from "../api/products";
import useTracker from "../hooks/useTracker";
import useSubscription from "../hooks/useSubscription";
import { css } from "emotion";

export default function PageMenu() {
  const productsLoading = useSubscription("products");
  const products = useTracker(() =>
    Products.find(
      { removedAt: { $exists: false }, isOnMenu: true },
      { sort: { brandName: 1, name: 1 } },
    ).fetch(),
  );
  console.log(products, productsLoading);
  if (productsLoading) return "Loading...";
  const productsGroupedByTags = Object.entries(
    products.reduce((memo, product) => {
      const key = product.tags
        ? product.tags
            .split(",")
            .map(tag => tag.trim())
            .sort()
            .join(",")
        : "other";
      if (memo[key]) {
        memo[key].push(product);
      } else {
        memo[key] = [product];
      }
      return memo;
    }, []),
  );
  return (
    <div
      className={css`
        columns: 3;
        padding: 16px;
        font-size: 1.1em;
        max-height: 100%;
      `}
    >
      {productsGroupedByTags
        .sort((a, b) => b[1].length - a[1].length)
        .map(([tags, products], i) => {
          return (
            <div
              key={tags}
              className={css`
                -webkit-column-break-inside: avoid;
                page-break-inside: avoid;
                break-inside: avoid;
              `}
            >
              <h2
                className={
                  i == 0
                    ? css`
                        margin-top: 0;
                      `
                    : undefined
                }
              >
                {tags.split(",").join(", ")}
              </h2>
              <ul
                className={css`
                  margin: 0;
                  padding: 0;
                  list-style: none;
                `}
              >
                {products.map(product => (
                  <li
                    key={product._id}
                    className={css`
                      margin: 0;
                      padding: 4px 6px;
                      display: flex;
                      background: rgba(255, 255, 255, 0.1);
                      margin-bottom: 4px;
                      align-items: center;
                    `}
                  >
                    <div
                      className={css`
                        flex: 1;
                      `}
                    >
                      <small>
                        <small>{product.brandName}</small>
                      </small>
                      <br />
                      {product.name}
                    </div>
                    <div
                      className={css`
                        margin-left: 5px;
                        font-size: 1.1em;
                        text-align: center;
                      `}
                    >
                      <div
                        className={css`
                          margin-bottom: -12px;
                        `}
                      >
                        <b>{product.salePrice}</b>
                      </div>
                      <small>
                        <small>HAX</small>
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
    </div>
  );
}
