import { isPast, isWithinRange, min, subHours } from "date-fns";
import React, { useMemo } from "react";
import Camps from "../api/camps";
import Sales from "../api/sales";
import useMongoFetch from "../hooks/useMongoFetch";
import Fire from "./Fire";

const f = 0.25;
export default function ProductTrend({ product, ...props }) {
  const {
    data: [currentCamp],
  } = useMongoFetch(Camps.find({}, { sort: { end: -1 } }));
  const productSales = useMongoFetch(
    Sales.find(
      {
        products: { $elemMatch: { _id: product._id } },
        timestamp: {
          $gte: isPast(currentCamp?.start)
            ? currentCamp?.start
            : currentCamp?.buildup,
          $lte: currentCamp?.end,
        },
      },
      { sort: { timestamp: 1 } },
    ),
    [product, currentCamp],
  )?.data?.map((sale) => ({
    ...sale,
    products: sale.products.filter(
      (saleProduct) => saleProduct._id === product._id,
    ),
  }));
  const firstSale = productSales[0];

  const averageSalesPerHour = useMemo(
    () =>
      productSales.reduce((memo, sale) => sale.products.length + memo, 0) /
      ((min(currentCamp?.end, new Date()) -
        (firstSale?.timestamp ||
          (isPast(currentCamp?.start)
            ? currentCamp?.start
            : currentCamp?.buildup))) /
        3600000),
    [currentCamp, firstSale, productSales],
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
  console.log({ salesInPastHour, averageSalesPerHour });
  const number = Number(salesInPastHour / (averageSalesPerHour * f)).toFixed(3);
  if (salesInPastHour > 2 && number > 30) return <Fire {...props} />;
  return null;
}
