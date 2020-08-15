import { isWithinRange, subHours } from "date-fns";
import React, { useMemo } from "react";
import Camps from "../api/camps";
import Sales from "../api/sales";
import useMongoFetch from "../hooks/useMongoFetch";
import Fire from "./Fire";

const f = 10;
export default function ProductTrend({ product, ...props }) {
  const {
    data: [currentCamp],
  } = useMongoFetch(Camps.find({}, { sort: { end: -1 } }));
  const productSales = useMongoFetch(
    Sales.find({ products: { $elemMatch: { _id: product._id } } }),
  )?.data?.map((sale) => ({
    ...sale,
    products: sale.products.filter(
      (saleProduct) => saleProduct._id === product._id,
    ),
  }));
  // eslint-disable-next-line no-undef
  const averageSalesPerHour = useMemo(
    () =>
      productSales.reduce((memo, sale) => sale.products.length + memo, 0) /
      ((currentCamp?.end - currentCamp?.start) / 3600000),
    [currentCamp, productSales],
  );
  const salesInPastHour = useMemo(
    () =>
      productSales
        .filter((sale) =>
          isWithinRange(sale.timestamp, subHours(new Date(), 2), new Date()),
        )
        .reduce((memo, sale) => sale.products.length + memo, 0),
    [productSales],
  );
  const number = Number(salesInPastHour / (averageSalesPerHour / f)).toFixed(3);
  if (number > 400) return <Fire {...props} />;
  return null;
}
