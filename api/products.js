import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { assertUserInAnyTeam } from "./accounts";
import Locations from "./locations";

const Products = new Mongo.Collection("products");
const addProduct = (product) => Products.insert(product);
if (Meteor.isServer)
  Meteor.startup(() => {
    if (Products.find().count() === 0) {
      addProduct({
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
          $set: { locationIds: [Locations.findOne({ slug: "bar" })._id] },
          $unset: { isOnMenu: "" },
        }),
      );
    }
    const stringTagsProductsQuery = {
      tags: { $type: "string", $not: { $type: "array" } },
    };
    if (Products.find(stringTagsProductsQuery).count()) {
      const products = Products.find(stringTagsProductsQuery).fetch();
      console.log(
        `Migrating ${products.length} products from string to array tags.`,
      );
      products.forEach(({ _id, tags }) =>
        Products.update(_id, { $set: { tags: tags ? tags.split(",") : [] } }),
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
      salePrice: Number(data.salePrice.trim()),
      unitSize: Number(data.unitSize.trim()),
      sizeUnit: data.sizeUnit.trim(),
      abv: Number(data.abv.trim()),
      tags: data.tags.map((tag) => tag.trim().toLowerCase()),
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
          ? (oldProduct.shopPrices || []).concat([
              { buyPrice: +buyPrice.trim(), timestamp: new Date() },
            ])
          : undefined,
        updatedAt: new Date(),
      },
    });
  },
  "Products.removeProduct"({ productId }) {
    if (!this.userId) throw new Meteor.Error("log in please");
    if (productId)
      return Products.update(productId, { $set: { removedAt: new Date() } });
  },
});

if (Meteor.isClient) window.Products = Products;
