import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { Flavor } from "../util";
import { isUserInTeam } from "./accounts";

export type LocationID = Flavor<string, "LocationID">;

export interface ILocation {
  _id: LocationID;
  slug: string;
  name: string;
  teamName: string;
  curfew?: boolean;
  closed?: boolean;
}

const Locations = new Mongo.Collection<ILocation>("locations");

if (Meteor.isServer) {
  Meteor.startup(async () => {
    if ((await Locations.find().countAsync()) === 0) {
      await Locations.insertAsync({
        slug: "bar",
        name: "WIP Bar",
        teamName: "Bar",
      });
      await Locations.insertAsync({
        slug: "info",
        name: "Infodesk",
        teamName: "Info",
      });
    }
  });
}
export default Locations;

export const locationMethods = {
  async "Locations.toggleCurfew"(
    this: Meteor.MethodThisType,
    { locationId }: { locationId: LocationID },
  ) {
    const location = await Locations.findOneAsync(locationId);

    if (!(await isUserInTeam(this.userId, location?.teamName))) {
      throw new Meteor.Error("Wait that's illegal");
    }

    return (
      (await Locations.updateAsync(locationId, {
        $set: { curfew: !location?.curfew, updatedAt: new Date() },
      })) && (await Locations.findOneAsync(locationId))
    );
  },
  async "Locations.toggleClosed"(
    this: Meteor.MethodThisType,
    { locationId }: { locationId: LocationID },
  ) {
    const location = await Locations.findOneAsync(locationId);

    if (!(await isUserInTeam(this.userId, location?.teamName))) {
      throw new Meteor.Error("Wait that's illegal");
    }

    return (
      (await Locations.updateAsync(locationId, {
        $set: { closed: !location?.closed, updatedAt: new Date() },
      })) && (await Locations.findOneAsync(locationId))
    );
  },
} as const;

Meteor.methods(locationMethods);

// @ts-expect-error
if (Meteor.isClient) window.Locations = Locations;
