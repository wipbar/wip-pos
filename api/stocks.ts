import { convert } from "convert";
import { isBefore, subDays } from "date-fns";
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { PackageTypeCode } from "../data";
import { Flavor, SizeUnit } from "../util";
import { assertUserInAnyTeam } from "./accounts";
import type { ICamp } from "./camps";
import type { IProduct } from "./products";
import type { ISale } from "./sales";

export type StockID = Flavor<string, "StockID">;

export interface IStock {
  _id: StockID;
  createdAt: Date;
  updatedAt?: Date;
  removedAt?: Date;
  barCode?: string;
  name: string;
  packageType: PackageTypeCode | null;
  unitSize: number;
  sizeUnit: SizeUnit;
  approxCount: null | number;
  levels?: {
    count: number;
    timestamp: Date;
  }[];
}

const Stocks = new Mongo.Collection<IStock>("stocks");

export default Stocks;

export const stocksMethods = {
  async "Stock.addStock"(
    this: Meteor.MethodThisType,
    {
      data,
    }: {
      data: Pick<
        IStock,
        "barCode" | "name" | "packageType" | "sizeUnit" | "unitSize"
      >;
    },
  ) {
    const user =
      (this.userId && (await Meteor.users.findOneAsync(this.userId))) || null;
    await assertUserInAnyTeam(user);

    const createdAt = new Date();
    return Stocks.insertAsync({
      createdAt,
      updatedAt: createdAt,
      approxCount: null,
      ...data,
    });
  },
  async "Stock.editStock"(
    this: Meteor.MethodThisType,
    {
      stockId,
      data: updatedStock,
    }: {
      stockId: StockID;
      data: Partial<IStock>;
    },
  ) {
    const user =
      (this.userId && (await Meteor.users.findOneAsync(this.userId))) || null;
    await assertUserInAnyTeam(user);

    const updatedAt = new Date();
    return await Stocks.updateAsync(stockId, {
      $set: { ...updatedStock, updatedAt },
    });
  },
  async "Stock.takeStock"(
    this: Meteor.MethodThisType,
    { stockId, count }: { stockId: StockID; count: number },
  ) {
    const user =
      (this.userId && (await Meteor.users.findOneAsync(this.userId))) || null;
    await assertUserInAnyTeam(user);

    if (stockId) {
      const updatedAt = new Date();
      return await Stocks.updateAsync(stockId, {
        $set: { approxCount: count, updatedAt },
        $push: { levels: { count, timestamp: new Date() } },
      });
    }
  },
  async "Stock.removeStock"(
    this: Meteor.MethodThisType,
    { stockId }: { stockId: StockID },
  ) {
    const user =
      (this.userId && (await Meteor.users.findOneAsync(this.userId))) || null;
    await assertUserInAnyTeam(user);

    if (stockId)
      return await Stocks.updateAsync(stockId, {
        $set: { removedAt: new Date() },
      });
  },
} as const;

Meteor.methods(stocksMethods);

// @ts-expect-error
if (Meteor.isClient) window.Stocks = Stocks;

export const getStockLevelAtStartOfCamp = (camp: ICamp, stock: IStock) => {
  return (
    Array.from(stock.levels || [])
      .sort(
        (a, b) =>
          Math.abs(camp.start.valueOf() - a.timestamp.valueOf()) -
          Math.abs(camp.start.valueOf() - b.timestamp.valueOf()),
      )
      .at(0)?.count || NaN
  );
};

export const getMaxStockLevelEver = (stock: IStock) => {
  const levels = stock.levels?.map((level) => level.count) || [];
  return Math.max(...levels);
};

export const getStockLevelAtTime = (
  sales: ISale[],
  stock: IStock,
  timestamp: Date,
) => {
  if (isBefore(new Date(), timestamp)) return NaN;
  const precedingLevel = stock.levels
    ?.filter(
      (level) =>
        level.timestamp <= timestamp &&
        isBefore(subDays(new Date(), 14), new Date(level.timestamp)),
    )
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

  if (!precedingLevel) {
    return NaN;
  }

  const amountSoldSinceMostRecentLevel = sales.reduce(
    (memo, sale) =>
      sale.timestamp > precedingLevel.timestamp && sale.timestamp <= timestamp
        ? memo +
          sale.products.reduce(
            (productMemo, product) =>
              productMemo +
              (product.components
                ?.filter((c) => c.stockId === stock._id)
                .reduce((compMemo, component) => {
                  try {
                    return (
                      compMemo +
                      convert(component.unitSize, component.sizeUnit).to(
                        stock.sizeUnit,
                      ) /
                        stock.unitSize
                    );
                  } catch {
                    /* 
                      console.error(e);
                      console.log({
                        component,
                        stock,
                      });
                      */
                  }
                  return compMemo;
                }, 0) || 0),
            0,
          )
        : memo,
    0,
  );

  const amountAtMostRecentLevel = precedingLevel.count;
  const remainingStock =
    amountAtMostRecentLevel - amountSoldSinceMostRecentLevel;

  return remainingStock;
};

export function getRemainingServings(
  sales: ISale[],
  stocks: IStock[],
  product: IProduct,
  timestamp?: Date,
) {
  let minServings;
  for (const component of product.components || []) {
    const stock = stocks.find((stock) => stock._id === component.stockId);
    if (
      !stock ||
      stock.approxCount === null ||
      stock.approxCount === undefined
    ) {
      continue;
    }

    try {
      const componentServings =
        convert(
          (timestamp
            ? getStockLevelAtTime(sales, stock, timestamp)
            : stock.approxCount) * stock.unitSize,
          stock.sizeUnit,
        ).to(component.sizeUnit) / component.unitSize;

      if (minServings === undefined || componentServings < minServings) {
        minServings = componentServings;
      }
    } catch {
      continue;
    }
  }

  if (minServings === undefined) {
    return NaN;
  }

  return minServings;
}
export function getApproxRemainingServings(
  stocks: IStock[],
  product: IProduct,
) {
  let minServings;
  for (const component of product.components || []) {
    const stock = stocks.find((stock) => stock._id === component.stockId);
    if (
      !stock ||
      stock.approxCount === null ||
      stock.approxCount === undefined
    ) {
      continue;
    }

    try {
      const componentServings =
        convert(stock.approxCount ?? NaN, stock.sizeUnit).to(
          component.sizeUnit,
        ) / component.unitSize;

      if (minServings === undefined || componentServings < minServings) {
        minServings = componentServings;
      }
    } catch {
      continue;
    }
  }

  if (minServings === undefined) {
    return NaN;
  }

  return minServings;
}
export function getRemainingServingsEver(
  camp: ICamp,
  stocks: IStock[],
  product: IProduct,
) {
  let minServings;
  for (const component of product.components || []) {
    const stock = stocks.find((stock) => stock._id === component.stockId);
    if (
      !stock ||
      stock.approxCount === null ||
      stock.approxCount === undefined
    ) {
      continue;
    }

    try {
      const componentServings =
        convert(
          getStockLevelAtStartOfCamp(camp, stock) * stock.unitSize,
          stock.sizeUnit,
        ).to(component.sizeUnit) / component.unitSize;

      if (minServings === undefined || componentServings < minServings) {
        minServings = componentServings;
      }
    } catch {
      continue;
    }
  }

  if (minServings === undefined) {
    return NaN;
  }

  return Math.max(0, minServings);
}
export function getServingsSold(
  sales: ISale[],
  stock: IStock,
  // products: IProduct[],
) {
  let totalServingsSold = 0;

  for (const sale of sales) {
    for (const product of sale.products) {
      // TODO/OPTIONAL: Get the product from the products list instead of the sale, so that we can get the components from the product in the database, not the one in the sale (which may be outdated)
      // on the other hand, this may be a good thing, because it reflects the product at the time of the sale, not the current product (which may have changed since then)
      for (const component of product.components || []) {
        if (component.stockId === stock._id) {
          try {
            const servingsSold =
              convert(component.unitSize, component.sizeUnit).to(
                stock.sizeUnit,
              ) / stock.unitSize;
            totalServingsSold += servingsSold;
          } catch {
            continue;
          }
        }
      }
    }
  }

  return totalServingsSold;
}
