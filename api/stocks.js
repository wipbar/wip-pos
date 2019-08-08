import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import Products from "./products";

const Stocks = new Mongo.Collection("stocks");
const addStock = stock => Stocks.insert(stock);
if (Meteor.isServer)
  Meteor.startup(() => {
    Stocks.remove({});
    if (Stocks.find().count() === 0) {
      addStock({
        productId: (Products.findOne() || {})._id,
        amount: 12,
      });
    }
    console.log(Products.find({}).fetch());
    console.log(Stocks.find({}).fetch());
  });

export default Stocks;

Meteor.methods({});

if (Meteor.isClient) window.Stocks = Stocks;
