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
  "Products.addProduct"({ data }) {
    if (!this.userId) throw new Meteor.Error("log in please");
    return Products.insert({
      createdAt: new Date(),
      brandName: data.brandName.trim(),
      name: data.name.trim(),
      salePrice: +data.salePrice.trim(),
      unitSize: +data.unitSize.trim(),
      sizeUnit: data.sizeUnit.trim(),
      abv: +data.abv.trim(),
      tags: data.tags
        .split(",")
        .map((tag) => tag.trim())
        .join(","),
      shopPrices: data.buyPrice
        ? [{ buyPrice: +data.buyPrice.trim(), timestamp: new Date() }]
        : undefined,
    });
  },
  "Products.editProduct"({ productId, data: { buyPrice, ...updatedProduct } }) {
    if (!this.userId) throw new Meteor.Error("log in please");
    const oldProduct = Products.findOne({ _id: productId });
    return Products.update(
      { _id: productId },
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
  "Products.removeProduct"({ productId }) {
    if (!this.userId) throw new Meteor.Error("log in please");
    if (productId)
      return Products.update(
        { _id: productId },
        { $set: { removedAt: new Date() } },
      );
  },
});

if (Meteor.isClient) window.Products = Products;
