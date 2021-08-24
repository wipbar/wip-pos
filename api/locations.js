import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { isUserInTeam } from "./accounts";

const Locations = new Mongo.Collection("locations");
const addLocation = (location) => Locations.insert(location);
if (Meteor.isServer) {
  Meteor.startup(() => {
    if (Locations.find().count() === 0) {
      addLocation({ slug: "bar", name: "WIP Bar", teamName: "Bar" });
      addLocation({ slug: "info", name: "Infodesk", teamName: "Info" });
    }
  });
}
export default Locations;

Meteor.methods({
  "Locations.toggleCurfew"({ locationId }) {
    const location = Locations.findOne(locationId);
    console.log(locationId, location);
    if (!isUserInTeam(this.userId, location.teamName)) {
      throw new Meteor.Error("Wait that's illegal");
    }

    return (
      Locations.update(locationId, {
        $set: { curfew: !location.curfew, updatedAt: new Date() },
      }) && Locations.findOne(locationId)
    );
  },
});

if (Meteor.isClient) window.Locations = Locations;
