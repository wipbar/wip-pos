import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { Flavor } from "/util";

export type StockID = Flavor<string, "StockID">;

interface IStock {
  _id: StockID;
  barCode?: string;
  name: string;
  unit: string;
  approxCount: null | number;
  levels: {
    count: number;
    timestamp: Date;
  }[];
}

const Stocks = new Mongo.Collection<IStock>("stocks");

if (Meteor.isServer)
  Meteor.startup(() => {
    Stocks.remove({});
    if (Stocks.find().count() === 0) {
      // Nothing yet
    }
  });

export default Stocks;

Meteor.methods({});

// @ts-expect-error
if (Meteor.isClient) window.Stocks = Stocks;
