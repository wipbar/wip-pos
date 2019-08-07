import React from "react";
import Products from "../api/products";
import Purchases from "../api/purchases";
import useMethod from "../hooks/useMethod";
import useSession from "../hooks/useSession";
import useSubscription from "../hooks/useSubscription";
import useTracker from "../hooks/useTracker";
import SlideConfirm from "./SlideConfirm";

export default function CartView() {
  const loading = useSubscription("products");
  const products = useTracker(() => Products.find().fetch());
  useSubscription("purchases");
  const purchases = useTracker(() => Purchases.find().fetch());
  const [pickedProductIds, setPickedProductIds] = useSession(
    "pickedProductIds",
    [],
  );
  const [doSellProducts] = useMethod("Products.sellProducts");

  if (loading) return null;
  return (
    <>
      {pickedProductIds && pickedProductIds.length ? (
        <>
          {pickedProductIds
            .map(id => products.find(({ _id }) => id == _id))
            .map((product, i) => (
              <li key={i + product._id}>{product.name}</li>
            ))}
          <SlideConfirm
            onConfirm={async () => {
              await doSellProducts({ productIds: pickedProductIds });
              setPickedProductIds([]);
            }}
          />
        </>
      ) : null}
    </>
  );
}
