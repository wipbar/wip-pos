import { css } from "emotion";
import React from "react";
import useSession from "../hooks/useSession";
import CartView from "./CartView";
import ProductPicker from "./ProductPicker";

export default function App() {
  const [, setPickedProductIds] = useSession("pickedProductIds", []);

  return (
    <div
      className={css`
        flex: 1;
        display: flex;
        width: 100%;
        height: 100%;
      `}
    >
      <ProductPicker
        onProductPicked={productId =>
          setPickedProductIds(pickedProductIds => [
            ...pickedProductIds,
            productId,
          ])
        }
        className={css`
          flex: 1;
        `}
      />
      <CartView />
    </div>
  );
}
