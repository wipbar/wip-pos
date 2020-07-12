import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

const Products = new Mongo.Collection("products");
const addProduct = (product) => Products.insert(product);
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
      createdAt: new Date(),
      brandName: newProduct.brandName.trim(),
      name: newProduct.name.trim(),
      salePrice: +newProduct.salePrice.trim(),
      unitSize: +newProduct.unitSize.trim(),
      sizeUnit: newProduct.sizeUnit.trim(),
      abv: +newProduct.abv.trim(),
      tags: newProduct.tags
        .split(",")
        .map((tag) => tag.trim())
        .join(","),
      shopPrices: newProduct.buyPrice
        ? [{ buyPrice: +newProduct.buyPrice.trim(), timestamp: new Date() }]
        : undefined,
    });
  },
  "Products.editProduct"(id, { buyPrice, ...updatedProduct }) {
    if (!this.userId) throw new Meteor.Error("log in please");
    const oldProduct = Products.findOne({ _id: id });
    return Products.update(
      { _id: id },
      {
        $set: {
          ...updatedProduct,
          shopPrices:
            buyPrice && buyPrice.trim()
              ? (oldProduct.shopPrices || []).concat([
                  { buyPrice: +buyPrice.trim(), timestamp: new Date() },
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
