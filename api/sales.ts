import convert from "convert";
import { differenceInHours } from "date-fns";
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

  async "Sales.stats.GoodbyeWorld"(
    this: Meteor.MethodThisType,
    { campSlug }: { campSlug: ICamp["slug"] },
  ) {
    this.unblock();
    if (this.isSimulation) return;

    const [currentCamp] = await Camps.find({ slug: campSlug }).fetchAsync();

    if (!currentCamp) throw new Meteor.Error("Camp not found");

    const campSales =
      (currentCamp
        ? await Sales.find({
            timestamp: {
              $gte: currentCamp.buildup,
              $lte: currentCamp.teardown,
            },
          }).fetchAsync()
        : undefined) || [];

    const productsSold = campSales.map(({ products }) => products).flat();

    return `${campSales.reduce(
      (revenue, { amount }) => revenue + amount,
      0,
    )} ʜᴀx revenue
  ${productsSold.length} items sold
  ${campSales.length} discrete transactions
  ${Math.round(
    productsSold
      .filter(({ tags }) => tags?.includes("beer"))
      .reduce(
        (totalLiters, { unitSize, sizeUnit }) =>
          unitSize && sizeUnit === "cl"
            ? totalLiters + Number(unitSize) / 100
            : totalLiters,
        0,
      ),
  )} liters of beer
  ${Math.round(
    productsSold
      .filter(
        ({ brandName }) => brandName === "Club Mate" || brandName === "Mio Mio",
      )
      .reduce(
        (totalLiters, { unitSize, sizeUnit }) =>
          unitSize && sizeUnit === "cl"
            ? totalLiters + Number(unitSize) / 100
            : totalLiters,
        0,
      ),
  )} liters of mate
  ${
    productsSold.filter(({ tags }) => tags?.includes("cocktail")).length
  } cocktails
  ${
    productsSold.filter(({ name }) => name.includes("Tsunami")).length
  } tsunamis`;
  },
} as const;

let statsCampByCamp: Awaited<
  ReturnType<typeof calculateCampByCampStats>
> | null = null;
if (Meteor.isServer) {
  Meteor.startup(async () => {
    console.log("Startup statsing");
    statsCampByCamp = await calculateCampByCampStats();

    setInterval(
      async () => {
        statsCampByCamp = await calculateCampByCampStats();
      },
      (3600 * 1000) / 6,
    );
  });
}

const HOUR_IN_MS = 3600 * 1000;
const offset = -6;
async function calculateCampByCampStats() {
  const now = new Date();

  const camps = (await Camps.find(
    {},
    { sort: { start: 1 }, fields: { slug: 1, start: 1, end: 1 } },
  ).fetchAsync()) as Pick<ICamp, "slug" | "start" | "end">[];

  const sales = (await Sales.find(
    {},
    { fields: { timestamp: 1, amount: 1 } },
  ).fetchAsync()) as Pick<ISale, "_id" | "amount" | "timestamp">[];

  const now2 = new Date();

  const longestCamp = camps.reduce<Pick<
    ICamp,
    "slug" | "start" | "end"
  > | null>((memo, camp) => {
    if (!memo) return camp;

    if (
      Number(camp.end) - Number(camp.start) >
      Number(memo.end) - Number(memo.start)
    ) {
      memo = camp;
    }
    return memo;
  }, null);

  const longestCampHours = longestCamp
    ? differenceInHours(longestCamp.end, longestCamp.start)
    : 0;

  const data: { [key: string]: number; hour: number }[] = [];
  const campTotals: Record<string, number> = {};
  for (let i = 0; i < longestCampHours; i++) {
    const datapoint: (typeof data)[number] = { hour: i };

    for (const { slug, start } of camps) {
      const hourStart = Number(start) + (i + offset) * HOUR_IN_MS;
      const hourEnd = hourStart + HOUR_IN_MS;

      let count = 0;
      for (const { timestamp, amount } of sales) {
        const ts = Number(timestamp);

        if (ts >= hourStart && ts < hourEnd) count += amount;
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
