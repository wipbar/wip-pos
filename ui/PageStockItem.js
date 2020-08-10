import React from "react";
import useMethod from "../hooks/useMethod";
import { Controller, useForm } from "react-hook-form";
import useMongoFetch from "../hooks/useMongoFetch";
import Products from "../api/products";
import CreatableSelect from "react-select/creatable";
import { css } from "emotion";

export default function PageStockItem({ onSubmit, initialValues }) {
  const formId = initialValues ? initialValues._id : "newProductForm";
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

  const { handleSubmit, register, control, errors, setValue } = useForm();
  const onSubmit2 = (values) => console.log(values);

  return (
    <form onSubmit={handleSubmit(onSubmit2)}>
      <input
        type="text"
        placeholder="brandName"
        name="brandName"
        ref={register({ required: true })}
      />
      <input type="number" placeholder="name" name="name" ref={register} />
      <input
        type="number"
        placeholder="salePrice"
        name="salePrice"
        ref={register({ required: true })}
      />
      <input
        type="number"
        placeholder="unitSize"
        name="unitSize"
        ref={register}
      />
      <input
        type="text"
        placeholder="sizeUnit"
        name="sizeUnit"
        ref={register}
      />
      <input type="number" placeholder="abv" name="abv" ref={register} />
      <input
        type="text"
        placeholder="description"
        name="description"
        ref={register}
      />
      <label>
        Tags:{" "}
        <Controller
          name="tags"
          control={control}
          defaultValue={initialValues?.tags || []}
          render={({ onBlur, value }) => (
            <CreatableSelect
              defaultValue={value}
              options={allTags.map((tag) => ({ value: tag, label: tag }))}
              isMulti
              className={css`
                color: black;
              `}
              onBlur={onBlur}
              onChange={(newValue) =>
                setValue(
                  "tags",
                  newValue?.map(({ value }) => value).join(",") || [],
                )
              }
            />
          )} // props contains: onChange, onBlur and value
        />
      </label>

      <input type="submit" />
    </form>
  );
}
