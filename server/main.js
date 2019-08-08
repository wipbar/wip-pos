import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import Products from "../api/products";
import Sales from "../api/sales";
import Stocks from "../api/stocks";

Meteor.publish("products", () => Products.find());
Meteor.publish("sales", () => Sales.find());
Meteor.publish("stocks", () => Stocks.find());

if (!Meteor.users.length)
  Accounts.createUser({
    username: "admin",
    email: "jonas@klarstrup.dk",
    password: Meteor.settings.ADMINPASS,
  });
