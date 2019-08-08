import React from "react";
import Sales from "../api/sales";
import useSubscription from "../hooks/useSubscription";
import useTracker from "../hooks/useTracker";

export default function PageSales() {
  useSubscription("sales");
  const sales = useTracker(() => Sales.find().fetch());
  return sales && <pre>{JSON.stringify(sales, null, 2)}</pre>;
}
