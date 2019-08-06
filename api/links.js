import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

const Links = new Mongo.Collection("links");

const insertLink = (title, url, createdAt = new Date()) =>
  Links.insert({ title, url, createdAt });

if (Meteor.isServer)
  Meteor.startup(() => {
    // If the Links collection is empty, add some data.
    if (Links.find().count() === 0) {
      insertLink(
        "Do the Tutorial",
        "https://www.meteor.com/tutorials/react/creating-an-app",
      );

      insertLink("Follow the Guide", "http://guide.meteor.com");

      insertLink("Read the Docs", "https://docs.meteor.com");

      insertLink("Discussions", "https://forums.meteor.com");
    }
  });

export default Links;
