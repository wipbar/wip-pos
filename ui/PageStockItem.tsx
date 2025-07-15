import { css } from "@emotion/css";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import { format } from "date-fns";
import { useFind } from "meteor/react-meteor-data";
import React, { ReactNode, useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import ReactSelect from "react-select";
import Products, { ProductID } from "../api/products";
import { IStock } from "../api/stocks";
import BarcodeScannerComponent from "../components/BarcodeScanner";
import FontAwesomeIcon from "../components/FontAwesomeIcon";
import { packageTypes } from "../data";
import useMethod from "../hooks/useMethod";
import { units } from "../util";
import { Modal } from "./PageProducts";
import PageProductsItem from "./PageProductsItem";

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
  const products = useFind(() =>
    Products.find({ removedAt: { $exists: false } }),
  );

  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { isDirty, isSubmitting },
    setValue,
  } = useForm<
    Partial<IStock> &
      Pick<IStock, "name" | "packageType" | "sizeUnit" | "unitSize">
  >();

  const handleBarCode = useCallback(
    (resultBarCode: string) => {
      setValue("barCode", resultBarCode);
      setScanningBarcode(false);
    },
    [setValue],
  );

  const productsUsingStock = products.filter(
    (product) =>
      product?.components?.some(
        (component) => component.stockId === stock?._id,
      ),
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
        <Label label="Name">
          <input
            required
            type="text"
            defaultValue={stock?.name || ""}
            {...register("name", { required: true })}
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
          {stock?.levels?.map((level, i) => (
            <div
              key={i}
              className={css`
                display: flex;
                justify-content: space-between;
                align-items: center;
              `}
            >
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                `}
              >
                <div
                  className={css`
                    margin-bottom: 4px;
                  `}
                >
                  {format(level.timestamp, "YYYY/MM/DD HH:mm")} -{" "}
                  {String(level.count)} x {stock.unitSize}
                  {stock.sizeUnit}
                </div>
              </div>
            </div>
          ))}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!stock) return;

              const countInput = e.currentTarget.elements.namedItem("count");
              if (countInput instanceof HTMLInputElement) {
                await takeStock({
                  stockId: stock._id,
                  count: countInput.valueAsNumber,
                });
                countInput.value = "";
              }
            }}
          >
            <input
              required
              min={0}
              step={1}
              name="count"
              type="number"
              placeholder="New Stock Level"
            />
            <button>Take Stock</button>
          </form>
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
            {productsUsingStock.map((product) => (
              <li key={product._id}>
                {product.brandName} - {product.name}{" "}
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
            ))}
          </ul>
        </fieldset>
      ) : null}
    </>
  );
}
