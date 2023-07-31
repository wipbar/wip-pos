import { css } from "@emotion/css";
import React, { ReactNode, useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import ReactSelect from "react-select";
import { IStock } from "../api/stocks";
import BarcodeScannerComponent from "../components/BarcodeScanner";
import { packageTypes } from "../data";
import useMethod from "../hooks/useMethod";
import { Modal } from "./PageProducts";

const Label = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode | ReactNode[];
}) => (
  <label
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
  </label>
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

  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { isDirty, isSubmitting },
    setValue,
  } = useForm<Partial<IStock>>();
  const onSubmit2 = async (data: Partial<IStock>) => {
    if (!stock) {
      await addStock({ data });
    } else if (stock) {
      await editStock({ stockId: stock._id, data });
    }
    onCancel?.();
    reset();
  };

  const handleBarCode = useCallback(
    (resultBarCode: string) => {
      setValue("barCode", resultBarCode);
      setScanningBarcode(false);
    },
    [setValue],
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit2)}
      className={css`
        display: flex;
        flex-direction: column;
        align-content: center;
      `}
    >
      <Label label="Name">
        <input
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
            const packageType = packageTypes.find(({ code }) => code === value);
            return (
              <ReactSelect
                value={
                  packageType && {
                    value: packageType.code,
                    label: packageType.name,
                  }
                }
                options={packageTypes.map(({ code, name }) => ({
                  value: code,
                  label: name,
                }))}
                onBlur={onBlur}
                onChange={(newValue) =>
                  setValue("packageType", newValue?.value, {
                    shouldDirty: true,
                  })
                }
              />
            );
          }}
        />
      </Label>
      <Label label="Unit Size">
        <input
          type="number"
          defaultValue={stock?.unitSize || ""}
          {...register("unitSize")}
        />
      </Label>
      <Label label="Size Unit">
        <Controller
          name="sizeUnit"
          control={control}
          defaultValue={stock?.sizeUnit}
          render={({ field: { onBlur, value } }) => (
            <ReactSelect
              value={value && { value: value, label: value }}
              // @ts-expect-error
              options={["cl", "l", "pc"].map((code) => ({
                value: code,
                label: code,
              }))}
              onBlur={onBlur}
              onChange={(newValue) =>
                setValue("sizeUnit", newValue?.value, { shouldDirty: true })
              }
            />
          )}
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
          {stock ? "Update" : "Create"} {isSubmitting ? "..." : ""}
        </button>
        <button disabled={!isDirty} type="button" onClick={() => reset()}>
          Reset
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
