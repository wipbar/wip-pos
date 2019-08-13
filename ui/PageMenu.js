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
  const randomIndex = Math.floor(
    Math.random() * (productsGroupedByTags.length - 1),
  );
  console.log(randomIndex);
  return (
    <div
      className={css`
        columns: 4;
        padding: 16px;
        font-size: 1.25em;
        /*height: 100%;
        max-height: 100%;*/
        font-family: monospace;
      `}
    >
      {productsGroupedByTags
        .sort((a, b) => a[0].localeCompare(b[0]))
        //        .sort((a, b) => b[1].length - a[1].length)
        .map(([tags, products], i) => {
          const productsByBrandName = Object.entries(
            products.reduce((m, product) => {
              if (m[product.brandName]) {
                m[product.brandName].push(product);
              } else {
                m[product.brandName] = [product];
              }
              return m;
            }, {}),
          ).sort((a, b) => b[1].length - a[1].length);

          return (
            <>
              <div
                key={tags}
                className={css`
                  -webkit-column-break-inside: avoid;
                  page-break-inside: avoid;
                  break-inside: avoid;
                  border: 3px solid #ffed00;
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
                  {productsByBrandName.map(([brandName, products]) => (
                    <li
                      key={brandName}
                      className={css`
                        margin: 0;
                        padding: 4px 6px;
                        display: flex;
                        flex-direction: column;
                        background: rgba(255, 255, 255, 0.1);
                        margin-top: 4px;
                        align-items: stretch;
                        -webkit-column-break-inside: avoid;
                        page-break-inside: avoid;
                        break-inside: avoid;
                      `}
                    >
                      <small
                        className={css`
                          flex: 1;
                          display: flex;
                          justify-content: space-between;
                        `}
                      >
                        <span>{brandName}</span>
                        <small>HAX</small>
                      </small>
                      {products.map(product => (
                        <div
                          key={product._id}
                          className={css`
                            flex: 1;
                            display: flex;
                            justify-content: space-between;
                            border-top: rgba(255, 255, 255, 0.3) 1px solid;
                          `}
                        >
                          <span>
                            <span
                              className={css`
                                font-weight: 500;
                              `}
                            >
                              {product.name}
                            </span>{" "}
                            <small>
                              {[
                                product.unitSize && product.sizeUnit
                                  ? `${product.unitSize}${product.sizeUnit}`
                                  : null,
                                product.abv ? `${product.abv}%` : null,
                              ]
                                .filter(Boolean)
                                .map((thing, i) => (
                                  <>
                                    {i > 0 ? ", " : null}
                                    <small key={thing}>{thing}</small>
                                  </>
                                ))}
                            </small>
                          </span>
                          <b>{product.salePrice}</b>
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
              {i === randomIndex ? (
                <div
                  className={css`
                    display: flex;
                    justify-content: center;
                  `}
                >
                  <pre
                    className={css`
                      font-size: 0.7em;
                      opacity: 0.7;
                      line-height: 1;
                      letter-spacing: -2px;
                    `}
                  >
                    SE68kX2mkjWWgSdxZCpm9gZ7JPvbZ6cM
                  </pre>
                </div>
              ) : null}
            </>
          );
        })}
    </div>
  );
}
