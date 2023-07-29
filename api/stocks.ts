import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

interface IStock {
  _id: string;
  barCode?: string;
  name: string;
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
