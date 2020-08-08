import { css } from "emotion";
import React, { useEffect } from "react";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useSession from "../hooks/useSession";
import CartView from "./CartView";
import ProductPicker from "./ProductPicker";

export default function PageTend() {
  const { error, loading, location } = useCurrentLocation(true);
  const [, setTitle] = useSession("DocumentTitle");
  useEffect(() => {
    if (location) setTitle(`${location.name} - Sell`);
  }, [location, setTitle]);
  if (loading) return "Loading...";
  if (error) return error;
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
          overflow-x: hidden;
        `}
      />
      <CartView />
    </div>
  );
}
