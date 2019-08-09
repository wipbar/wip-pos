import React from "react";
import Products from "../api/products";
import useMethod from "../hooks/useMethod";
import useSession from "../hooks/useSession";
import useSubscription from "../hooks/useSubscription";
import useTracker from "../hooks/useTracker";
import SlideConfirm from "./SlideConfirm";
import { css } from "emotion";

const removeItem = (items, i) =>
  items.slice(0, i - 1).concat(items.slice(i, items.length));

export default function CartView() {
  const loading = useSubscription("products");
  const products = useTracker(() => Products.find().fetch());
  const [pickedProductIds, setPickedProductIds] = useSession(
    "pickedProductIds",
    [],
  );
  const [doSellProducts] = useMethod("Sales.sellProducts");

  if (loading) return null;
  return (
    <div
      className={css`
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        max-height: 100%;
        flex: 1;
        overflow: hidden;
        border-left: 1px solid rgba(255, 255, 255, 0.4);
      `}
    >
      {pickedProductIds && pickedProductIds.length ? (
        <>
          <ul
            className={css`
              flex: 1;
              margin: 0;
              list-style: none;
              padding: 0;
              overflow-y: scroll;
              overflow-x: hidden;
            `}
          >
            {pickedProductIds
              .map(id => products.find(({ _id }) => id == _id))
              .map((product, i) => (
                <li
                  key={i + product._id}
                  className={css`
                    margin: 0;
                    list-style: none;
                    padding: 0;
                  `}
                >
                  <div
                    className={css`
                      display: flex;
                      align-items: center;
                      max-width: 100%;
                      padding-left: 5px;
                    `}
                  >
                    <button
                      className={css`
                        display: flex;
                        background: white;
                        color: red;
                        border-radius: 100%;
                        margin-right: 5px;
                        width: 40px;
                        height: 40px;
                        font-family: sans-serif;
                        align-items: center;
                        justify-content: center;
                      `}
                      onClick={() =>
                        setPickedProductIds(removeItem(pickedProductIds, i + 1))
                      }
                    >
                      X
                    </button>
                    <div>
                      {product.brandName ? (
                        <>
                          {product.brandName} <br />
                        </>
                      ) : null}
                      <big>{product.name}</big>
                      <br />
                      <i>
                        {product.unitSize}
                        {product.sizeUnit}
                      </i>
                      <br />
                      <b>{product.salePrice} HAX</b>
                    </div>
                  </div>
                  <hr />
                </li>
              ))}
          </ul>
          <div
            className={css`
              flex-shrink: 0;
              border-top: 2px solid rgba(255, 255, 255, 0.1);
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 1em 0;
              box-shadow: #ffed00 0 0 10px 0px;
            `}
          >
            <big>
              <b>
                {pickedProductIds.reduce(
                  (m, id) =>
                    m + products.find(({ _id }) => id == _id).salePrice,
                  0,
                )}{" "}
                HAX
              </b>
            </big>
            <div>
              <button
                type="button"
                onClick={async () => {
                  await doSellProducts({ productIds: pickedProductIds });
                  setPickedProductIds([]);
                }}
                className={css`
                  display: block;
                  background-color: #ffed00;
                  color: black;
                `}
              >
                Press To Sell
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
