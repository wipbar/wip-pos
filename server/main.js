import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import "../api/accounts";
import Camps from "../api/camps";
import Locations from "../api/locations";
import Products from "../api/products";
import Sales from "../api/sales";
import Stocks from "../api/stocks";

Meteor.publish("products", () => Products.find());
Meteor.publish("camps", () => Camps.find());
Meteor.publish("sales", () => Sales.find());
Meteor.publish("stocks", () => Stocks.find());
Meteor.publish("locations", () => Locations.find());

Meteor.startup(() => {
  const products = Products.find({ removedAt: { $exists: false } }).fetch();
  false &&
    products.forEach((product) => {
      if (
        !product.tags &&
        product.brandName &&
        (product.brandName.toLowerCase().includes("bryg") ||
          product.brandName.toLowerCase().includes("ærø") ||
          product.brandName.toLowerCase().includes("pilsner"))
      ) {
        Products.update(product._id, { $set: { tags: "beer,bottle" } });
        if (product.name.toLowerCase().includes("tap:")) {
          Products.update(product._id, { $set: { tags: "beer,tap" } });
        }
      }
      if (
        !product.tags &&
        product.brandName &&
        product.brandName.toLowerCase().includes("naturfrisk")
      ) {
        Products.update(product._id, { $set: { tags: "soda,bottle" } });
      }
    });
  /*
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
});

if (!Meteor.users.find({}).fetch().length)
  Accounts.createUser({
    username: "admin",
    email: "jonas@klarstrup.dk",
    password: Meteor.settings.ADMINPASS,
  });
