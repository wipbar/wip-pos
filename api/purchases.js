import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

const Purchases = new Mongo.Collection("purchases");

if (Meteor.isServer)
  Meteor.startup(() => {
    if (Purchases.find().count() === 0) {
      Purchases.insert({ products: [{ _id: "blahh", name: "some rodut" }] });
    }
  });

export default Purchases;
