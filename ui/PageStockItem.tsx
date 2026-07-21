import { css } from "@emotion/css";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { format } from "date-fns";
import omit from "lodash/omit";
import { useFind } from "meteor/react-meteor-data";
import { lazy, type ReactNode, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import ReactSelect from "react-select";
import CreatableSelect from "react-select/creatable";
import Products, {
  getProductBrandName,
  getProductName,
  type ProductID,
} from "../api/products";
import Sales from "../api/sales";
import type { IStock } from "../api/stocks";
import Stocks, { getServingsSold } from "../api/stocks";
import BarcodeScannerComponent from "../components/BarcodeScanner";
import FontAwesomeIcon from "../components/FontAwesomeIcon";
import { packageTypes } from "../data";
import useEvent from "../hooks/useEvent";
import useMethod from "../hooks/useMethod";
import useSubscription from "../hooks/useSubscription";
import { emptyArray, units } from "../util";
import { Modal } from "./PageProducts";

const PageProductsItem = lazy(() => import("./PageProductsItem"));

const toOptions = (items: string[]) =>
  items.map((item) => ({ label: item, value: item }));

const Label = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode | ReactNode[];
}) => (
  <div
    className={css`
      display: flex;
      width: 480px;
      align-items: center;
      > div > input {
        width: 100%;
      }
    `}
  >
    <small
      className={css`
        flex: 0.33;
        text-align: right;
        margin-right: 4px;
      `}
    >
      {label}:
    </small>
    <div
      className={css`
        flex: 1;
      `}
    >
      {children}
    </div>
  </div>
);
export default function PageStockItem({
  onCancel,
  stock,
}: {
  onCancel: () => void;
  stock?: IStock;
}) {
  const [scanningBarcode, setScanningBarcode] = useState(false);
  const [addStock] = useMethod("Stock.addStock");
  const [editStock] = useMethod("Stock.editStock");
  const [takeStock] = useMethod("Stock.takeStock");
  const [isEditingProduct, setIsEditingProduct] = useState<null | ProductID>();
  const products = useFind(
    () => Products.find({ removedAt: { $exists: false } }),
    [],
  );
  const stocks = useFind(
    () => Stocks.find({ removedAt: { $exists: false } }),
    [],
  );

  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting },
    setValue,
  } = useForm<
    Partial<IStock> &
      Pick<IStock, "name" | "packageType" | "sizeUnit" | "unitSize">
  >();

  const handleBarCode = useEvent((resultBarCode: string) => {
    setValue("barCode", resultBarCode, { shouldDirty: true });
    setScanningBarcode(false);
  });

  const productsUsingStock = products.filter(
    (product) =>
      product?.components?.some(
        (component) => component.stockId === stock?._id,
      ),
  );

  const allBrandNames = useMemo(
    () =>
      Array.from(
        [...products, ...stocks].reduce((memo, doc) => {
          if (doc.brandName) memo.add(doc.brandName);

          return memo;
        }, new Set<string>()),
      ).filter(Boolean),
    [products, stocks],
  );

  return (
    <>
      {isEditingProduct ? (
        <Modal onDismiss={() => setIsEditingProduct(null)}>
          <PageProductsItem
            product={products.find((p) => p._id === isEditingProduct)}
            onCancel={() => setIsEditingProduct(null)}
          />
        </Modal>
      ) : null}
      <form
        onSubmit={handleSubmit(async (data) => {
          if (!stock) {
            await addStock({ data });
          } else if (stock) {
            await editStock({ stockId: stock._id, data });
          }
          onCancel?.();
          reset();
        })}
        className={css`
          display: flex;
          flex-direction: column;
          align-content: center;
        `}
      >
        <Label label="Brand">
          <Controller
            name="brandName"
            control={control}
            defaultValue={stock?.brandName || ""}
            render={({ field: { onBlur, value } }) => (
              <CreatableSelect
                required
                value={value ? { value, label: value } : null}
                isClearable
                options={toOptions(allBrandNames || emptyArray)}
                onBlur={onBlur}
                onChange={(option) =>
                  setValue("brandName", option?.value || "", {
                    shouldDirty: true,
                  })
                }
                className={css`
                  color: black;
                `}
              />
            )}
          />
          {errors.brandName?.message}
        </Label>
        <Label label="Name">
          <input
            required
            type="text"
            defaultValue={stock?.name || ""}
            {...register("name", { required: true })}
          />
        </Label>
        <Label label="Description">
          <input
            type="text"
            defaultValue={stock?.description || ""}
            {...register("description")}
          />
        </Label>
        <Label label="Packaging">
          <Controller
            name="packageType"
            control={control}
            defaultValue={stock?.packageType}
            render={({ field: { onBlur, value } }) => {
              const packageType = packageTypes.find(
                ({ code }) => code === value,
              );
              return (
                <ReactSelect
                  required
                  value={
                    packageType && {
                      value: packageType.code,
                      label: packageType.name,
                    }
                  }
                  options={Array.from(packageTypes)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(({ code, name }) => ({
                      value: code,
                      label: name,
                    }))}
                  onBlur={onBlur}
                  onChange={(newValue) =>
                    setValue(
                      "packageType",
                      newValue?.value as IStock["packageType"],
                      { shouldDirty: true },
                    )
                  }
                />
              );
            }}
          />
        </Label>
        <Label label="Unit Size">
          <div
            className={css`
              display: flex;

              > * {
                flex: 1;
              }
            `}
          >
            <input
              required
              type="number"
              step="any"
              // If there are stock levels, we don't want to allow changing the unit size, as that would make the stock levels invalid.
              disabled={Boolean(stock?.levels?.length)}
              defaultValue={stock?.unitSize || ""}
              {...register("unitSize", { valueAsNumber: true })}
            />
            <Controller
              name="sizeUnit"
              control={control}
              defaultValue={stock?.sizeUnit}
              render={({ field: { onBlur, value } }) => (
                <ReactSelect
                  required
                  value={value && { value: value, label: value }}
                  options={units.map((code) => ({ value: code, label: code }))}
                  onBlur={onBlur}
                  onChange={(newValue) =>
                    setValue(
                      "sizeUnit",
                      newValue?.value as IStock["sizeUnit"],
                      { shouldDirty: true },
                    )
                  }
                />
              )}
            />
          </div>
        </Label>
        <Label label="Alcohol %">
          <input
            type="number"
            step="any"
            defaultValue={stock?.abv ?? ""}
            {...register("abv", { valueAsNumber: true })}
          />
        </Label>
        <Label label="Bar Code">
          <div
            className={css`
              white-space: nowrap;
            `}
          >
            <button type="button" onClick={() => setScanningBarcode(true)}>
              Scan
            </button>
            <input
              type="text"
              defaultValue={stock?.barCode || ""}
              {...register("barCode")}
            />
          </div>
          {scanningBarcode ? (
            <Modal onDismiss={() => setScanningBarcode(false)}>
              <BarcodeScannerComponent onResult={handleBarCode} />
            </Modal>
          ) : null}
        </Label>
        <hr />
        <div
          className={css`
            display: flex;
            justify-content: space-around;
          `}
        >
          <button
            disabled={!isDirty}
            type="submit"
            className={css`
              width: 200px;
            `}
          >
            {stock ? "Update Stock" : "Create Stock"}{" "}
            {isSubmitting ? "..." : ""}
          </button>
          <button disabled={!isDirty} type="button" onClick={() => reset()}>
            Reset
          </button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
      <hr />
      {stock ? (
        <fieldset
          className={css`
            display: flex;
            flex-direction: column;
            align-content: center;
          `}
        >
          <legend>{stock?.name} Stock Levels</legend>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!stock) return;
              const form = e.currentTarget;

              const countInput = form.elements.namedItem("count");
              const buyPriceInput = form.elements.namedItem("buyPrice");
              if (
                countInput instanceof HTMLInputElement &&
                buyPriceInput instanceof HTMLInputElement
              ) {
                await takeStock({
                  stockId: stock._id,
                  count: countInput.valueAsNumber,
                  buyPrice:
                    buyPriceInput.valueAsNumber >= 0
                      ? buyPriceInput.valueAsNumber
                      : undefined,
                });
                countInput.value = "";
                buyPriceInput.value = "";
              }
            }}
          >
            <input
              required
              min={0}
              step="any"
              name="count"
              type="number"
              placeholder="Stock Level"
            />
            <input
              min={0}
              step="any"
              name="buyPrice"
              type="number"
              placeholder="Buy Price (optional)"
            />
            <button>Take Stock</button>
          </form>
          {Array.from(stock?.levels ?? [])
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .map((level, i) => (
              <div key={i}>
                <StockSales
                  stock={stock}
                  from={level.timestamp}
                  to={i === 0 ? new Date() : stock.levels![i - 1]!.timestamp}
                />
                <div
                  className={css`
                    display: flex;
                    margin-bottom: 4px;
                    justify-content: space-between;
                  `}
                >
                  <div
                    className={css`
                      display: flex;
                    `}
                  >
                    {format(level.timestamp, "yyyy/MM/dd HH:mm")} -{" "}
                    {String(level.count)} x {stock.unitSize}
                    {stock.sizeUnit}
                  </div>
                  <form
                    className={css`
                      display: flex;
                      gap: 3px;
                      align-items: center;
                    `}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      const form = e.currentTarget;

                      const buyPriceInput = form.elements.namedItem("buyPrice");
                      if (buyPriceInput instanceof HTMLInputElement) {
                        const buyPrice = buyPriceInput.valueAsNumber;
                        try {
                          for (const element of form.elements) {
                            if (
                              element instanceof HTMLInputElement ||
                              element instanceof HTMLButtonElement
                            ) {
                              element.disabled = true;
                            }
                          }
                          buyPriceInput.disabled = true;
                          await editStock({
                            stockId: stock._id,
                            data: {
                              levels: stock.levels?.map((l, j) =>
                                j === i
                                  ? buyPrice >= 0
                                    ? { ...l, buyPrice }
                                    : omit(l, "buyPrice")
                                  : l,
                              ),
                            },
                          });
                        } finally {
                          for (const element of form.elements) {
                            if ("disabled" in element) element.disabled = false;
                          }
                        }
                      }
                    }}
                  >
                    <input
                      min={0}
                      step="any"
                      name="buyPrice"
                      type="number"
                      placeholder="DKK each"
                      defaultValue={level.buyPrice ?? ""}
                      className={css`
                        width: 80px;
                        text-align: right;
                        font-family: monospace;
                      `}
                    />
                    <span
                      className={css`
                        font-size: 12px;
                      `}
                    >
                      DKK
                      <br />
                      each
                    </span>
                    <button type="submit">💾</button>
                  </form>
                </div>
              </div>
            ))}
        </fieldset>
      ) : null}
      {productsUsingStock.length > 0 ? (
        <fieldset
          className={css`
            display: flex;
            flex-direction: column;
            align-content: center;
          `}
        >
          <legend>Products using this stock</legend>
          <ul>
            {productsUsingStock.map((product) => {
              const name = getProductName(product, stocks);
              const brandName = getProductBrandName(product, stocks);
              return (
                <li key={product._id}>
                  {brandName} - {name}{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      setIsEditingProduct(product._id);
                    }}
                  >
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : null}
    </>
  );
}

function StockSales({
  stock,
  from,
  to,
}: {
  stock: IStock;
  from: Date;
  to: Date;
}) {
  const loading = useSubscription("sales", { from, to });
  const campSales = useFind(
    () => Sales.find({ timestamp: { $gte: from, $lt: to } }),
    [from, to],
  );

  const totalSold = useMemo(
    () => getServingsSold(campSales, stock),
    [campSales, stock],
  );

  return (
    <div
      className={css`
        display: flex;
        justify-content: center;
        gap: 4px;
        ${loading ? "opacity: 0.5;" : "opacity: 0.8;"}
        font-size: 0.75em;
      `}
    >
      <b>
        {loading
          ? "🧮"
          : totalSold.toLocaleString("da-EN", { maximumFractionDigits: 2 })}
      </b>{" "}
      x {stock.unitSize}
      {stock.sizeUnit} sold since
    </div>
  );
}
