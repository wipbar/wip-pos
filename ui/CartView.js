import { css } from "emotion";
import React, { useState } from "react";
import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import Products from "../api/products";
import useMethod from "../hooks/useMethod";
import useMongoFetch from "../hooks/useMongoFetch";
import useSession from "../hooks/useSession";
import useSubscription from "../hooks/useSubscription";

function CartViewProductsItem({ product, onRemoveClick }) {
  return (
    <li
      className={css`
        margin: 0;
        list-style: none;
        padding: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.4);
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          max-width: 100%;
        `}
      >
        <button
          className={css`
            display: flex;
            background: white;
            color: red;
            border-radius: 100%;
            margin-right: 5px;
            width: 32px;
            height: 32px;
            font-family: sans-serif;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          `}
          onClick={onRemoveClick}
        >
          X
        </button>
        <div
          className={css`
            flex: 1;
          `}
        >
          {product.brandName ? (
            <>
              <small>{product.brandName}</small>
              <br />
            </>
          ) : null}
          {product.name}
          <br />
          <small>
            <i>
              {product.unitSize}
              {product.sizeUnit}
            </i>
          </small>
        </div>
        <b
          className={css`
            line-height: 0.7;
            text-align: center;
          `}
        >
          <div>{product.salePrice}</div>
          <small>
            <small>HAX</small>
          </small>
        </b>
      </div>
    </li>
  );
}

const removeItem = (items, i) =>
  items.slice(0, i - 1).concat(items.slice(i, items.length));

export default function CartView() {
  useSubscription("products");
  const { locationSlug } = useParams();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data: products, loading } = useMongoFetch(
    Products.find({ removedAt: { $exists: false } }),
  );
  const [pickedProductIds, setPickedProductIds] = useSession(
    "pickedProductIds",
    [],
  );
  const [sellingLoading, setSellingLoading] = useState(false);
  const [doSellProducts] = useMethod("Sales.sellProducts");

  const haxTotal = pickedProductIds?.reduce(
    (m, id) => m + +products.find(({ _id }) => id == _id).salePrice,
    0,
  );
  return (
    <div
      className={css`
        width: 200px;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        max-height: 100%;
        flex: 1;
        border-left: 1px solid rgba(255, 255, 255, 0.4);
      `}
    >
      {pickedProductIds?.length ? (
        <>
          <ul
            className={css`
              flex: 1;
              margin: 0;
              list-style: none;
              padding: 0;
              overflow-y: scroll;
              overflow-x: hidden;
              max-height: calc(100vh - 230px);
            `}
          >
            {pickedProductIds.map((id, i) => (
              <CartViewProductsItem
                key={id + i}
                product={products.find(({ _id }) => id == _id)}
                onRemoveClick={() =>
                  setPickedProductIds(removeItem(pickedProductIds, i + 1))
                }
              />
            ))}
          </ul>
          <div
            className={css`
              flex-shrink: 0;
              border-top: 2px solid rgba(255, 255, 255, 0.1);
              display: flex;
              bottom: 0;
              position: sticky;
              flex-direction: column;
              align-items: center;
              padding-bottom: 1em;
              box-shadow: #ffed00 0 0 10px 0px;
              background: black;
            `}
          >
            <big>
              <big>
                <b>
                  {haxTotal}{" "}
                  <small>
                    <small>HAX</small>
                  </small>
                </b>
              </big>
            </big>
            <div>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className={css`
                  display: block;
                  background-color: #ffed00;
                  color: black;
                  margin-top: 1em;
                  padding: 1em;
                `}
              >
                Press To Sell
              </button>
            </div>
          </div>
        </>
      ) : null}
      {confirmOpen ? (
        <div
          className={css`
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
          `}
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className={css`
              background: white;
              color: black;
              padding: 1em;
              text-align: center;
            `}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            please confirm tending{" "}
            <code>
              <b>{haxTotal}</b>
            </code>
            <small>
              <small>HAX</small>
            </small>{" "}
            for
            <ul>
              {pickedProductIds.map((id, i) => (
                <li key={i + id}>
                  {products.find(({ _id }) => _id === id).name}{" "}
                  {products.find(({ _id }) => _id === id).brandName}
                </li>
              ))}
            </ul>
            <br />
            <button
              type="button"
              className={css`
                display: inline-block;
                margin-top: 1em;
                background-color: #ffed00;
                color: black;
                padding: 1em;
                width: 100%;
              `}
              disabled={sellingLoading}
              onClick={async (e) => {
                try {
                  setSellingLoading(true);
                  await doSellProducts({
                    locationSlug,
                    productIds: pickedProductIds,
                  });
                  setPickedProductIds([]);
                  setConfirmOpen(false);
                } catch {}
                setSellingLoading(false);
              }}
            >
              {sellingLoading ? <>Selling...</> : <>yeah i got it</>}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
