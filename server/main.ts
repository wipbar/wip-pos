import { Meteor, Subscription } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import "../api/accounts";
import { isUserResponsible } from "../api/accounts";
import Camps from "../api/camps";
import Locations from "../api/locations";
import Products from "../api/products";
import Sales, { ISale } from "../api/sales";
import Stocks from "../api/stocks";
import Styles from "../api/styles";
import "./metrics";
import "./sales";

Meteor.publish("products", async function (this: Subscription) {
  const user = this.userId && (await Meteor.users.findOneAsync(this.userId));

  return Products.find(
    {},
    { fields: user && isUserResponsible(user) ? undefined : { shopPrices: 0 } },
  );
});
Meteor.publish("camps", () => Camps.find({}, { sort: { end: -1 } }));
Meteor.publish(
  "sales",
  async function (this: Subscription, rawOptions?: { from?: Date; to?: Date }) {
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

    const user = this.userId && (await Meteor.users.findOneAsync(this.userId));

    return Sales.find(selector, {
      sort: { timestamp: -1 },
      fields:
        user && isUserResponsible(user)
          ? undefined
          : { "products.shopPrices": 0 },
    });
  },
);
Meteor.publish("styles", () => Styles.find());
Meteor.publish("stocks", () => Stocks.find());
Meteor.publish("locations", () => Locations.find());
