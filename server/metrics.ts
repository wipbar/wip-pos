import Fiber from "fibers";
import { sumBy } from "lodash";
import { WebApp } from "meteor/webapp";
import Locations from "../api/locations";
import Products from "../api/products";
import Sales from "../api/sales";
import * as promClient from "prom-client";

// define application specific metrics
export const SalesCounter = new promClient.Counter({
    name: "pos_sales_count",
    help: "Counter for sales of products",
    labelNames: ["location", "brand", "product"]
});

// respond to /metrics and serve metrics from there.
export function registerMetricsHandler() {
  // enable default metrics collection
  promClient.collectDefaultMetrics();

  // register the URL handler
  WebApp.connectHandlers.use("/metrics", (_req, res) =>
    Fiber(async () => {
      try {
        res.setHeader("content-type", "text/plain; version=0.0.4; charset=utf-8");
        return res.end(await promClient.register.metrics());
      } catch (error) {
        console.error(error);
        res.setHeader("content-type", "application/json");
        return res.end(JSON.stringify(error));
      }
    }).run(),
  );
}

