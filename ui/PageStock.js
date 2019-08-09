import React from "react";
import Products from "../api/products";
import useMethod from "../hooks/useMethod";
import useSubscription from "../hooks/useSubscription";
import useTracker from "../hooks/useTracker";

const fieldNames = [
  "brandName",
  "name",
  "unitSize",
  "sizeUnit",
  "buyPrice",
  "salePrice",
];

const ProductForm = ({ onSubmit, initialValues }) => (
  <form
    onSubmit={async e => {
      e.preventDefault();
      const newProduct = fieldNames.reduce((m, inputName) => {
        m[inputName] = e.currentTarget[inputName].value;
        return m;
      }, {});
      e.currentTarget.reset();
      await onSubmit(newProduct);
    }}
  >
    {fieldNames.map(fieldName => (
      <label key={fieldName}>
        {fieldName}:{" "}
        <input
          name={fieldName}
          placeholder={fieldName}
          defaultValue={initialValues ? initialValues[fieldName] : ""}
          required={!(fieldName == "buyPrice")}
        />
      </label>
    ))}
    <input type="submit" value={initialValues ? "Update" : "Add"} />
  </form>
);

export default function PageStock() {
  useSubscription("products");
  const products = useTracker(() => Products.find().fetch());
  const [addProduct] = useMethod("Products.addProduct");
  const [editProduct] = useMethod("Products.editProduct");
  const [removeProduct] = useMethod("Products.removeProduct");
  return (
    <>
      {products && products.length && (
        <ul>
          {products.map(product => (
            <li key={product._id}>
              <button type="button" onClick={() => removeProduct(product._id)}>
                remove
              </button>
              <pre>{JSON.stringify(product)}</pre>
              <ProductForm
                initialValues={product}
                onSubmit={newProduct => editProduct(product._id, newProduct)}
              />
            </li>
          ))}
        </ul>
      )}
      <ProductForm onSubmit={newProduct => addProduct(newProduct)} />
    </>
  );
}
