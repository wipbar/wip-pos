import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import Products from "../api/products";
import Sales from "../api/sales";
import Stocks from "../api/stocks";
import { Bornhack } from "../api/accounts";
import httpProxy from "http-proxy";

if (Meteor.isDevelopment)
  Meteor.startup(() => {
    httpProxy
      .createProxyServer({
        ssl: {
          key: Assets.getText("server.key"),
          cert: Assets.getText("server.crt"),
        },
        target: "http://localhost:3000",
        ws: true,
        xfwd: true,
      })
      .listen(3100);
  });

Meteor.publish("products", () => Products.find());
Meteor.publish("sales", () => Sales.find());
Meteor.publish("stocks", () => Stocks.find());

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
        Products.update(
          { _id: product._id },
          { $set: { tags: "beer,bottle" } },
        );
        if (product.name.toLowerCase().includes("tap:")) {
          Products.update({ _id: product._id }, { $set: { tags: "beer,tap" } });
        }
      }
      if (
        !product.tags &&
        product.brandName &&
        product.brandName.toLowerCase().includes("naturfrisk")
      ) {
        Products.update(
          { _id: product._id },
          { $set: { tags: "soda,bottle" } },
        );
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
