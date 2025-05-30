import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import {
  getRemainingServings,
  getRemainingServingsEver,
} from "../components/RemainingStock";
import { emptyArray, Flavor, SizeUnit } from "../util";
import { assertUserInAnyTeam } from "./accounts";
import Camps from "./camps";
import Sales from "./sales";
import Stocks, { StockID } from "./stocks";

export type ProductID = Flavor<string, "ProductID">;

export interface IProduct {
  _id: ProductID;
  createdAt: Date;
  updatedAt?: Date;
  removedAt?: Date;
  brandName: string;
  name: string;
  description?: string;
  salePrice?: number;
  unitSize?: number | string;
  sizeUnit?: SizeUnit;
  abv?: number;
  ibu?: number;
  tags?: string[];
  shopPrices?: { buyPrice: number; timestamp: Date }[];
  components?: {
    stockId: StockID;
    unitSize: number;
    sizeUnit: SizeUnit;
  }[];
  locationIds?: string[];
  tap?: string | null;
  barCode?: string;
}

const Products = new Mongo.Collection<IProduct>("products");

export default Products;

export const productsMethods = {
  async "Products.addProduct"(
    this: Meteor.MethodThisType,
    {
      data,
    }: { data: Omit<IProduct, "_id" | "createdAt"> & { buyPrice?: number } },
  ) {
    await assertUserInAnyTeam(this.userId);
    const createdAt = new Date();
    return await Products.insertAsync({
      createdAt,
      updatedAt: createdAt,
      brandName: data.brandName.trim(),
      name: data.name.trim(),
      description: data.description?.trim(),
      salePrice: data.salePrice,
      unitSize: data.unitSize,
      sizeUnit: data.sizeUnit,
      components: data.components,
      abv: data.abv || undefined,
      tags:
        data.tags?.map((tag: string) => tag.trim().toLowerCase()) || emptyArray,
      shopPrices: data.buyPrice
        ? [{ buyPrice: Number(data.buyPrice), timestamp: createdAt }]
        : undefined,
    });
  },
  async "Products.editProduct"(
    this: Meteor.MethodThisType,
    {
      productId,
      data: { buyPrice, ...updatedProduct },
    }: {
      productId: ProductID;
      data: Partial<IProduct> & { buyPrice?: number };
    },
  ) {
    await assertUserInAnyTeam(this.userId);
    const oldProduct = await Products.findOneAsync({ _id: productId });
    const updatedAt = new Date();
    return await Products.updateAsync(productId, {
      $set: {
        ...updatedProduct,
        updatedAt,
        shopPrices: buyPrice
          ? (oldProduct?.shopPrices || emptyArray).concat([
              { buyPrice: buyPrice, timestamp: updatedAt },
            ])
          : undefined,
      },
    });
  },
  async "Products.removeProduct"(
    this: Meteor.MethodThisType,
    { productId }: { productId: ProductID },
  ) {
    await assertUserInAnyTeam(this.userId);
    if (productId)
      return Products.updateAsync(productId, {
        $set: { removedAt: new Date() },
      });
  },
  async "Products.getRemainingPercent"(
    this: Meteor.MethodThisType,
    { productId }: { productId: ProductID },
  ) {
    this.unblock();
    if (this.isSimulation) return NaN;

    const currentCamp = (await Camps.findOneAsync({}, { sort: { end: -1 } }))!;
    if (productId) {
      const product = await Products.findOneAsync(productId)!;

      if (!product) throw new Meteor.Error("Product not found");

      const stocks = await Stocks.find().fetchAsync();

      const sales = await Sales.find({
        timestamp: { $gte: currentCamp.start, $lte: currentCamp.end },
      }).fetchAsync();

      const servings =
        getRemainingServings(sales, stocks, product, new Date()) /
        getRemainingServingsEver(stocks, product);

      return servings;
    }

    throw new Meteor.Error("productId is required");
  },
} as const;

Meteor.methods(productsMethods);

// @ts-expect-error
if (Meteor.isClient) window.Products = Products;

export function isAlcoholic(product: IProduct) {
  return (
    product.tags?.includes("cocktail") ||
    product.tags?.includes("beer") ||
    product.tags?.includes("cider") ||
    product.tags?.includes("spirit")
  );
}

export function isMate(product: IProduct) {
  return (
    product.brandName?.includes("Mate") ||
    product.brandName?.includes("Mio Mio")
  );
}
