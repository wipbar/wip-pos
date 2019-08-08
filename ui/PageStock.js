import React from "react";
import Products from "../api/products";
import useTracker from "../hooks/useTracker";
import useSubscription from "../hooks/useSubscription";
import { css } from "emotion";
import useMethod from "../hooks/useMethod";

const fieldNames = ["name", "unitSize", "sizeUnit", "buyPrice", "salePrice"];

export default function PageStock() {
  useSubscription("products");
  const products = useTracker(() => Products.find().fetch());
  const [addProduct] = useMethod("Products.addProduct");
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
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={async e => {
          e.preventDefault();
          const newProduct = fieldNames.reduce((m, inputName) => {
            m[inputName] = e.currentTarget[inputName].value;
            return m;
          }, {});
          await addProduct(newProduct);
          e.currentTarget.reset();
        }}
      >
        {fieldNames.map(fieldName => (
          <label key={fieldName}>
            {fieldName}:{" "}
            <input name={fieldName} placeholder={fieldName} required />
          </label>
        ))}
        <input type="submit" value="Add" />
      </form>
    </>
  );
}
