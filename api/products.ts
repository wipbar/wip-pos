import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { assertUserInAnyTeam } from "./accounts";

export interface IProduct {
  _id: string;
  createdAt: Date;
  brandName: string;
  name: string;
  description?: string;
  salePrice?: number;
  unitSize?: number | string;
  sizeUnit?: string;
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
    return Products.insert({
      createdAt: new Date(),
      brandName: data.brandName.trim(),
      name: data.name.trim(),
      description: data.description?.trim(),
      salePrice: data.salePrice && Number(data.salePrice.trim()),
      unitSize: data.unitSize && Number(data.unitSize.trim()),
      sizeUnit: data.sizeUnit.trim(),
      abv: data.abv?.trim() && Number(data.abv.trim()),
      tags: data.tags?.map((tag: string) => tag.trim().toLowerCase()) || [],
      shopPrices: data.buyPrice
        ? [{ buyPrice: Number(data.buyPrice.trim()), timestamp: new Date() }]
        : undefined,
    });
  },
  "Products.editProduct"({ productId, data: { buyPrice, ...updatedProduct } }) {
    assertUserInAnyTeam(this.userId);
    const oldProduct = Products.findOne({ _id: productId });
    return Products.update(productId, {
      $set: {
        ...updatedProduct,
        shopPrices: buyPrice?.trim()
          ? (oldProduct?.shopPrices || []).concat([
              { buyPrice: +buyPrice.trim(), timestamp: new Date() },
            ])
          : undefined,
        updatedAt: new Date(),
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
