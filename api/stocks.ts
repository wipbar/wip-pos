import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import Products from "./products";

const Stocks = new Mongo.Collection("stocks");

if (Meteor.isServer)
  Meteor.startup(() => {
    Stocks.remove({});
    if (Stocks.find().count() === 0) {
      Stocks.insert({
        productId: (Products.findOne() || {})._id,
        amount: 12,
      });
    }
  });

export default Stocks;

Meteor.methods({});

// @ts-expect-error
if (Meteor.isClient) window.Stocks = Stocks;
