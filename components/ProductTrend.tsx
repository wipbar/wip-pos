import { isPast, isWithinRange, min, subHours } from "date-fns";
import { useTracker } from "meteor/react-meteor-data";
import React, { ComponentProps, useMemo } from "react";
import type { IProduct } from "../api/products";
import Sales from "../api/sales";
import useCurrentCamp from "../hooks/useCurrentCamp";
import Fire from "./Fire";
import useCurrentDate from "/hooks/useCurrentDate";
import useSubscription from "/hooks/useSubscription";

const f = 0.25;
export default function ProductTrend({
  product,
  ...props
}: {
  product: IProduct;
} & ComponentProps<typeof Fire>) {
  const currentCamp = useCurrentCamp();
  const currentDate = useCurrentDate();

  useSubscription(
    currentCamp ? "sales" : false,
    useMemo(
      () =>
        currentCamp && {
          from: isPast(currentCamp.start)
            ? currentCamp.start
            : currentCamp.buildup,
          to: currentCamp.end,
        },
      [currentCamp],
    ),
  );
  const data = useTracker(
    () =>
      currentCamp
        ? Sales.find(
            {
              products: { $elemMatch: { _id: product._id } },
              timestamp: {
                $gte: isPast(currentCamp.start)
                  ? currentCamp.start
                  : currentCamp.buildup,
                $lte: currentCamp.end,
              },
            },
            { sort: { timestamp: 1 } },
          ).fetch()
        : [],
    [product._id, currentCamp],
  );
  const productSales = useMemo(
    () =>
      data?.map((sale) => ({
        ...sale,
        products: sale.products.filter(
          (saleProduct) => saleProduct._id === product._id,
        ),
      })),
    [data, product._id],
  );
  const firstSale = productSales[0];

  const averageSalesPerHour = useMemo(
    () =>
      currentCamp && firstSale
        ? productSales.reduce((memo, sale) => sale.products.length + memo, 0) /
          ((Number(min(currentCamp.end, currentDate)) -
            Number(
              firstSale.timestamp ||
                (isPast(currentCamp.start)
                  ? currentCamp.start
                  : currentCamp.buildup),
            )) /
            3600000)
        : 0,
    [currentCamp, currentDate, firstSale, productSales],
  );
  const salesInPastHour = useMemo(
    () =>
      productSales
        .filter((sale) =>
          isWithinRange(sale.timestamp, subHours(currentDate, 2), currentDate),
        )
        .reduce((memo, sale) => sale.products.length + memo, 0),
    [currentDate, productSales],
  );

  const number = Number(
    Number(salesInPastHour / (averageSalesPerHour * f)).toFixed(3),
  );

  if (salesInPastHour > 2 && number > 30) return <Fire {...props} />;

  return null;
}
