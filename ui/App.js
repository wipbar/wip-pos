import React from "react";
import useSession from "../hooks/useSession";
import AccountsUIWrapper from "./AccountsUIWrapper";
import CartView from "./CartView";
import ProductPicker from "./ProductPicker";

export default function App() {
  const [, setPickedProductIds] = useSession("pickedProductIds", []);

  return (
    <div>
      <AccountsUIWrapper />
      <ProductPicker
        onProductPicked={productId =>
          setPickedProductIds(pickedProductIds => [
            ...pickedProductIds,
            productId,
          ])
        }
      />
      <CartView />
    </div>
  );
}
