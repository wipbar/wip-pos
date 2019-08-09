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
      brandName: newProduct.brandName,
      name: newProduct.name,
      salePrice: +newProduct.salePrice,
      unitSize: +newProduct.unitSize,
      sizeUnit: newProduct.sizeUnit,
      shopPrices: newProduct.buyPrice
        ? [{ buyPrice: +newProduct.buyPrice, timestamp: new Date() }]
        : undefined,
    });
  },
  "Products.editProduct"(id, { salePrice, ...updatedProduct }) {
    if (!this.userId) throw new Meteor.Error("log in please");
    const oldProduct = Products.findOne({ _id: id });
    return Products.update(
      { _id: id },
      {
        $set: {
          ...updatedProduct,
          shopPrices: salePrice
            ? (oldProduct.shopPrices || []).concat([
                { buyPrice: +salePrice, timestamp: new Date() },
              ])
            : undefined,
        },
      },
    );
  },
  "Products.removeProduct"(productId) {
    if (!this.userId) throw new Meteor.Error("log in please");
    if (productId)
      return Products.update(
        { _id: productId },
        { $set: { removedAt: new Date() } },
      );
  },
});

if (Meteor.isClient) window.Products = Products;
