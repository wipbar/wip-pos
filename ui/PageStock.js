import React, { useMemo, useState } from "react";
import Products from "../api/products";
import useMethod from "../hooks/useMethod";
import useSubscription from "../hooks/useSubscription";
import { useTracker } from "meteor/react-meteor-data";
import { css } from "emotion";
import { useRouteMatch } from "react-router";

const fieldNames = [
  "brandName",
  "name",
  "unitSize",
  "sizeUnit",
  "abv",
  "buyPrice",
  "salePrice",
  "tags",
  "description",
];

const ProductForm = ({ onSubmit, initialValues, columns }) => {
  const formId = initialValues ? initialValues._id : "newProductForm";
  return (
    <>
      {columns
        .filter((fieldName) =>
          initialValues ? fieldName !== "buyPrice" : true,
        )
        .map((fieldName) => (
          <td key={fieldName}>
            <input
              form={formId}
              name={fieldName}
              placeholder={fieldName}
              defaultValue={initialValues ? initialValues[fieldName] : ""}
              required={
                !["buyPrice", "tags", "abv", "description"].includes(fieldName)
              }
              className={css`
                width: 100%;
              `}
            />
          </td>
        ))}
      <td>
        <form
          id={formId}
          onSubmit={async (e) => {
            e.preventDefault();
            const newProduct = [...e.currentTarget.elements]
              .filter(({ name }) => fieldNames.includes(name))
              .reduce((m, input) => {
                m[input.name] = input.value;
                return m;
              }, {});
            //            e.currentTarget.reset();
            await onSubmit(newProduct);
          }}
        >
          <Button type="submit">{initialValues ? "Update" : "Add"}</Button>
        </form>
      </td>
    </>
  );
};

function Button(props) {
  return (
    <button
      type="button"
      {...props}
      className={
        css`
          background-color: #ffed00;
          color: black;
        ` +
        " " +
        (props.className || "")
      }
    />
  );
}

function StockProductItem({ product, columns }) {
  const [editProduct] = useMethod("Products.editProduct");
  const [removeProduct] = useMethod("Products.removeProduct");
  const [isEditing, setIsEditing] = useState(false);
  return (
    <tr>
      <td>
        <Button
          type="button"
          onClick={() =>
            editProduct(product._id, { isOnMenu: !product.isOnMenu })
          }
        >
          {product.isOnMenu ? "Remove from menu" : "Add to menu"}
        </Button>
      </td>
      {isEditing ? (
        <ProductForm
          columns={columns}
          initialValues={product}
          onSubmit={async (newProduct) => {
            await editProduct(product._id, newProduct);
            setIsEditing(false);
          }}
        />
      ) : (
        <>
          {columns.map((column) => (
            <th key={column}>{product[column]}</th>
          ))}
        </>
      )}
      {isEditing ? null : <td>&nbsp;</td>}
      <td>
        <Button type="button" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "cancel" : "edit"}
        </Button>
      </td>
      <td>
        <Button type="button" onClick={() => removeProduct(product._id)}>
          remove
        </Button>
      </td>
    </tr>
  );
}

export default function PageStock() {
  console.log("PageStock");
  console.log(useRouteMatch());
  const productsLoading = useSubscription("products");
  const products = useTracker(() =>
    Products.find(
      { removedAt: { $exists: false } },
      { sort: { createdAt: -1 } },
    ).fetch(),
  );
  const [addProduct] = useMethod("Products.addProduct");
  const columns = useMemo(
    () =>
      productsLoading
        ? []
        : [
            ...products.reduce((m, product) => {
              Object.keys(product).map((key) => m.add(key));
              return m;
            }, new Set(["tags", "brandName", "name", "salePrice", "unitSize", "sizeUnit", "abv", "description"])),
          ].filter(
            (name) =>
              ![
                "_id",
                "buyPrice",
                "shopPrices",
                "createdAt",
                "removedAt",
                "isOnMenu",
              ].includes(name),
          ),
    [products, productsLoading],
  );
  if (productsLoading) return "Loading...";
  return (
    <>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
            <th>buyPrice</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <ProductForm
              columns={[...columns, "buyPrice"]}
              onSubmit={(newProduct) => addProduct(newProduct)}
            />
          </tr>
        </tbody>
      </table>
      {products && products.length ? (
        <table>
          <thead>
            <tr>
              <th>&nbsp;</th>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <StockProductItem
                key={product._id}
                columns={columns}
                product={product}
              />
            ))}
          </tbody>
        </table>
      ) : null}
    </>
  );
}
