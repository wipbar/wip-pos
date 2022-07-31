import { countBy, groupBy, uniqBy } from "lodash";
import * as path from "path";
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import xlsx from "node-xlsx";
import { isUserInTeam } from "./accounts";
import Locations, { ILocation } from "./locations";
import Products, { IProduct } from "./products";

export interface ISale {
  _id: string;
  userId?: string;
  locationId: string;
  currency?: string;
  country?: string;
  amount: number;
  timestamp: Date;
  products: IProduct[];
}

if (Meteor.isServer)
  Meteor.startup(() => {
    interface IZettleSale {
      Tid: Date;
      Kvitteringsnummer: number;
      Navn: string;
      Variant?: string;
      Antal: number;
      "Pris (DKK)": number;
    }

    function upsertProduct(newProduct: Omit<IProduct, "createdAt" | "_id">) {
      const foundProduct = Products.findOne({
        brandName: newProduct.brandName,
        name: newProduct.name,
      });

      if (!foundProduct) {
        Products.insert({
          createdAt: new Date(),
          ...newProduct,
        });
      } else {
        Products.update(foundProduct._id, { $set: newProduct });
      }
    }

    Meteor.startup(() => {
      upsertProduct({
        salePrice: 35,
        brandName: "Svaneke",
        name: "American Pale Ale",
        description: "American Pale Ale",
        unitSize: 50,
        sizeUnit: "cl",
        abv: 4.8,
        ibu: 22,
        tags: ["beer", "bottle"],
      });
      upsertProduct({
        salePrice: 35,
        brandName: "Svaneke",
        name: "India Pale Ale",
        description: "West Coast IPA",
        unitSize: 50,
        sizeUnit: "cl",
        abv: 5.8,
        ibu: 46,
        tags: ["beer", "bottle"],
      });
      upsertProduct({
        salePrice: 35,
        brandName: "Svaneke",
        name: "Bingo Gringo",
        description: "Mexican Lager",
        unitSize: 50,
        sizeUnit: "cl",
        abv: 4.6,
        ibu: 15,
        tags: ["beer", "tap"],
      });
      upsertProduct({
        salePrice: 35,
        brandName: "Svaneke",
        name: "Sweet Mary",
        description: "Doppelbock",
        unitSize: 50,
        sizeUnit: "cl",
        abv: 7.9,
        tags: ["beer", "bottle"],
      });
      upsertProduct({
        salePrice: 35,
        brandName: "Svaneke",
        name: "Greencopper",
        description: "Vienna Lager",
        unitSize: 50,
        sizeUnit: "cl",
        abv: 4.9,
        tags: ["beer", "bottle"],
      });
      upsertProduct({
        salePrice: 35,
        brandName: "Svaneke",
        name: "Reggae Lager",
        description: "Pale Lager",
        unitSize: 50,
        sizeUnit: "cl",
        abv: 4.8,
        tags: ["beer", "bottle"],
      });
      upsertProduct({
        salePrice: 35,
        brandName: "Svaneke",
        name: "Going To India IPA",
        description: "American IPA",
        unitSize: 50,
        sizeUnit: "cl",
        abv: 5.5,
        ibu: 42,
        tags: ["beer", "bottle"],
      });
      upsertProduct({
        salePrice: 35,
        brandName: "Svaneke",
        name: "Laid Back",
        description: "Session IPA",
        unitSize: 50,
        sizeUnit: "cl",
        abv: 4.8,
        ibu: 25,
        tags: ["beer", "bottle"],
      });
      upsertProduct({
        salePrice: 35,
        brandName: "Svaneke",
        name: "Blonde",
        description: "Belgian Wheat Ale",
        unitSize: 50,
        sizeUnit: "cl",
        abv: 4.6,
        ibu: 19,
        tags: ["beer", "bottle"],
      });
      upsertProduct({
        salePrice: 35,
        brandName: "Svaneke",
        name: "Pilsner",
        description: "Pilsner",
        unitSize: 50,
        sizeUnit: "cl",
        abv: 4.6,
        tags: ["beer", "bottle"],
      });
      upsertProduct({
        salePrice: 35,
        brandName: "Svaneke",
        name: "Lys Guld",
        description: "Pale Lager",
        unitSize: 50,
        sizeUnit: "cl",
        abv: 5.6,
        tags: ["beer", "bottle"],
      });
      upsertProduct({
        salePrice: 35,
        brandName: "Svaneke",
        name: "Mørk Guld",
        description: "Amber Lager",
        unitSize: 50,
        sizeUnit: "cl",
        abv: 5.7,
        ibu: 25,
        tags: ["beer", "bottle"],
      });
      upsertProduct({
        salePrice: 35,
        brandName: "Svaneke",
        name: "SolskinsAle",
        description: "Blonde Ale",
        unitSize: 50,
        sizeUnit: "cl",
        abv: 5.7,
        ibu: 25,
        tags: ["beer", "bottle"],
      });
      upsertProduct({
        salePrice: 35,
        brandName: "Svaneke",
        name: "Don't Worry Pale Ale",
        description: "Non-Alcoholic Beer",
        unitSize: 33,
        sizeUnit: "cl",
        abv: 0.5,
        tags: ["beer", "bottle"],
      });

      upsertProduct({
        salePrice: 35,
        brandName: "BornholmerØl'en",
        name: "Sommer Pajan",
        description: "APA",
        unitSize: 50,
        sizeUnit: "cl",
        abv: 4.5,
        tags: ["beer", "tap"],
      });
      upsertProduct({
        salePrice: 35,
        brandName: "BornholmerØl'en",
        name: "Rokkestenen",
        description: "Brown Ale",
        unitSize: 50,
        sizeUnit: "cl",
        abv: 4.5,
        tags: ["beer", "tap"],
      });
      upsertProduct({
        salePrice: 35,
        brandName: "BornholmerØl'en",
        name: "Opalsøen",
        description: "Classic Pilsner",
        unitSize: 50,
        sizeUnit: "cl",
        abv: 5,
        tags: ["beer", "tap"],
      });

      upsertProduct({
        salePrice: 35,
        brandName: "Beer Here",
        name: "Coffee Karma",
        description: "Dry-hopped Brown Ale w. Espresso",
        unitSize: 33,
        sizeUnit: "cl",
        abv: 6,
        tags: ["beer", "bottle"],
      });
      upsertProduct({
        salePrice: 35,
        brandName: "Beer Here",
        name: "Rynkedyr",
        description: "Dry-hopped Brown Ale w. Espresso",
        unitSize: 33,
        sizeUnit: "cl",
        abv: 6,
        tags: ["beer", "bottle"],
      });

      upsertProduct({
        salePrice: 175,
        brandName: "Penyllan",
        name: "Linnea",
        description: "Aged Brown Ale",
        unitSize: 75,
        sizeUnit: "cl",
        abv: 5,
        tags: ["beer", "bottle"],
      });
      upsertProduct({
        salePrice: 175,
        brandName: "Penyllan",
        name: "Nina",
        description: "Triple Blend Amber Ale",
        unitSize: 75,
        sizeUnit: "cl",
        abv: 6,
        tags: ["beer", "bottle"],
      });
      upsertProduct({
        salePrice: 175,
        brandName: "Penyllan",
        name: "Genevieve",
        description: "Hoppy Golden Ale",
        unitSize: 75,
        sizeUnit: "cl",
        abv: 5,
        tags: ["beer", "bottle"],
      });

      upsertProduct({
        salePrice: 10,
        brandName: "Thy",
        name: "Citron",
        description: "Lemon Soda",
        unitSize: 25,
        sizeUnit: "cl",
        tags: ["soda", "bottle"],
      });
      upsertProduct({
        salePrice: 10,
        brandName: "Thy",
        name: "Squash",
        description: "Orange Soda",
        unitSize: 25,
        sizeUnit: "cl",
        tags: ["soda", "bottle"],
      });
      upsertProduct({
        salePrice: 10,
        brandName: "Thy",
        name: "Lemon",
        description: "Lemon Soda",
        unitSize: 25,
        sizeUnit: "cl",
        tags: ["soda", "bottle"],
      });
      upsertProduct({
        salePrice: 10,
        brandName: "Thy",
        name: "Brus Rød Sodavand",
        description: "Raspberry Soda",
        unitSize: 25,
        sizeUnit: "cl",
        tags: ["soda", "bottle"],
      });

      var sheet = xlsx.parse(
        path.join(
          process.cwd().split(".meteor")[0],
          "api",
          "Zettle-Raw-Data-Report-20180801-20180831.xlsx",
        ),
        { cellDates: true },
      );
      const headers = sheet[0].data[5] as string[];
      const rows = sheet[0].data.slice(6) as (string | number | Date)[][];

      const rowsData: IZettleSale[] = [];
      for (const row of rows) {
        const rowData: Record<string, string | number | Date> = {};
        for (const headerColumnIndex in headers) {
          if (!(headerColumnIndex in row)) continue;
          let rowValue = row[headerColumnIndex];
          rowValue = typeof rowValue === "string" ? rowValue.trim() : rowValue;
          if (typeof rowValue === "string" && !rowValue) continue;

          const headerValue = headers[headerColumnIndex];
          if (
            headerValue === "Dato" ||
            headerValue === "Personale" ||
            headerValue === "Kostpris" ||
            headerValue === "Rabat (DKK)" ||
            headerValue === "Endelig pris (DKK)" ||
            headerValue === "Antal"
          )
            continue;

          rowData[headerValue] =
            headerValue === "Pris (DKK)"
              ? Number(rowValue) /
                Number(row[headers.findIndex((header) => header === "Antal")])
              : rowValue;
        }

        for (
          let i = 0;
          i < Number(row[headers.findIndex((header) => header === "Antal")]);
          i++
        ) {
          rowsData.push(rowData as unknown as IZettleSale);
        }
      }
      const missingProducts: IZettleSale[] = [];
      const foundProducts: [
        IZettleSale,
        (IProduct | undefined)[] | IProduct | undefined,
      ][] = [];
      const sales2018 = Object.values(groupBy(rowsData, "Kvitteringsnummer"))
        .map((zettleSales): ISale | null => {
          const { Kvitteringsnummer, Tid } = zettleSales[0];

          const products = zettleSales
            .map((zettleSale) => {
              const product =
                zettleSale.Navn === "Cider" &&
                zettleSale.Variant === "Somersby - Blackberry"
                  ? Products.findOne({
                      brandName: "Somersby",
                      name: "Blackberry",
                    })
                  : zettleSale.Navn === "Bottle" &&
                    zettleSale.Variant === "Hakvavit"
                  ? Products.findOne({
                      brandName: "BornHack",
                      name: "Continuous Inebriation",
                    })
                  : (zettleSale.Navn === "Shot" ||
                      zettleSale.Navn === "Dram") &&
                    zettleSale["Pris (DKK)"] === 10
                  ? Products.findOne({ brandName: "Cheap", name: "Shot" })
                  : zettleSale.Navn === "Bottled Water"
                  ? Products.findOne({ name: "Water" })
                  : zettleSale.Variant === "Faxe Kondi"
                  ? Products.findOne({ name: "Faxe Kondi" })
                  : zettleSale.Variant === "Coca Cola"
                  ? Products.findOne({ name: "Coca Cola", unitSize: "50" })
                  : zettleSale.Variant === "0.5L Club Mate Granat"
                  ? Products.findOne({
                      brandName: "Club Mate",
                      name: "Mate Granat",
                    })
                  : zettleSale.Variant === "0.5L Club Mate" ||
                    zettleSale.Navn === "Club Mate" ||
                    zettleSale.Variant === "Mate"
                  ? Products.findOne({
                      brandName: "Club Mate",
                      name: "Mate",
                    })
                  : zettleSale.Navn === "Cocio"
                  ? Products.findOne({ brandName: "Cocio", name: "Cocio" })
                  : zettleSale.Variant === "Tschunk"
                  ? Products.findOne({
                      brandName: "Club Mate",
                      name: "Tschunk",
                    })
                  : zettleSale.Variant === "Roffe Colada"
                  ? Products.findOne({ name: "Wookie Colada" })
                  : zettleSale.Variant === "Roffe Knas"
                  ? Products.findOne({ name: "Wookie Knas" })
                  : zettleSale.Variant === "Tschunk"
                  ? Products.findOne({
                      brandName: "Club Mate",
                      name: "Tschunk",
                    })
                  : zettleSale.Variant === "Purple Breeze - 4ml vodka"
                  ? Products.findOne({
                      name: "s/Purple/Green/ 04cl Breeze",
                    })
                  : zettleSale.Variant === "Purple Storm - 8ml vodka"
                  ? Products.findOne({ name: "s/Purple/Green/ 08cl Storm" })
                  : zettleSale.Variant === "Purple Hurricane - 12ml vodka"
                  ? Products.findOne({
                      name: "s/Purple/Green/ 12cl Hurricane",
                    })
                  : zettleSale.Variant === "Purple tsunami - 16ml"
                  ? Products.findOne({
                      name: "s/Purple/Green/ 16cl Tsunami",
                    })
                  : zettleSale.Navn === "Beer" && zettleSale.Variant
                  ? Products.findOne({
                      brandName: RegExp(
                        zettleSale.Variant.split(" - ")[0],
                        "gi",
                      ),
                      name: RegExp(
                        zettleSale.Variant.split(" - ")[1]
                          .replace("Solskin Ale", "SolskinsAle")
                          .replace("Green Copper", "Greencopper")
                          .replace("Don't Worry (33cl)", "Don't Worry Pale Ale")
                          .replace("Session IPA", "Laid Back"),
                        "gi",
                      ),
                    })
                  : zettleSale.Navn === "Soda" && zettleSale.Variant
                  ? Products.findOne({
                      brandName: RegExp(
                        zettleSale.Variant.split(" - ")[1],
                        "gi",
                      ),
                      name: RegExp(zettleSale.Variant.split(" - ")[0], "gi"),
                    })
                  : zettleSale.Navn === "Lys guld"
                  ? Products.findOne({ name: "Lys Guld" })
                  : zettleSale.Variant === "Gin & Tonic 4cl"
                  ? Products.findOne({ name: "{Gin; Tonic}" })
                  : zettleSale.Variant === "Cuba Libre 4cl"
                  ? [
                      Products.findOne({ name: "Coca Cola", unitSize: "50" }),
                      Products.findOne({ brandName: "Cheap", name: "Shot" }),
                      Products.findOne({ brandName: "Cheap", name: "Shot" }),
                    ]
                  : zettleSale.Navn === "6 ulækre gamle danske sataner"
                  ? [
                      Products.findOne({ brandName: "Cheap", name: "Shot" }),
                      Products.findOne({ brandName: "Cheap", name: "Shot" }),
                      Products.findOne({ brandName: "Cheap", name: "Shot" }),
                      Products.findOne({ brandName: "Cheap", name: "Shot" }),
                      Products.findOne({ brandName: "Cheap", name: "Shot" }),
                      Products.findOne({ brandName: "Cheap", name: "Shot" }),
                    ]
                  : false;

              product
                ? foundProducts.push([zettleSale, product])
                : missingProducts.push(zettleSale);

              return Array.isArray(product) ? product : [product];
            })
            .flat()
            .filter((product): product is IProduct => Boolean(product));
          if (!products.length) return null;
          return {
            _id: String(Kvitteringsnummer),
            currency: "HAX",
            country: "DK",
            timestamp: Tid,
            amount: zettleSales.reduce(
              (sum, zettleSale) => sum + zettleSale["Pris (DKK)"],
              0,
            ),
            products,
            locationId: "bTasxE2YYXZh35wtQ",
          };
        })
        .filter((sale): sale is ISale => Boolean(sale));

      console.log(sales2018.length);
      console.log(Sales.find({}, { limit: 1 }).fetch()[0]);
      console.log(
        Object.entries(
          countBy(missingProducts, ({ Navn, Variant }) =>
            Variant ? Navn + " | " + Variant : Navn,
          ),
        ).sort(([, a], [, b]) => a - b),
        uniqBy(missingProducts, ({ Navn, Variant }) =>
          Variant ? Navn + Variant : Navn,
        ).length,
      );
      console.log(
        "Unique products recognized: " +
          (uniqBy(foundProducts, ([{ Navn, Variant }]) => Navn + Variant)
            .length /
            (uniqBy(foundProducts, ([{ Navn, Variant }]) => Navn + Variant)
              .length +
              uniqBy(missingProducts, ({ Navn, Variant }) => Navn + Variant)
                .length)) *
            100 +
          "%",
      );
      console.log(
        "Products sold recognized: " +
          (foundProducts.length /
            (foundProducts.length + missingProducts.length)) *
            100 +
          "%",
      );
      console.log(foundProducts.length, missingProducts.length);
      sales2018.forEach((sale) => {
        Sales.upsert({ _id: sale._id }, { $set: sale });
      });
    });
  });

const Sales = new Mongo.Collection<ISale>("sales");

Meteor.methods({
  "Sales.sellProducts"({
    locationSlug,
    productIds,
  }: {
    locationSlug: ILocation["slug"];
    productIds: IProduct["_id"][];
  }) {
    if (this.isSimulation) return;
    if (!locationSlug || !productIds) throw new Meteor.Error("misisng");
    const { userId } = this;
    if (!userId) throw new Meteor.Error("log in please");
    const location = Locations.findOne({ slug: locationSlug });
    if (!location) throw new Meteor.Error("invalid location");

    if (!isUserInTeam(userId, location.teamName))
      throw new Meteor.Error("Wait that's illegal");

    const newSale = {
      userId,
      locationId: location._id,
      currency: "HAX",
      country: "DK",
      amount: productIds.reduce(
        (m: number, _id) => m + Number(Products.findOne({ _id })?.salePrice),
        0,
      ),
      timestamp: new Date(),
      products: productIds.map((_id) => Products.findOne({ _id })!),
    };
    return Sales.insert(newSale);
  },
});

export default Sales;

//@ts-expect-error
if (Meteor.isClient) window.Sales = Sales;
