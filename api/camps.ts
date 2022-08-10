import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

export interface ICamp {
  name: string;
  slug: string;
  buildup: Date;
  start: Date;
  end: Date;
  teardown: Date;
  color: string;
}

const Camps = new Mongo.Collection<ICamp>("camps");

export default Camps;

// @ts-expect-error
if (Meteor.isClient) window.Camps = Camps;
