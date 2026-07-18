import sumBy from "lodash/sumBy";
import { WebApp } from "meteor/webapp";
import Locations from "../api/locations";
import Products, { getProductBrandName, getProductName } from "../api/products";
import Sales from "../api/sales";
import Stocks from "../api/stocks";
import { wrapRoute } from "../util";
import * as client from "../vendor/prom-client";
import Gauge from "../vendor/prom-client/lib/gauge";

new client.Gauge({
  name: "location_product_sales",
  help: "Sale by product",
  labelNames: ["locationName", "brandName", "productName"],
  async collect(this: Gauge) {
    const locations = await Locations.find().fetchAsync();
    const products = await Products.find().fetchAsync();
    const stocks = await Stocks.find().fetchAsync();

    for (const location of locations) {
      const locationSales = await Sales.find({
        locationId: location._id,
      }).fetchAsync();
      products.forEach((product) => {
        const count = sumBy(
          locationSales,
          (sale) =>
            sale.products.filter(
              (saleProduct) => saleProduct._id == product._id,
            ).length,
        );

        const productBrandName = getProductBrandName(product, stocks);
        const productName = getProductName(product, stocks);

        this.labels(
          location.name,
          productBrandName || "",
          productName || "",
        ).set(count);
      });
    }
  },
});
client.collectDefaultMetrics();

WebApp.handlers.use(
  "/metrics",
  wrapRoute(async (_req, res) => {
    try {
      res.setHeader("content-type", "text/plain; version=0.0.4; charset=utf-8");
      res.end(await client.register.metrics());
      return;
    } catch (error) {
      console.error(error);
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(error));
      return;
    }
  }),
);
