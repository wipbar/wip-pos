import { endOfDay, startOfDay } from "date-fns";
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

const Camps = new Mongo.Collection("camps");
const addCamp = (camps) => Camps.insert(camps);
if (Meteor.isServer) {
  Meteor.startup(() => {
    Camps.remove({});
    if (Camps.find().count() === 0) {
      console.log("Seeding camps");
      addCamp({
        name: "BornHack 2019",
        slug: "bornhack-2019",
        buildup: new Date(2019, 7, 5, 12),
        start: startOfDay(new Date(2019, 7, 8)),
        end: endOfDay(new Date(2019, 7, 15)),
      });
      addCamp({
        name: "BornHack 2020",
        slug: "bornhack-2020",
        buildup: new Date(2020, 7, 7, 12),
        start: startOfDay(new Date(2020, 7, 11)),
        end: endOfDay(new Date(2020, 7, 18)),
      });
    }
  });
}
export default Camps;
if (Meteor.isClient) window.Camps = Camps;
