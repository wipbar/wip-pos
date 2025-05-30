import { sumBy } from "lodash";
import Locations from "../api/locations";
import Products from "../api/products";
import Sales from "../api/sales";
import * as client from "../vendor/prom-client";

new client.Gauge({
  name: "location_product_sales",
  help: "Sale by product",
  labelNames: ["locationName", "brandName", "productName"],
  async collect() {
    const locations = await Locations.find().fetchAsync();
    for (const location of locations) {
      const locationSales = await Sales.find({
        locationId: location._id,
      }).fetchAsync();
      Products.find().forEach(({ brandName, name: productName, _id }) => {
        const count = sumBy(
          locationSales,
          (sale) =>
            sale.products.filter((saleProduct) => saleProduct._id == _id)
              .length,
        );
        // if (count)
        this.labels(location.name, brandName || "", productName).set(count);
      });
    }
  },
});
client.collectDefaultMetrics();

/*
WebApp.connectHandlers.use("/metrics", (_req, res) =>
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
*/
