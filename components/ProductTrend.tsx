import { isWithinRange, min, subHours } from "date-fns";
import { sumBy } from "lodash";
import { useFind } from "meteor/react-meteor-data";
import React, { ComponentProps, useMemo } from "react";
import type { IProduct } from "../api/products";
import Sales from "../api/sales";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentDate from "../hooks/useCurrentDate";
import useSubscription from "../hooks/useSubscription";
import Fire from "./Fire";

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
    currentCamp && "sales",
      currentCamp && {
        from: currentCamp.buildup,
        to: currentCamp.teardown,
      },
    [currentCamp],
  );
  const data = useFind(
    () =>
      Sales.find(
        {
          products: { $elemMatch: { _id: product._id } },
          timestamp: currentCamp && {
            $gte: currentCamp.buildup,
            $lte: currentCamp.teardown,
          },
        },
        { sort: { timestamp: 1 } },
      ),
    [currentCamp, product._id],
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
        ? sumBy(productSales, (sale) => sale.products.length) /
          ((Number(min(currentCamp.teardown, currentDate)) -
            Number(firstSale.timestamp || currentCamp.buildup)) /
            3600000)
        : 0,
    [currentCamp, currentDate, firstSale, productSales],
  );
  const salesInPastHour = useMemo(
    () =>
      sumBy(
        productSales.filter((sale) =>
          isWithinRange(sale.timestamp, subHours(currentDate, 2), currentDate),
        ),
        (sale) => sale.products.length,
      ),
    [currentDate, productSales],
  );

  const number = Number(
    (salesInPastHour / (averageSalesPerHour * f)).toFixed(3),
  );

  if (salesInPastHour > 2 && number > 30) return <Fire {...props} />;

  return null;
}
