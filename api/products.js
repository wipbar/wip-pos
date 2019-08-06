import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import SimpleSchema from "simpl-schema";

const Products = new Mongo.Collection("products");

Products.attachSchema(
  new SimpleSchema({
    name: { type: String },
  }),
);

if (Meteor.isServer)
  Meteor.startup(() => {
    if (Products.find().count() === 0) {
      Products.insert({ name: "rodut" });
    }
  });

export default Products;
