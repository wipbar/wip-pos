import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { assertUserInAnyTeam } from "./accounts";
import Locations from "./locations";

export interface IProduct {
  _id: string;
  createdAt: Date;
  brandName?: string;
  name: string;
  description?: string;
  salePrice?: number;
  unitSize?: number;
  sizeUnit?: string;
  abv?: number;
  tags?: string[];
  shopPrices?: { buyPrice: number; timestamp: Date }[];
}

const Products = new Mongo.Collection<IProduct>("products");

if (Meteor.isServer)
  Meteor.startup(() => {
    if (Products.find().count() === 0) {
      Products.insert({
        createdAt: new Date(),
        name: "øl",
        salePrice: 25,
        unitSize: 500,
        sizeUnit: "ml",
        shopPrices: [{ buyPrice: 10, timestamp: new Date() }],
      });
    }
    if (Products.find({ isOnMenu: { $exists: 1 } }).count()) {
      console.log("Migrating isOnMenu to locationIds.");
      const products = Products.find({ isOnMenu: { $exists: 1 } }).fetch();
      products.forEach(({ _id }) =>
        Products.update(_id, {
          $set: { locationIds: [Locations.findOne({ slug: "bar" })?._id] },
          $unset: { isOnMenu: "" },
        }),
      );
    }

    const stringTagsProductsCursor = Products.find({
      tags: { $type: "string", $not: { $type: "array" } },
    });
    if (stringTagsProductsCursor.count()) {
      const products = stringTagsProductsCursor.fetch();
      console.log(
        `Migrating ${products.length} products from string to array tags.`,
      );
      products.forEach(({ _id, tags }) =>
        Products.update(_id, {
          $set: { tags: tags ? (tags as unknown as string).split(",") : [] },
        }),
      );
    }
  });

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
