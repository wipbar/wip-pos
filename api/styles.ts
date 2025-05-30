import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { CSSProperties } from "react";

export interface IStyle {
  page: string;
  style: Partial<CSSProperties>;
}

const Styles = new Mongo.Collection<IStyle>("styles");

if (Meteor.isServer) {
  Meteor.startup(async () => {
    if ((await Styles.find().countAsync()) === 0) {
      await Styles.insertAsync({ page: "menu", style: {} });
      await Styles.insertAsync({ page: "stats", style: {} });
    }
  });
}
export default Styles;

// @ts-expect-error
if (Meteor.isClient) window.Styles = Styles;
