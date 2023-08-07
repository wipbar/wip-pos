import convert from "convert";
import { addHours, endOfHour } from "date-fns";
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import type { CartID } from "../ui/PageTend";
import { type Flavor } from "../util";
import { isUserInTeam } from "./accounts";
import Camps, { type ICamp } from "./camps";
import Locations, { type ILocation } from "./locations";
import Products, { type IProduct, type ProductID } from "./products";
import Stocks from "./stocks";

export type SaleID = Flavor<string, "SaleID">;

export interface ISale {
  _id: SaleID;
  userId?: string;
  cartId?: string;
  locationId: string;
  currency?: string;
  country?: string;
  amount: number;
  timestamp: Date;
  products: IProduct[];
}

const Sales = new Mongo.Collection<ISale>("sales");
if (Meteor.isServer) {
  Sales.createIndex({ timestamp: -1 });
}

export const salesMethods = {
  async "Sales.sellProducts"(
    this: Meteor.MethodThisType,
    {
      locationSlug,
      cartId,
      productIds,
    }: {
      locationSlug: ILocation["slug"];
      cartId: CartID;
      productIds: ProductID[];
    },
  ) {
    if (this.isSimulation) return;
    if (!locationSlug || !productIds) throw new Meteor.Error("misisng");
    const { userId } = this;
    if (!userId) throw new Meteor.Error("log in please");
    const location = Locations.findOne({ slug: locationSlug });
    if (!location) throw new Meteor.Error("invalid location");

    if (!isUserInTeam(userId, location.teamName))
      throw new Meteor.Error("Wait that's illegal");

    const existingSale = Sales.findOne({ cartId });
    if (existingSale) throw new Meteor.Error("Cart already sold");

    const insertResult = Sales.insert({
      userId: userId!,
      locationId: location!._id,
      cartId,
      currency: "HAX",
      country: "DK",
      amount: productIds.reduce(
        (m: number, _id) => m + Number(Products.findOne({ _id })?.salePrice),
        0,
      ),
      timestamp: new Date(),
      products: productIds.map((_id) => Products.findOne({ _id })!),
    });

    try {
      for (const _id of productIds) {
        const product = Products.findOne({ _id });
        if (!product) continue;

        for (const component of product.components ?? []) {
          const stock = Stocks.findOne({ _id: component.stockId });
          if (!stock) continue;
          if (!component.unitSize) continue;
          if (!component.sizeUnit) continue;
          if (!stock.unitSize) continue;
          if (!stock.sizeUnit) continue;
          if (!stock.approxCount) continue;

          const componentInStockSize =
            component.sizeUnit !== stock.sizeUnit &&
            component.sizeUnit !== "pc" &&
            stock.sizeUnit !== "pc" &&
            component.sizeUnit !== "g" &&
            stock.sizeUnit !== "g"
              ? convert(+component.unitSize, component.sizeUnit).to(
                  stock.sizeUnit,
                )
              : component.sizeUnit === "g" && stock.sizeUnit === "g"
              ? convert(+component.unitSize, component.sizeUnit).to(
                  stock.sizeUnit,
                )
              : Number(component.unitSize);

          const newApproxCount =
            (stock.approxCount * Number(stock.unitSize) -
              componentInStockSize) /
            Number(stock.unitSize);
          if (!Number.isNaN(newApproxCount)) {
            Stocks.update(component.stockId, {
              $set: { approxCount: newApproxCount },
            });
          }
        }
      }
    } catch (e) {
      console.error("Failed to update stocks after sale", e);
    }

    return insertResult;
  },

  async "Sales.stats.CampByCamp"(this: Meteor.MethodThisType) {
    this.unblock();
    if (this.isSimulation) return;

    return statsCampByCamp;
  },
} as const;

let statsCampByCamp: Awaited<
  ReturnType<typeof calculateCampByCampStats>
> | null = null;
if (Meteor.isServer) {
  Meteor.startup(async () => {
    console.log("Startup statsing");
    statsCampByCamp = await calculateCampByCampStats();
  });

  /*
  setInterval(async () => {
    statsCampByCamp = await calculateCampByCampStats();
  }, 240000);
  */
}

async function calculateCampByCampStats() {
  const now = new Date();

  const offset = -6;
  const camps = await Camps.find({}, { sort: { start: 1 } }).fetchAsync();

  const sales = await Sales.find().fetchAsync();

  const now2 = new Date();

  const longestCamp = camps.reduce<ICamp | null>((memo, camp) => {
    if (!memo) {
      memo = camp;
    } else {
      if (
        Number(camp.end) - Number(camp.start) >
        Number(memo.end) - Number(memo.start)
      )
        memo = camp;
    }
    return memo;
  }, null);

  const longestCampHours = longestCamp
    ? Math.ceil(
        (Number(longestCamp.end) - Number(longestCamp.start)) / (3600 * 1000),
      )
    : 0;

  const data = [];
  const campTotals: Record<string, number> = {};
  for (let i = 0; i < longestCampHours; i++) {
    const datapoint: { hour: number; [key: string]: number } = { hour: i };

    for (const camp of camps) {
      const campStart = Number(addHours(camp.start, i + offset));
      const campEnd = Number(endOfHour(addHours(camp.start, i + offset)));
      const slug = camp.slug;

      let count = 0;
      for (const sale of sales) {
        const timestamp = Number(sale.timestamp);

        if (timestamp >= campStart && timestamp < campEnd) count += sale.amount;
      }

      if (count) {
        campTotals[slug] = datapoint[slug] = (campTotals[slug] || 0) + count;
      }
    }

    data.push(datapoint);
  }
  const now3 = new Date();

  console.log(
    `Sales.stats.CampByCamp: ${(now3.getTime() - now.getTime()) / 1000}s,(${
      (now2.getTime() - now.getTime()) / 1000
    }s fetch, ${(now3.getTime() - now2.getTime()) / 1000}s calc)`,
  );

  return { data };
}

Meteor.methods(salesMethods);

export default Sales;

//@ts-expect-error
if (Meteor.isClient) window.Sales = Sales;
