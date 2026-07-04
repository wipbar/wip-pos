import express from "express";
import { WebApp } from "meteor/webapp";
import Camps from "../api/camps";
import Products, { ProductID } from "../api/products";
import Sales from "../api/sales";

type AsyncRequestHandler = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => Promise<void> | void;

const wrapRoute =
  (fn: AsyncRequestHandler): express.RequestHandler =>
  (req, res, next) =>
    fn(req, res, next)?.catch?.(next);

interface PosTransaction {
  /** The Camp this PosTransaction belongs to. */
  camp_slug: string;
  /** The Pos this PosTransaction belongs to. */
  pos_id: string;
  /** The external ID of this pos transaction */
  transaction_id: string;
  /** The external ID of the pos user who did this transaction */
  user_id: string | null;
  /** The date and time of this PoS transaction */
  timestamp: Date;
}

interface PosSale {
  camp_slug: string;
  transaction_id: string;
  product_id: string;
  /** The price of this product (at the time of sale).  */
  sales_price: number;
}

/** A product sold in our PoS. This model does not inherit from CampRelatedModel, meaning pos products are not camp specific. */
interface PosProduct {
  product_id: string;
  brand_name: string;
  name: string;
  description: string;
  /** The current price of this product. */
  sales_price: number;
  unit_size: number;
  size_unit: string;
  abv: number;
  tags: string[];
  /** The related expenses for this PosProduct. Only expenses related to a Pos-team are shown. For products composed of multiple ingredients all relevant expenses should be picked. */
  expenses: [];
}
interface PosProductCost {
  camp_slug: string;
  product_id: string;
  /** The timestamp from which this product_cost is correct */
  timestamp: Date;
  /** The cost/expense (in DKK, including VAT) for each product sold. For products composed of multiple ingredients this number should include the total cost per product sold. */
  product_cost: number;
}

(
  WebApp as unknown as typeof WebApp & { handlers: express.IRouter }
).handlers.use(
  "/api/django-economy-export",
  wrapRoute(async (_req, res) => {
    const url = new URL(_req.url, `http://${_req.headers.host}`);
    const campSlug = url.searchParams.get("campSlug");
    if (!campSlug) {
      const camps = await Camps.find({}, { fields: { slug: 1 } }).fetchAsync();

      res.writeHead(400, { "Content-Type": "application/json" });
      res.write(
        JSON.stringify({
          error: "Missing campSlug query parameter",
          available_camp_slugs: camps.map((c) => c.slug).sort(),
        }),
      );
      res.end();
      return;
    }

    const camp = await Camps.findOneAsync({ slug: campSlug });
    if (!camp) {
      const camps = await Camps.find({}, { fields: { slug: 1 } }).fetchAsync();

      res.writeHead(400, { "Content-Type": "application/json" });
      res.write(
        JSON.stringify({
          error: `Camp with slug ${campSlug} not found`,
          available_camp_slugs: camps.map((c) => c.slug).sort(),
        }),
      );
      res.end();
      return;
    }

    const campSales = await Sales.find({
      timestamp: { $gte: camp.buildup, $lte: camp.teardown },
    }).fetchAsync();

    const pos_transaction: PosTransaction[] = [];
    const pos_sale: PosSale[] = [];
    const pos_product: PosProduct[] = [];
    const pos_product_cost: PosProductCost[] = [];

    const productIds = new Set<ProductID>();
    for (const sale of campSales) {
      pos_transaction.push({
        camp_slug: camp.slug,
        pos_id: sale.locationId,
        transaction_id: sale._id,
        user_id: sale.userId ?? null,
        timestamp: sale.timestamp,
      });
      for (const product of sale.products) {
        productIds.add(product._id);
        pos_sale.push({
          camp_slug: camp.slug,
          transaction_id: sale._id,
          product_id: product._id,
          sales_price: product.salePrice ?? 0,
        });
      }
    }

    const products = await Products.find({
      _id: { $in: Array.from(productIds) },
    }).fetchAsync();
    for (const product of products) {
      pos_product.push({
        product_id: product._id,
        brand_name: product.brandName,
        name: product.name,
        description: product.description ?? "",
        sales_price: product.salePrice ?? 0,
        unit_size: isNaN(Number(product.unitSize))
          ? 0
          : Number(product.unitSize),
        size_unit: product.sizeUnit ?? "",
        abv: product.abv ?? 0,
        tags: product.tags ?? [],
        expenses: [], // TODO: Fetch related expenses for this PosProduct
      });

      for (const productCost of product.shopPrices ?? []) {
        pos_product_cost.push({
          camp_slug: camp.slug,
          product_id: product._id,
          timestamp: productCost.timestamp,
          product_cost: productCost.buyPrice ?? 0,
        });
      }
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.write(
      JSON.stringify({
        pos_transaction,
        pos_sale,
        pos_product,
        pos_product_cost,
      }),
    );
    res.end();
  }),
);
