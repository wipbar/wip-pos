import { isPast, isWithinRange, min, subHours } from "date-fns";
import React, { ComponentProps, useMemo } from "react";
import type { IProduct } from "../api/products";
import Sales from "../api/sales";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useMongoFetch from "../hooks/useMongoFetch";
import Fire from "./Fire";

const f = 0.25;
export default function ProductTrend({
  product,
  ...props
}: {
  product: IProduct;
} & ComponentProps<typeof Fire>) {
  const currentCamp = useCurrentCamp();

  const { data } = useMongoFetch(
    currentCamp &&
      Sales.find(
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
      ),
    [product, currentCamp],
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
          ((Number(min(currentCamp.end, new Date())) -
            Number(
              firstSale.timestamp ||
                (isPast(currentCamp.start)
                  ? currentCamp.start
                  : currentCamp.buildup),
            )) /
            3600000)
        : 0,
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

  const number = Number(
    Number(salesInPastHour / (averageSalesPerHour * f)).toFixed(3),
  );

  if (salesInPastHour > 2 && number > 30) return <Fire {...props} />;

  return null;
}
