import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { Flavor, SizeUnit } from "../util";
import { assertUserInAnyTeam } from "./accounts";
import { StockID } from "./stocks";

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
  tap?: string;
  barCode?: string;
}

const Products = new Mongo.Collection<IProduct>("products");

export default Products;

export const productsMethods = {
  "Products.addProduct"(
    this: Meteor.MethodThisType,
    {
      data,
    }: { data: Omit<IProduct, "_id" | "createdAt"> & { buyPrice?: number } },
  ) {
    assertUserInAnyTeam(this.userId);
    const createdAt = new Date();
    return Products.insert({
      createdAt,
      updatedAt: createdAt,
      brandName: data.brandName.trim(),
      name: data.name.trim(),
      description: data.description?.trim(),
      salePrice: data.salePrice,
      unitSize: data.unitSize,
      sizeUnit: data.sizeUnit,
      abv: data.abv || undefined,
      tags: data.tags?.map((tag: string) => tag.trim().toLowerCase()) || [],
      shopPrices: data.buyPrice
        ? [{ buyPrice: Number(data.buyPrice), timestamp: createdAt }]
        : undefined,
    });
  },
  "Products.editProduct"(
    this: Meteor.MethodThisType,
    {
      productId,
      data: { buyPrice, ...updatedProduct },
    }: {
      productId: ProductID;
      data: Partial<IProduct> & { buyPrice?: number };
    },
  ) {
    assertUserInAnyTeam(this.userId);
    const oldProduct = Products.findOne({ _id: productId });
    const updatedAt = new Date();
    return Products.update(productId, {
      $set: {
        ...updatedProduct,
        updatedAt,
        shopPrices: buyPrice
          ? (oldProduct?.shopPrices || []).concat([
              { buyPrice: buyPrice, timestamp: updatedAt },
            ])
          : undefined,
      },
    });
  },
  "Products.removeProduct"(
    this: Meteor.MethodThisType,
    { productId }: { productId: ProductID },
  ) {
    assertUserInAnyTeam(this.userId);
    if (productId)
      return Products.update(productId, { $set: { removedAt: new Date() } });
  },
} as const;

Meteor.methods(productsMethods);

// @ts-expect-error
if (Meteor.isClient) window.Products = Products;

export function isAlcoholic(product: IProduct) {
  if (
    product.tags?.includes("cocktail") ||
    product.tags?.includes("beer") ||
    product.tags?.includes("cider") ||
    product.tags?.includes("spirit")
  )
    return true;
}
