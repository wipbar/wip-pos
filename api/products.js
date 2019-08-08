import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

const Products = new Mongo.Collection("products");
const addProduct = product => Products.insert(product);
if (Meteor.isServer)
  Meteor.startup(() => {
    Products.remove({});
    if (Products.find().count() === 0) {
      addProduct({
        name: "øl",
        unitPrice: 25,
        unitSize: 500,
        sizeUnit: "ml",
        comment: null,
      });
    }
  });

export default Products;

Meteor.methods({});

if (Meteor.isClient) window.Products = Products;
