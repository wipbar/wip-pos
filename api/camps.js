import { endOfDay, startOfDay } from "date-fns";
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

const Camps = new Mongo.Collection("camps");
const addCamp = (camps) => Camps.insert(camps);
if (Meteor.isServer) {
  Meteor.startup(() => {
    if (Camps.find().count() === 0) {
      console.log("Seeding camps");
      addCamp({
        name: "BornHack 2019",
        slug: "bornhack-2019",
        buildup: new Date(2019, 7, 5, 12),
        start: startOfDay(new Date(2019, 7, 8)),
        end: endOfDay(new Date(2019, 7, 15)),
        color: "#FFED00",
      });
      addCamp({
        name: "BornHack 2020",
        slug: "bornhack-2020",
        buildup: new Date(2020, 7, 7, 12),
        start: startOfDay(new Date(2020, 7, 11)),
        end: endOfDay(new Date(2020, 7, 18)),
        color: "#FD8B25",
      });
    }
    if (!Camps.findOne({ slug: "bornhack-2021" })) {
      addCamp({
        name: "BornHack 2021",
        slug: "bornhack-2021",
        buildup: new Date(2021, 7, 13, 12),
        start: startOfDay(new Date(2021, 7, 19)),
        end: endOfDay(new Date(2021, 7, 26)),
        color: "#E22028",
      });
    }
    if (!Camps.findOne({ slug: "bornhack-2022" })) {
      addCamp({
        name: "BornHack 2022",
        slug: "bornhack-2022",
        buildup: new Date(2022, 6, 30, 12),
        start: startOfDay(new Date(2022, 7, 3)),
        end: endOfDay(new Date(2022, 7, 10)),
        color: "#000000",
      });
    }
  });
}
export default Camps;
if (Meteor.isClient) window.Camps = Camps;
