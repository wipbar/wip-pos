import { Meteor } from "meteor/meteor";
import Fiber from "fibers";
import { WebApp } from "meteor/webapp";
import { MongoInternals } from "meteor/mongo";
import Sales from "../api/sales";
import Products from "../api/products";
import Locations from "../api/locations";
const client = require("../vendor/prom-client");

new client.Gauge({
  name: "location_product_sales",
  help: "Sale by product",
  labelNames: ["locationName", "brandName", "productName"],
  collect() {
    const locations = Locations.find().fetch();
    locations.forEach((location) => {
      const locationSales = Sales.find({ locationId: location._id }).fetch();
      Products.find().forEach(({ brandName, name: productName, _id }) => {
        const count = locationSales.reduce(
          (memo, sale) =>
            memo +
            sale.products.filter((saleProduct) => saleProduct._id == _id)
              .length,
          0,
        );
        if (count)
          this.labels(location.name, brandName || "", productName).set(count);
      });
    });
  },
});
client.collectDefaultMetrics();

WebApp.connectHandlers.use("/metrics", (req, res) =>
  Fiber(async () => {
    try {
      res.setHeader("content-type", "text/plain; version=0.0.4; charset=utf-8");
      return res.end(await client.register.metrics());
    } catch (error) {
      console.error(error);
      res.setHeader("content-type", "application/json");
      return res.end(JSON.stringify(error));
    }
  }).run(),
);

// get a count of the current # of connections and each named sub
function getConnectionCounts() {
  var results = {
    nSockets: 0,
    nSocketsWithLivedataSessions: 0,
    nSubs: {},
    nDocuments: {},
    nLiveResultsSets: 0,
    nObserveHandles: 0,
    oplogObserveHandlesCount: 0,
    pollingObserveHandlesCount: 0,
    oplogObserveHandles: {},
    pollingObserveHandles: {},
    usersWithNSubscriptions: {},
    nSessions: 0,
  };

  var initKey = (part, key) => (part[key] = part[key] || 0);

  // check out the connections and what we know about them
  Meteor.default_server.stream_server.open_sockets.forEach((socket) => {
    results.nSockets += 1;

    if (socket.meteor_session) results.nSocketsWithLivedataSessions += 1;
  });

  // check out the sessions
  Meteor.default_server.sessions.forEach((session) => {
    results.nSessions += 1;
    var subCount = Object.keys(session._namedSubs).length;
    results.usersWithNSubscriptions[subCount] =
      results.usersWithNSubscriptions[subCount] || 0;
    results.usersWithNSubscriptions[subCount] += 1;

    session._namedSubs.forEach((info) => {
      initKey(results.nSubs, info._name);
      results.nSubs[info._name] += 1;

      info._documents.forEach((docs, type) => {
        initKey(results.nDocuments, type);
        results.nDocuments[type] += docs.size;
      });
    });
  });
  Object.values(
    MongoInternals.defaultRemoteCollectionDriver().mongo._observeMultiplexers,
  ).forEach((muxer) => {
    Object.values(muxer._handles).forEach((handle) => {
      results.nObserveHandles += 1;

      var logStat = (type, collectionName) => {
        results[type + "Count"] += 1;
        results[type][collectionName] = results[type][collectionName] || 0;
        results[type][collectionName] += 1;
      };

      var driver = handle._observeDriver || muxer._observeDriver;
      var collectionName = driver._cursorDescription.collectionName;
      if (driver._usesOplog) {
        logStat("oplogObserveHandles", collectionName);
      } else {
        logStat("pollingObserveHandles", collectionName);
      }
    });
  });

  return results;
}
