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
        font-size: 1.24em;
        height: 100%;
        max-height: 100%;
      `}
    >
      {productsGroupedByTags
        .sort((a, b) => a[0].localeCompare(b[0]))
        //        .sort((a, b) => b[1].length - a[1].length)
        .map(([tags, products]) => {
          return (
            <div
              key={tags}
              className={css`
                -webkit-column-break-inside: avoid;
                page-break-inside: avoid;
                break-inside: avoid;
                border: 1px solid #ffed00;
                margin-bottom: 24px;
                padding: 4px;
              `}
            >
              <h3
                className={css`
                  margin: 0;
                  padding: 8px;
                `}
              >
                {tags.split(",").join(", ")}
              </h3>
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
                      margin-top: 4px;
                      align-items: center;
                      -webkit-column-break-inside: avoid;
                      page-break-inside: avoid;
                      break-inside: avoid;
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
                      <b>{product.name}</b>
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
