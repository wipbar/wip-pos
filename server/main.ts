import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import "../api/accounts";
import Camps from "../api/camps";
import Locations from "../api/locations";
import Products from "../api/products";
import Sales, { ISale } from "../api/sales";
import Stocks from "../api/stocks";
import "./metrics";

Meteor.publish("products", () => Products.find());
Meteor.publish("camps", () => Camps.find({}, { sort: { end: -1 } }));
Meteor.publish("sales", ({ from, to }) => {
  let selector: Mongo.Selector<ISale> = {};
  console.log({ to, from });
  if (from) {
    selector = {
      ...selector,
      timestamp: { ...selector.timestamp, $gte: from },
    };
  }
  if (to) {
    selector = {
      ...selector,
      timestamp: { ...selector.timestamp, $lte: to },
    };
  }

  return Sales.find(selector, { sort: { timestamp: -1 } });
});
Meteor.publish("stocks", () => Stocks.find());
Meteor.publish("locations", () => Locations.find());
