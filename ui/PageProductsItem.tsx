import { css } from "@emotion/css";
import { useFind } from "meteor/react-meteor-data";
import React, { ReactNode, useCallback, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import ReactSelect, { createFilter } from "react-select";
import CreatableSelect from "react-select/creatable";
import Locations, { ILocation } from "../api/locations";
import Products, { IProduct } from "../api/products";
import Stocks from "../api/stocks";
import BarcodeScannerComponent from "../components/BarcodeScanner";
import { packageTypes } from "../data";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useMethod from "../hooks/useMethod";
import { units } from "../util";
import { Modal } from "./PageProducts";

const toOptions = (items: any[]) =>
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
        display: flex;
        > * {
          flex: 50%;
        }
      `}
    >
      {children}
    </div>
  </div>
);
export default function PageProductsItem({
  onCancel,
  product,
}: {
  onCancel: () => void;
  product?: IProduct;
}) {
  const locations = useFind(() => Locations.find(), []);
  const [scanningBarcode, setScanningBarcode] = useState(false);
  const { location } = useCurrentLocation();
  const [addProduct] = useMethod("Products.addProduct");
  const [editProduct] = useMethod("Products.editProduct");
  const products = useFind(() => Products.find(), []);
  const allTags = [
    ...products.reduce((memo, product) => {
      product.tags?.forEach((tag) => memo.add(tag.trim()));

      return memo;
    }, new Set<string>()),
  ].filter(Boolean);
  const allBrandNames = [
    ...products.reduce((memo, product) => {
      if (product.brandName) memo.add(product.brandName);

      return memo;
    }, new Set<string>()),
  ].filter(Boolean);

  const {
    handleSubmit,
    register,
    control,
    reset,
    formState: { errors, isDirty, isSubmitting },
    setValue,
  } = useForm<Partial<IProduct> & { buyPrice: number }>({
    defaultValues: { components: product?.components },
  });

  const handleBarCode = useCallback(
    (resultBarCode: string) => {
      setValue("barCode", resultBarCode, { shouldDirty: true });
      setScanningBarcode(false);
    },
    [setValue],
  );

  const { fields, append, remove } = useFieldArray({
    control,
    name: "components",
  });

  const stocks = useFind(
    () => Stocks.find({}, { sort: { name: -1, createdAt: -1 } }),
    [],
  );

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        if (!product) {
          await addProduct({ data: { ...data, tap: data.tap || undefined } });
        } else if (product) {
          await editProduct({
            productId: product._id,
            data: { ...data, tap: data.tap || undefined },
          });
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
          rules={{ required: true }}
          defaultValue={product?.brandName || ""}
          render={({ field: { onBlur, value } }) => (
            <CreatableSelect
              required
              value={value ? { value, label: value } : null}
              isClearable
              options={toOptions(allBrandNames || [])}
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
          defaultValue={product?.name || ""}
          {...register("name", { required: true })}
        />
      </Label>
      <Label label="Price">
        <input
          required
          type="number"
          defaultValue={product?.salePrice || ""}
          {...register("salePrice", { required: true })}
        />
      </Label>
      <Label label="Unit Size">
        <input
          required
          type="number"
          step="any"
          defaultValue={product?.unitSize || ""}
          {...register("unitSize")}
        />
        <Controller
          name="sizeUnit"
          control={control}
          defaultValue={product?.sizeUnit}
          render={({ field: { onBlur, value } }) => (
            <ReactSelect
              required
              value={value && { value: value, label: value }}
              options={units.map((code) => ({ value: code, label: code }))}
              onBlur={onBlur}
              onChange={(newValue) =>
                setValue("sizeUnit", newValue?.value, { shouldDirty: true })
              }
            />
          )}
        />
      </Label>
      <Label label="Alcohol %">
        <input
          type="number"
          step="any"
          defaultValue={product?.abv || ""}
          {...register("abv")}
        />
      </Label>
      <Label label="Description">
        <input
          type="text"
          defaultValue={product?.description || ""}
          {...register("description")}
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
            defaultValue={product?.barCode || ""}
            {...register("barCode")}
          />
        </div>
        {scanningBarcode ? (
          <Modal onDismiss={() => setScanningBarcode(false)}>
            <BarcodeScannerComponent onResult={handleBarCode} />
          </Modal>
        ) : null}
      </Label>
      <Label label="Tap">
        <select defaultValue={product?.tap || ""} {...register("tap")}>
          <option value="">---</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
        </select>
      </Label>
      <Label label="Tags">
        <Controller
          name="tags"
          control={control}
          defaultValue={product?.tags}
          render={({ field: { onBlur, value } }) => (
            <CreatableSelect
              value={value ? toOptions(value) : null}
              options={toOptions(allTags || [])}
              isMulti
              onBlur={onBlur}
              className={css`
                color: black;
              `}
              onChange={(newValue) =>
                setValue("tags", newValue?.map(({ value }) => value) || [], {
                  shouldDirty: true,
                })
              }
            />
          )}
        />
      </Label>
      <Label label="Unit Cost">
        <input type="number" step="any" {...register("buyPrice")} />
        <small>
          <ul
            className={css`
              padding: 0;
              padding-left: 16px;
              margin: 0;
            `}
          >
            {Array.from(product?.shopPrices || [])
              .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
              .map(({ timestamp, buyPrice }) => (
                <li
                  key={String(timestamp)}
                >{`${buyPrice} kr. as of ${new Intl.DateTimeFormat("da-DK", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  second: "numeric",
                }).format(timestamp)}`}</li>
              ))}
          </ul>
        </small>
      </Label>
      <fieldset>
        <legend>Components From Stock</legend>
        {fields.map((field, index) => (
          <fieldset key={field.id}>
            <legend
              className={css`
                flex: 1;
              `}
            >
              {stocks.find(({ _id }) => _id === field.stockId)?.name}
            </legend>
            <div
              className={css`
                display: flex;
              `}
            >
              <input
                required
                {...register(`components.${index}.unitSize`, {
                  required: true,
                })}
                step="any"
                type="number"
              />
              <Controller
                name={`components.${index}.sizeUnit`}
                control={control}
                render={({ field: { onBlur, value } }) => (
                  <ReactSelect
                    required
                    value={value && { value: value, label: value }}
                    options={units.map((code) => ({
                      value: code,
                      label: code,
                    }))}
                    onBlur={onBlur}
                    onChange={(newValue) => {
                      const newSizeUnit = newValue?.value;
                      if (newSizeUnit)
                        setValue(`components.${index}.sizeUnit`, newSizeUnit, {
                          shouldDirty: true,
                        });
                    }}
                  />
                )}
              />
              <button type="button" onClick={() => remove(index)}>
                <small>Remove</small>
              </button>
            </div>
          </fieldset>
        ))}
        <ReactSelect
          value={null}
          placeholder={
            fields.length ? "Additional component..." : "Add component..."
          }
          filterOption={createFilter({
            stringify: (option) =>
              `${option.label} ${option.value} ${option.data?.barCode || ""}`,
          })}
          options={stocks
            .filter(
              ({ _id }) =>
                !fields.length || fields.some(({ stockId }) => stockId !== _id),
            )
            .map((stock) => ({
              label: `${stock.name} (${stock.unitSize}${
                stock.sizeUnit
              }, ${packageTypes.find(({ code }) => stock.packageType === code)
                ?.name})`,
              value: stock._id,
              barCode: stock.barCode,
            }))}
          onChange={(newValue) => {
            const stock = stocks.find(({ _id }) => _id === newValue?.value);
            if (stock) {
              append({
                stockId: stock._id,
                unitSize: stock.unitSize,
                sizeUnit: stock.sizeUnit,
              });
            }
          }}
        />
      </fieldset>
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
          {product ? "Update" : "Create"} {isSubmitting ? "..." : ""}
        </button>
        <button disabled={!isDirty} type="button" onClick={() => reset()}>
          Reset
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <div>
        {product?.locationIds?.filter((id) => id !== location?._id).length ? (
          <small>
            <br />
            Product is on the menu at:{" "}
            {product?.locationIds
              ?.filter((id) => id !== location?._id)
              .map((id) => locations.find(({ _id }) => id === _id))
              .filter((location): location is ILocation => Boolean(location))
              .map(({ slug, name }) => <span key={slug}>{name}</span>)}
          </small>
        ) : null}
      </div>
    </form>
  );
}
