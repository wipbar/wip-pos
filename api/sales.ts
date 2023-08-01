import convert from "convert";
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { Flavor } from "../util";
import { isUserInTeam } from "./accounts";
import Locations, { ILocation } from "./locations";
import Products, { IProduct, ProductID } from "./products";
import Stocks from "./stocks";

export type SaleID = Flavor<string, "SaleID">;

export interface ISale {
  _id: SaleID;
  userId?: string;
  locationId: string;
  currency?: string;
  country?: string;
  amount: number;
  timestamp: Date;
  products: IProduct[];
}

const Sales = new Mongo.Collection<ISale>("sales");

export const salesMethods = {
  async "Sales.sellProducts"(
    this: Meteor.MethodThisType,
    {
      locationSlug,
      productIds,
    }: {
      locationSlug: ILocation["slug"];
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

    const insertResult = Sales.insert({
      userId: userId!,
      locationId: location!._id,
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
              ? convert(component.unitSize, component.sizeUnit).to(
                  stock.sizeUnit,
                )
              : component.sizeUnit === "g" && stock.sizeUnit === "g"
              ? convert(component.unitSize, component.sizeUnit).to(
                  stock.sizeUnit,
                )
              : Number(component.unitSize);

          console.log({ component, stock, componentInStockSize });
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
} as const;

Meteor.methods(salesMethods);

export default Sales;

//@ts-expect-error
if (Meteor.isClient) window.Sales = Sales;
