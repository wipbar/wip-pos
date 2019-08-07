import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import Purchases from "./purchases";

const Products = new Mongo.Collection("products");

if (Meteor.isServer)
  Meteor.startup(() => {
    if (Products.find().count() === 0) {
      Products.insert({ name: "rodut" });
    }
  });

export default Products;

Meteor.methods({
  "Products.addProduct"({ product }) {
    Players.update(
      { score: { $gt: 10 } },
      {
        $addToSet: { badges: "Winner" },
      },
      { upsert: true },
    );
  },
  "Products.sellProducts"({ productIds }) {
    const { userId } = this;
    const newPurchase = {
      userId,
      currency: "HAX",
      country: "DK",
      amount: 0,
      timestamp: new Date(),
      products: productIds.map(_id => Products.find({ _id }).fetch()),
    };
    console.log(this, newPurchase);
    return;
    Purchases.insert(newPurchase);
  },
});
if (Meteor.isClient) window.Purchases = Purchases;
