import { Meteor } from "meteor/meteor";
import "../api/accounts";
import Camps from "../api/camps";
import Locations from "../api/locations";
import Products from "../api/products";
import Sales from "../api/sales";
import Stocks from "../api/stocks";
import "./metrics";

Meteor.publish("products", () => Products.find());
Meteor.publish("camps", () => Camps.find({}, { sort: { end: -1 } }));
Meteor.publish("sales", () => Sales.find({}, { sort: { timestamp: -1 } }));
Meteor.publish("stocks", () => Stocks.find());
Meteor.publish("locations", () => Locations.find());
