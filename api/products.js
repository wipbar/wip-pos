import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

const Products = new Mongo.Collection("products");
const addProduct = product => Products.insert(product);
if (Meteor.isServer)
  Meteor.startup(() => {
    if (Products.find().count() === 0) {
      addProduct({
        name: "øl",
        salePrice: 25,
        unitSize: 500,
        sizeUnit: "ml",
        shopPrices: [{ buyPrice: 10, timestamp: new Date() }],
      });
    }
  });

export default Products;

Meteor.methods({
  "Products.addProduct"(newProduct) {
    if (!this.userId) throw new Meteor.Error("log in please");
    return Products.insert({
      name: newProduct.name,
      salePrice: +newProduct.salePrice,
      unitSize: +newProduct.unitSize,
      sizeUnit: newProduct.sizeUnit,
      shopPrices: [{ buyPrice: +newProduct.buyPrice, timestamp: new Date() }],
    });
  },
  "Products.removeProduct"(productId) {
    if (productId)
      return Products.update(
        { _id: productId },
        { $set: { removedAt: new Date() } },
      );
  },
});

if (Meteor.isClient) window.Products = Products;
