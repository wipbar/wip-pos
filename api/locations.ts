import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { isUserInTeam } from "./accounts";

export interface ILocation {
  _id: string;
  slug: string;
  name: string;
  teamName: string;
  curfew?: boolean;
}

const Locations = new Mongo.Collection<ILocation>("locations");

if (Meteor.isServer) {
  Meteor.startup(() => {
    if (Locations.find().count() === 0) {
      Locations.insert({ slug: "bar", name: "WIP Bar", teamName: "Bar" });
      Locations.insert({ slug: "info", name: "Infodesk", teamName: "Info" });
    }
  });
}
export default Locations;

Meteor.methods({
  "Locations.toggleCurfew"({ locationId }) {
    const location = Locations.findOne(locationId);

    if (!isUserInTeam(this.userId, location?.teamName)) {
      throw new Meteor.Error("Wait that's illegal");
    }

    return (
      Locations.update(locationId, {
        $set: { curfew: !location?.curfew, updatedAt: new Date() },
      }) && Locations.findOne(locationId)
    );
  },
});

// @ts-expect-error
if (Meteor.isClient) window.Locations = Locations;