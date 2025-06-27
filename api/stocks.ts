import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { PackageTypeCode } from "../data";
import { Flavor, SizeUnit } from "../util";
import { assertUserInAnyTeam } from "./accounts";

export type StockID = Flavor<string, "StockID">;

export interface IStock {
  _id: StockID;
  createdAt: Date;
  updatedAt?: Date;
  removedAt?: Date;
  barCode?: string;
  name: string;
  packageType: PackageTypeCode | null;
  unitSize: number;
  sizeUnit: SizeUnit;
  approxCount: null | number;
  levels?: {
    count: number;
    timestamp: Date;
  }[];
}

const Stocks = new Mongo.Collection<IStock>("stocks");

export default Stocks;

export const stocksMethods = {
  async "Stock.addStock"(
    this: Meteor.MethodThisType,
    {
      data,
    }: {
      data: Pick<
        IStock,
        "barCode" | "name" | "packageType" | "sizeUnit" | "unitSize"
      >;
    },
  ) {
    const user =
      (this.userId && (await Meteor.users.findOneAsync(this.userId))) || null;
    await assertUserInAnyTeam(user);

    const createdAt = new Date();
    return Stocks.insertAsync({
      createdAt,
      updatedAt: createdAt,
      approxCount: null,
      ...data,
    });
  },
  async "Stock.editStock"(
    this: Meteor.MethodThisType,
    {
      stockId,
      data: updatedStock,
    }: {
      stockId: StockID;
      data: Partial<IStock>;
    },
  ) {
    const user =
      (this.userId && (await Meteor.users.findOneAsync(this.userId))) || null;
    await assertUserInAnyTeam(user);

    const updatedAt = new Date();
    return await Stocks.updateAsync(stockId, {
      $set: { ...updatedStock, updatedAt },
    });
  },
  async "Stock.takeStock"(
    this: Meteor.MethodThisType,
    { stockId, count }: { stockId: StockID; count: number },
  ) {
    const user =
      (this.userId && (await Meteor.users.findOneAsync(this.userId))) || null;
    await assertUserInAnyTeam(user);

    if (stockId) {
      const updatedAt = new Date();
      return await Stocks.updateAsync(stockId, {
        $set: { approxCount: count, updatedAt },
        $push: { levels: { count, timestamp: new Date() } },
      });
    }
  },
  async "Stock.removeStock"(
    this: Meteor.MethodThisType,
    { stockId }: { stockId: StockID },
  ) {
    const user =
      (this.userId && (await Meteor.users.findOneAsync(this.userId))) || null;
    await assertUserInAnyTeam(user);

    if (stockId)
      return await Stocks.updateAsync(stockId, {
        $set: { removedAt: new Date() },
      });
  },
} as const;

Meteor.methods(stocksMethods);

// @ts-expect-error
if (Meteor.isClient) window.Stocks = Stocks;
