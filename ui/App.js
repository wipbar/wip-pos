import { css } from "emotion";
import React from "react";
import useSession from "../hooks/useSession";
import CartView from "./CartView";
import ProductPicker from "./ProductPicker";

export default function App() {
  return (
    <div
      className={css`
        flex: 1;
        display: flex;
        width: 100%;
        height: 100%;
        align-items: stretch;
      `}
    >
      <ProductPicker
        className={css`
          flex: 3;
          overflow-y: scroll;
        `}
      />
      <CartView
        className={css`
          flex: 1;
        `}
      />
    </div>
  );
}
