import React from "react";
import Products from "../api/products";
import useTracker from "../hooks/useTracker";
import useSubscription from "../hooks/useSubscription";
import { css } from "emotion";
import useSession from "../hooks/useSession";

export default function ProductPicker({ ...props }) {
  const [, setPickedProductIds] = useSession("pickedProductIds", []);
  useSubscription("products");
  const products = useTracker(() => Products.find({}).fetch());
  return (
    <div {...props}>
      <div
        className={css`
          display: grid;
          grid-template-columns: repeat(3, calc(34% - 0.5em));
          align-items: stretch;
          justify-content: center;
          width: 100%;
          grid-gap: 0.5em;
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
                background: lightgray;
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
                {product.brandName ? <div>{product.brandName}</div> : null}
                <div>
                  <big>{product.name}</big>
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
              <b>{product.salePrice} HAX</b>
            </button>
          ))}
      </div>
    </div>
  );
}
