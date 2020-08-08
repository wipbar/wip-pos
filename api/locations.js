import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

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
if (Meteor.isClient) window.Locations = Locations;
