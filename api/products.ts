import convert from "convert";
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { catchNaN, emptyArray, Flavor, SizeUnit } from "../util";
import { assertUserInAnyTeam } from "./accounts";
import { type ISale, productsRemainingPercent } from "./sales";
import { type IStock, type StockID } from "./stocks";

export type ProductID = Flavor<string, "ProductID">;

export interface IProduct {
  _id: ProductID;
  createdAt: Date;
  updatedAt?: Date;
  removedAt?: Date;
  brandName: string | null;
  name: string | null;
  description?: string | null;
  salePrice?: number;
  unitSize?: number | string | null; // null means based on components
  sizeUnit?: SizeUnit | null; // null means based on components
  abv?: number | null;
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
    const user =
      (this.userId && (await Meteor.users.findOneAsync(this.userId))) || null;
    await assertUserInAnyTeam(user);

    const createdAt = new Date();
    return await Products.insertAsync({
      createdAt,
      updatedAt: createdAt,
      brandName: data.brandName?.trim() ?? null,
      name: data.name?.trim() ?? null,
      description: data.description?.trim() ?? null,
      salePrice: data.salePrice,
      unitSize:
        data.unitSize === "" ||
        data.unitSize === null ||
        Number.isNaN(data.unitSize)
          ? null
          : data.unitSize,
      sizeUnit:
        data.unitSize === "" ||
        data.unitSize === null ||
        Number.isNaN(data.unitSize)
          ? null
          : data.sizeUnit,
      tap: data.tap,
      barCode: data.barCode,
      locationIds: data.locationIds,
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
    const user =
      (this.userId && (await Meteor.users.findOneAsync(this.userId))) || null;
    await assertUserInAnyTeam(user);

    const oldProduct = await Products.findOneAsync({ _id: productId });
    const updatedAt = new Date();
    return await Products.updateAsync(productId, {
      $set: {
        ...updatedProduct,
        unitSize:
          updatedProduct.unitSize === "" ||
          updatedProduct.unitSize === null ||
          Number.isNaN(updatedProduct.unitSize)
            ? null
            : updatedProduct.unitSize,
        sizeUnit:
          updatedProduct.unitSize === "" ||
          updatedProduct.unitSize === null ||
          Number.isNaN(updatedProduct.unitSize)
            ? null
            : updatedProduct.sizeUnit,
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
    const user =
      (this.userId && (await Meteor.users.findOneAsync(this.userId))) || null;
    await assertUserInAnyTeam(user);

    if (productId)
      return Products.updateAsync(productId, {
        $set: { removedAt: new Date() },
      });
  },
  "Products.getRemainingPercent"(
    this: Meteor.MethodThisType,
    { productId }: { productId: ProductID },
  ) {
    this.unblock();
    if (this.isSimulation) return NaN;

    if (productId) return productsRemainingPercent?.data.get(productId);

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

export function isMate(brandName?: string) {
  return brandName?.includes("Mate") || brandName?.includes("Mio Mio");
}
export function getProductDescription(
  product: Pick<IProduct, "description" | "components">,
  stocks: Pick<IStock, "description" | "_id">[],
) {
  const singleComponent =
    product?.components?.length === 1 &&
    product?.components?.find(
      (component) =>
        stocks.find(({ _id }) => _id === component.stockId)?.description,
    );
  const componentStock = singleComponent
    ? stocks.find(({ _id }) => _id === singleComponent.stockId)
    : undefined;

  return product?.description ?? componentStock?.description ?? "";
}
export function getProductBrandName(
  product: Pick<IProduct, "brandName" | "components">,
  stocks: Pick<IStock, "brandName" | "_id">[],
) {
  const singleComponent =
    product?.components?.length === 1 &&
    product?.components?.find(
      (component) =>
        stocks.find(({ _id }) => _id === component.stockId)?.brandName,
    );
  const componentStock = singleComponent
    ? stocks.find(({ _id }) => _id === singleComponent.stockId)
    : undefined;

  return product?.brandName ?? componentStock?.brandName ?? "";
}
export function getProductName(
  product: Pick<IProduct, "name" | "components">,
  stocks: Pick<IStock, "name" | "_id">[],
) {
  const singleComponent =
    product?.components?.length === 1 &&
    product?.components?.find(
      (component) => stocks.find(({ _id }) => _id === component.stockId)?.name,
    );
  const componentStock = singleComponent
    ? stocks.find(({ _id }) => _id === singleComponent.stockId)
    : undefined;

  const name = product?.name ?? componentStock?.name;

  if (!name) {
    throw new Error(
      `Product name is missing for product ${JSON.stringify(product)}
      } with components: ${JSON.stringify(product.components)}`,
    );
  }

  return name;
}
export function getProductSize(
  product: Pick<IProduct, "unitSize" | "sizeUnit" | "components">,
): {
  unitSize: number;
  sizeUnit: SizeUnit;
} | null {
  if (
    product.unitSize &&
    product.sizeUnit &&
    product.unitSize !== "" &&
    product.unitSize !== null &&
    product.unitSize !== undefined &&
    !Number.isNaN(Number(product.unitSize))
  ) {
    return {
      unitSize: Number(product.unitSize),
      sizeUnit: product.sizeUnit,
    };
  }

  const components = product.components;

  if (!components?.length) return null;

  const sizeUnit = components[0]?.sizeUnit;

  if (!sizeUnit) return null;
  const unitSize = components.reduce(
    (acc, component) =>
      acc +
      catchNaN(() =>
        convert(component.unitSize, component.sizeUnit).to(sizeUnit),
      ),
    0,
  );

  return { unitSize, sizeUnit };
}

export function getProductABV(
  product: Pick<IProduct, "abv" | "components">,
  componentStocks: Pick<IStock, "abv" | "_id">[],
): number | null {
  if (product.abv !== null && !isNaN(Number(product.abv))) {
    return Number(product.abv);
  }

  const components = product.components;
  if (!components?.length) return null;

  const sizeUnit = components[0]?.sizeUnit;

  if (!sizeUnit) return null;
  const totalVolume = components.reduce(
    (acc, component) =>
      acc +
      catchNaN(
        () => convert(component.unitSize, component.sizeUnit).to(sizeUnit),
        0,
      ),
    0,
  );

  const totalAlcohol = components.reduce((acc, component) => {
    const componentStock = componentStocks?.find(
      ({ _id }) => _id === component.stockId,
    );
    if (!componentStock || Number.isNaN(componentStock.abv)) return 0;
    return (
      acc +
      (catchNaN(
        () => convert(component.unitSize, component.sizeUnit).to(sizeUnit),
        0,
      ) *
        (componentStock.abv ?? 0)) /
        100
    );
  }, 0);

  return totalVolume > 0 ? (totalAlcohol / totalVolume) * 100 : null;
}

export function getProductBarCode(product: IProduct, stocks: IStock[]) {
  const singleComponent =
    product?.components?.length === 1 &&
    product?.components?.find(
      (component) =>
        stocks.find(({ _id }) => _id === component.stockId)?.barCode,
    );
  const componentStock =
    singleComponent &&
    stocks.find(({ _id }) => _id === singleComponent.stockId);

  return componentStock ? componentStock?.barCode : product?.barCode;
}

export function getProductAverageOrderDuration(
  product: IProduct,
  sales: ISale[],
) {
  const salesOfOnlyThisProductWithTiming = sales.filter(
    (sale) =>
      sale.cartOpenedAt &&
      sale.cartSoldAt &&
      sale.products.length === 1 &&
      sale.products.filter((p) => p._id === product._id).length === 1,
  );

  if (!salesOfOnlyThisProductWithTiming.length) return NaN;

  const deltas = salesOfOnlyThisProductWithTiming.map(
    (sale) => sale.cartSoldAt!.valueOf() - sale.cartOpenedAt!.valueOf(),
  );

  return deltas.reduce((memo, delta) => memo + delta, 0) / deltas.length;
}

export const isBasicallySameProduct = (a: IProduct, b: IProduct): boolean =>
  Boolean(
    ((!a.abv && !b.abv) || a.abv === b.abv) &&
      a.sizeUnit === b.sizeUnit &&
      a.name === b.name &&
      a.brandName === b.brandName &&
      a.description === b.description &&
      a.components &&
      b.components &&
      a.components?.length === b.components?.length &&
      a.components?.every((component) => {
        const nextComponent = b.components?.find(
          (c) => c.stockId === component.stockId,
        );
        return component.sizeUnit === nextComponent?.sizeUnit;
      }),
  );
