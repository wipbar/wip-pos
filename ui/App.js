import React from "react";
import useSession from "../hooks/useSession";
import AccountsUIWrapper from "./AccountsUIWrapper";
import Hello from "./Hello";
import Info from "./Info";
import ProductPicker from "./ProductPicker";
import SlideConfirm from "./SlideConfirm";
import CartView from "./CartView";

export default function App() {
  const [pickedProductIds, setPickedProductIds] = useSession(
    "pickedProductIds",
    [],
  );
  console.log("?");
  return (
    <div>
      <AccountsUIWrapper />
      <SlideConfirm onConfirm={() => console.log("confirmed!")} />
      <Hello />
      <Info />
      <ProductPicker
        onProductPicked={productId =>
          setPickedProductIds([...pickedProductIds, productId])
        }
      />
      <CartView />
    </div>
  );
}
