import { css } from "emotion";
import React from "react";
import useCurrentLocation from "../hooks/useCurrentLocation";
import CartView from "./CartView";
import ProductPicker from "./ProductPicker";

export default function PageTend() {
  const { error, loading } = useCurrentLocation(true);
  if (loading) return "Loading...";
  if (error) return error;
  return (
    <div
      className={css`
        flex: 1;
        display: flex;
        width: 100%;
        height: 100%;
        max-height: 100%;
        align-items: stretch;
      `}
    >
      <ProductPicker
        className={css`
          flex: 3;
          overflow-y: scroll;
          overflow-x: hidden;
          max-height: calc(100vh - 80px);
        `}
      />
      <CartView />
    </div>
  );
}
