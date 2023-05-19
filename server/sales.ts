import Fiber from "fibers";
import { WebApp } from "meteor/webapp";
import Sales from "../api/sales";

WebApp.connectHandlers.use("/sales", (_req, res) =>
  Fiber(async () => {
    try {
      res.setHeader("content-type", "application/json; charset=utf-8");
      return res.end(JSON.stringify(Sales.find({}).fetch()));
    } catch (error) {
      console.error(error);
      res.setHeader("content-type", "application/json");
      return res.end(JSON.stringify(error));
    }
  }).run(),
);
