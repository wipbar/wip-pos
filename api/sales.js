import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { isUserInTeam } from "./accounts";
import Locations from "./locations";
import Products from "./products";

const Sales = new Mongo.Collection("sales");

if (Meteor.isServer)
  Meteor.startup(() => {
    if (Sales.find().count() === 0) {
      Sales.insert({ products: [{ _id: "blahh", name: "some rodut" }] });
    }
    if (Sales.find({ locationId: { $exists: 0 } }).count()) {
      console.log(
        "Setting any Sale without locationId's locationId to the bar.",
      );
      Sales.update(
        { locationId: { $exists: 0 } },
        { $set: { locationId: Locations.findOne({ slug: "bar" })._id } },
        { multi: true },
      );
    }
  });

Meteor.methods({
  "Sales.sellProducts"({ locationSlug, productIds }) {
    if (!locationSlug || !productIds) throw new Meteor.Error("misisng");
    const { userId } = this;
    if (!userId) throw new Meteor.Error("log in please");
    const location = Locations.findOne({ slug: locationSlug });
    if (!location) throw new Meteor.Error("invalid location");

    if (!isUserInTeam(userId, location.teamName))
      throw new Meteor.Error("Wait that's illegal");

    const newSale = {
      userId,
      locationId: location._id,
      currency: "HAX",
      country: "DK",
      amount: productIds.reduce(
        (m, _id) => m + +Products.findOne({ _id }).salePrice,
        0,
      ),
      timestamp: new Date(),
      products: productIds.map((_id) => Products.findOne({ _id })),
    };
    return Sales.insert(newSale);
  },
});

export default Sales;

if (Meteor.isClient) window.Sales = Sales;
