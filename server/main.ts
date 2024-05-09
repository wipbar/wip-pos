import { Meteor, Subscription } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import "../api/accounts";
import { isUserResponsible } from "../api/accounts";
import Camps from "../api/camps";
import Locations from "../api/locations";
import Products from "../api/products";
import Sales, { ISale } from "../api/sales";
import Stocks from "../api/stocks";
import "./metrics";
import "./sales";

Meteor.publish("products", function (this: Subscription) {
  return Products.find(
    {},
    { fields: isUserResponsible(this.userId) ? undefined : { shopPrices: 0 } },
  );
});
Meteor.publish("camps", () => Camps.find({}, { sort: { end: -1 } }));
Meteor.publish("sales", function (this: Subscription, rawOptions) {
  const { from, to } = rawOptions || {};
  let selector: Mongo.Selector<ISale> = {};

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

  return Sales.find(selector, {
    sort: { timestamp: -1 },
    fields: isUserResponsible(this.userId)
      ? undefined
      : { "products.shopPrices": 0 },
  });
});
Meteor.publish("stocks", () => Stocks.find());
Meteor.publish("locations", () => Locations.find());
