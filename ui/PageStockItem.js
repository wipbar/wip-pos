import React, { useState } from "react";
import useMethod from "../hooks/useMethod";
import { Controller, useForm } from "react-hook-form";
import useMongoFetch from "../hooks/useMongoFetch";
import Products from "../api/products";
import CreatableSelect from "react-select/creatable";
import { css } from "emotion";

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

  const { handleSubmit, register, control, errors, setValue } = useForm();
  const onSubmit2 = (data) => {
    console.log(data);
    if (!product) {
      addProduct({ data });
    } else if (product) {
      editProduct({ productId: product._id, data });
    }
  };
  console.log(errors);
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
              defaultValue={value || ""}
              isClearable
              options={toOptions(allBrandNames)}
              onBlur={onBlur}
              onChange={(option) => setValue("brandName", option?.value || "")}
              className={css`
                color: black;
              `}
            />
          )}
        />
        {errors.brandName?.message}
      </Label>
      <Label label="Name">
        <input type="text" name="name" ref={register({ required: true })} />
      </Label>
      <Label label="Price">
        <input
          type="number"
          name="salePrice"
          ref={register({ required: true })}
        />
      </Label>
      <Label label="Unit Size">
        <input type="number" name="unitSize" ref={register} />
      </Label>
      <Label label="Size Unit">
        <input type="text" name="sizeUnit" ref={register} />
      </Label>
      <Label label="Alcohol %">
        <input type="number" name="abv" step="any" ref={register} />
      </Label>
      <Label label="Description">
        <input type="text" name="description" ref={register} />
      </Label>
      <Label label="Tags">
        <Controller
          name="tags"
          control={control}
          defaultValue={product?.tags || []}
          render={({ onBlur, value }) => (
            <CreatableSelect
              defaultValue={value}
              options={toOptions(allTags)}
              isMulti
              onBlur={onBlur}
              className={css`
                color: black;
              `}
              onChange={(newValue) =>
                setValue("tags", newValue?.map(({ value }) => value) || [])
              }
            />
          )}
        />
      </Label>
      <input
        type="submit"
        className={css`
          width: 200px;
        `}
      />
    </form>
  );
}
