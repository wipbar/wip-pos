import { Meteor } from "meteor/meteor";
import "../api/links";
import Products from "../api/products";
import Purchases from "../api/purchases";

Meteor.publish("products", () => Products.find());
Meteor.publish("purchases", () => Purchases.find());
