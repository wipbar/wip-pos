import React, { useState } from "react";
import useMethod from "../hooks/useMethod";
import { Controller, useForm } from "react-hook-form";
import useMongoFetch from "../hooks/useMongoFetch";
import Products from "../api/products";
import CreatableSelect from "react-select/creatable";
import { css } from "emotion";
import useCurrentLocation from "../hooks/useCurrentLocation";

const toOptions = (items) =>
  items.map((item) => ({ label: item, value: item }));

const Label = ({ label, children }) => (
  <label
    className={css`
      display: flex;
      width: 400px;
      align-items: center;
    `}
  >
    <small
      className={css`
        flex: 0.4;
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
export default function PageStockItem({ onSubmit, product }) {
  const { location } = useCurrentLocation();
  const formId = product ? product._id : "newProductForm";
  const [isEditing, setIsEditing] = useState(false);
  const [addProduct] = useMethod("Products.addProduct");
  const [editProduct] = useMethod("Products.editProduct");
  const [removeProduct] = useMethod("Products.removeProduct");
  const { data: products } = useMongoFetch(Products);
  const allTags = [
    ...products.reduce((memo, product) => {
      product.tags?.forEach((tag) => memo.add(tag.trim()));

      return memo;
    }, new Set()),
  ].filter(Boolean);
  const allBrandNames = [
    ...products.reduce((memo, product) => {
      memo.add(product.brandName);

      return memo;
    }, new Set()),
  ].filter(Boolean);

  const {
    handleSubmit,
    register,
    control,
    reset,
    errors,
    formState: { isDirty },
    setValue,
  } = useForm();

  const onSubmit2 = (data) => {
    console.log(data);
    if (!product) {
      addProduct({ data });
    } else if (product) {
      editProduct({ productId: product._id, data });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit2)}
      className={css`
        display: flex;
        flex-direction: column;
      `}
    >
      <Label label="Brand">
        <Controller
          name="brandName"
          control={control}
          rules={{ required: true }}
          defaultValue={product?.brandName || ""}
          render={({ onBlur, value }) => (
            <CreatableSelect
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
          type="text"
          name="name"
          defaultValue={product?.name || ""}
          ref={register({ required: true })}
        />
      </Label>
      <Label label="Price">
        <input
          type="number"
          name="salePrice"
          defaultValue={product?.salePrice || ""}
          ref={register({ required: true })}
        />
      </Label>
      <Label label="Unit Size">
        <input
          type="number"
          name="unitSize"
          defaultValue={product?.unitSize || ""}
          ref={register}
        />
      </Label>
      <Label label="Size Unit">
        <input
          type="text"
          name="sizeUnit"
          defaultValue={product?.sizeUnit || ""}
          ref={register}
        />
      </Label>
      <Label label="Alcohol %">
        <input
          type="number"
          name="abv"
          step="any"
          defaultValue={product?.abv || ""}
          ref={register}
        />
      </Label>
      <Label label="Description">
        <input
          type="text"
          name="description"
          defaultValue={product?.description || ""}
          ref={register}
        />
      </Label>
      <Label label="Tags">
        <Controller
          name="tags"
          control={control}
          defaultValue={product?.tags}
          render={({ onBlur, value }) => (
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
      <div>
        <button
          disabled={!isDirty}
          type="submit"
          className={css`
            width: 200px;
          `}
        >
          {product ? "Update" : "Create"}
        </button>
        <button disabled={!isDirty} type="button" onClick={reset}>
          Reset
        </button>
        {product ? (
          <button
            onClick={() =>
              editProduct({
                productId: product._id,
                data: product.locationIds?.includes(location?._id)
                  ? {
                      locationIds: product.locationIds.filter(
                        (id) => id !== location?._id,
                      ),
                    }
                  : {
                      locationIds: [
                        ...(product.locationIds || []),
                        location?._id,
                      ],
                    },
              })
            }
          >
            {product.locationIds?.includes(location?._id)
              ? "Remove from menu"
              : "Add to menu"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
