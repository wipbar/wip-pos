import React from "react";
import Products from "../api/products";
import useTracker from "../hooks/useTracker";
import useSubscription from "../hooks/useSubscription";
import { css } from "emotion";
import useSession from "../hooks/useSession";

export default function ProductPicker({ ...props }) {
  const [, setPickedProductIds] = useSession("pickedProductIds", []);
  useSubscription("products");
  const products = useTracker(() =>
    Products.find({ removedAt: { $exists: false } }).fetch(),
  );
  return (
    <div {...props}>
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
            ((a.brandName || "ZZZZZZZZZ") + a.name).localeCompare(
              (b.brandName || "ZZZZZZZZZ") + b.name,
            ),
          )
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
                  <small>
                    <small>
                      {" "}
                      <i>
                        {product.unitSize}
                        {product.sizeUnit}
                      </i>
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
