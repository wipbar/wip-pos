import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { CSSProperties } from "react";

export interface IStyle {
  page: string;
  style: Partial<CSSProperties>;
}

const Styles = new Mongo.Collection<IStyle>("styles");

if (Meteor.isServer) {
  Meteor.startup(() => {
    if (Styles.find().count() === 0) {
      Styles.insert({ page: "menu", style: {} });
      Styles.insert({ page: "stats", style: {} });
    }
  });
}
export default Styles;

// @ts-expect-error
if (Meteor.isClient) window.Styles = Styles;
