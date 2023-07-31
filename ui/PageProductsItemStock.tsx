import { css } from "@emotion/css";
import { useFind } from "meteor/react-meteor-data";
import React, { ReactNode, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import ReactSelect from "react-select";
import { IProduct, productsMethods } from "../api/products";
import Stocks from "../api/stocks";
import useMethod from "../hooks/useMethod";

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
export default function PageProductsItemStock({
  onCancel,
  product,
}: {
  onCancel: () => void;
  product?: IProduct;
}) {
  const [editProduct] = useMethod<
    Parameters<(typeof productsMethods)["Products.editProduct"]>[0]
  >("Products.editProduct");
  const [showRemoved] = useState(false);

  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<Partial<IProduct> & { buyPrice: number }>({
    defaultValues: { components: product?.components },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "components",
  });
  const onSubmit2 = async (data: Pick<IProduct, "components">) => {
    if (product) await editProduct({ productId: product._id, data });

    onCancel?.();
    reset();
  };

  const stocks = useFind(
    () =>
      Stocks.find(
        { removedAt: { $exists: showRemoved } },
        { sort: { name: -1, createdAt: -1 } },
      ),
    [showRemoved],
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
      <fieldset>
        <legend>{product?.name}</legend>
        {fields.map((field, index) => (
          <fieldset key={field.id}>
            <div
              className={css`
                flex: 1;
              `}
            >
              {stocks.find(({ _id }) => _id === field.stockId)?.name}
            </div>
            <input
              {...register(`components.${index}.unitSize`)}
              type="number"
            />
            <input {...register(`components.${index}.sizeUnit`)} />
            <button type="button" onClick={() => remove(index)}>
              <small>Remove</small>
            </button>
          </fieldset>
        ))}
        <Label label="Components">
          <ReactSelect
            value={null}
            options={stocks
              .filter(
                ({ _id }) =>
                  !fields.length ||
                  fields.some(({ stockId }) => stockId !== _id),
              )
              .map((stock) => ({
                label: stock.name,
                value: stock._id,
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
            {product ? "Update" : "Create"} {isSubmitting ? "..." : ""}
          </button>
          <button disabled={!isDirty} type="button" onClick={() => reset()}>
            Reset
          </button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </fieldset>
    </form>
  );
}
