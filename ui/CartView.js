import React from "react";
import Products from "../api/products";
import useSession from "../hooks/useSession";
import useSubscription from "../hooks/useSubscription";
import useTracker from "../hooks/useTracker";

const emptyArray = [];
export default function CartView() {
  const loading = useSubscription("products");
  const products = useTracker(() => Products.find().fetch());
  const [pickedProductIds = ["dasd"], setPickedProductIds] = useSession(
    "pickedProductIds",
  );
  if (loading) return null;
  return pickedProductIds
    ? pickedProductIds
        .map(id => products.find(({ _id }) => id == _id))
        .map((product, i) => <li key={i + product._id}>{product.name}</li>)
    : null;
}
