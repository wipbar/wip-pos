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
          grid-template-columns: repeat(3, 31%);
          width: 100%;
          grid-gap: 0.5em;
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
                display: block;
                border-radius: 5px;
              `}
            >
              {product.brandName ? (
                <>
                  {product.brandName}
                  <br />
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
            </button>
          ))}
      </div>
    </div>
  );
}
