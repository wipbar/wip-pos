import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import Products from "../api/products";
import Sales from "../api/sales";
import Stocks from "../api/stocks";

Meteor.publish("products", () => Products.find());
Meteor.publish("sales", () => Sales.find());
Meteor.publish("stocks", () => Stocks.find());

Accounts.config({ forbidClientAccountCreation: true });
/*
const products = Products.find({ removedAt: { $exists: false } }).fetch();
const sales = Sales.find({}).fetch();
sales.forEach(sale => {
  Sales.update(
    { _id: sale._id },
    {
      $set: {
        products: sale.products.map(sP => {
          const currentProduct = products.find(cP => cP._id === sP._id);
          return {
            ...sP, 
            brandName: currentProduct ? currentProduct.brandName : sP.brandName,
            name: currentProduct ? currentProduct.name : sP.name,
          };
        }),
      },
    },
  );
});
*/

if (!Meteor.users.find({}).fetch().length)
  Accounts.createUser({
    username: "admin",
    email: "jonas@klarstrup.dk",
    password: Meteor.settings.ADMINPASS,
  });
