import { Meteor } from "meteor/meteor";
import "../api/links";
import Products from "../api/products";
import Sales from "../api/sales";
import Stocks from "../api/stocks";

Meteor.publish("products", () => Products.find());
Meteor.publish("sales", () => Sales.find());
Meteor.publish("stocks", () => Stocks.find());
