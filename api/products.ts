import { Mass, Volume } from "convert";
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { assertUserInAnyTeam } from "./accounts";
import { Flavor } from "/util";

export type ProductID = Flavor<string, "ProductID">;

export interface IProduct {
  _id: ProductID;
  createdAt: Date;
  updatedAt?: Date;
  brandName: string;
  name: string;
  description?: string;
  salePrice?: number;
  unitSize?: number | string;
  sizeUnit?: Volume | Mass;
  abv?: number;
  ibu?: number;
  tags?: string[];
  shopPrices?: { buyPrice: number; timestamp: Date }[];
  locationIds?: string[];
  tap?: string;
  barCode?: string;
}

const Products = new Mongo.Collection<IProduct>("products");

export default Products;

Meteor.methods({
  "Products.addProduct"({ data }) {
    assertUserInAnyTeam(this.userId);
    const createdAt = new Date();
    return Products.insert({
      createdAt,
      updatedAt: createdAt,
      brandName: data.brandName.trim(),
      name: data.name.trim(),
      description: data.description?.trim(),
      salePrice: data.salePrice && Number(data.salePrice.trim()),
      unitSize: data.unitSize && Number(data.unitSize.trim()),
      sizeUnit: data.sizeUnit.trim(),
      abv: data.abv?.trim() && Number(data.abv.trim()),
      tags: data.tags?.map((tag: string) => tag.trim().toLowerCase()) || [],
      shopPrices: data.buyPrice
        ? [{ buyPrice: Number(data.buyPrice.trim()), timestamp: createdAt }]
        : undefined,
    });
  },
  "Products.editProduct"({ productId, data: { buyPrice, ...updatedProduct } }) {
    assertUserInAnyTeam(this.userId);
    const oldProduct = Products.findOne({ _id: productId });
    const updatedAt = new Date();
    return Products.update(productId, {
      $set: {
        ...updatedProduct,
        updatedAt,
        shopPrices: buyPrice?.trim()
          ? (oldProduct?.shopPrices || []).concat([
              { buyPrice: +buyPrice.trim(), timestamp: updatedAt },
            ])
          : undefined,
      },
    });
  },
  "Products.removeProduct"({ productId }) {
    assertUserInAnyTeam(this.userId);
    if (productId)
      return Products.update(productId, { $set: { removedAt: new Date() } });
  },
});

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
