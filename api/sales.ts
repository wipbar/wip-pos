import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { isUserInTeam } from "./accounts";
import Locations, { ILocation } from "./locations";
import Products, { IProduct, ProductID } from "./products";
import { Flavor } from "/util";

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

Meteor.methods({
  "Sales.sellProducts"({
    locationSlug,
    productIds,
  }: {
    locationSlug: ILocation["slug"];
    productIds: ProductID[];
  }) {
    if (this.isSimulation) return;
    if (!locationSlug || !productIds) throw new Meteor.Error("misisng");
    const { userId } = this;
    if (!userId) throw new Meteor.Error("log in please");
    const location = Locations.findOne({ slug: locationSlug });
    if (!location) throw new Meteor.Error("invalid location");

    if (!isUserInTeam(userId, location.teamName))
      throw new Meteor.Error("Wait that's illegal");

    return Sales.insert({
      userId,
      locationId: location._id,
      currency: "HAX",
      country: "DK",
      amount: productIds.reduce(
        (m: number, _id) => m + Number(Products.findOne({ _id })?.salePrice),
        0,
      ),
      timestamp: new Date(),
      products: productIds.map((_id) => Products.findOne({ _id })!),
    });
  },
});

export default Sales;

//@ts-expect-error
if (Meteor.isClient) window.Sales = Sales;
