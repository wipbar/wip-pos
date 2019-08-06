import "/api/links";
import Products from "/api/products";

import { Meteor } from "meteor/meteor";

Meteor.publish("products", () => Products.find());
