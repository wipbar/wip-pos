import { css } from "emotion";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import React, { useMemo, useState } from "react";
import { isUserAdmin } from "../api/accounts";
import Locations from "../api/locations";
import Products from "../api/products";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useMethod from "../hooks/useMethod";
import useMongoFetch from "../hooks/useMongoFetch";

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
                ![
                  "buyPrice",
                  "tags",
                  "abv",
                  "description",
                  "unitSize",
                  "sizeUnit",
                ].includes(fieldName)
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
  const { data: locations } = useMongoFetch(Locations);

  const [editProduct] = useMethod("Products.editProduct");
  const [removeProduct] = useMethod("Products.removeProduct");
  const [isEditing, setIsEditing] = useState(false);
  const { location } = useCurrentLocation();
  const isAdmin = useTracker(() => isUserAdmin(Meteor.user()));
  return (
    <tr>
      <td>
        <Button
          type="button"
          onClick={() =>
            editProduct({
              productId: product._id,
              data:
                product.locationIds &&
                product.locationIds.includes(location._id)
                  ? {
                      locationIds: product.locationIds.filter(
                        (id) => id !== location._id,
                      ),
                    }
                  : {
                      locationIds: [
                        ...(product.locationIds || []),
                        location._id,
                      ],
                    },
            })
          }
        >
          {location &&
            (product.locationIds && product.locationIds.includes(location._id)
              ? `Remove from ${location.name} menu`
              : `Add to ${location.name} menu`)}
        </Button>
        {product.locationIds &&
        product.locationIds.filter((id) => !location || id !== location._id)
          .length ? (
          <small>
            <br />
            Used by:{" "}
            {product.locationIds
              .filter((id) => !location || id !== location._id)
              .map((id) => locations.find(({ _id }) => id === _id))
              .filter(Boolean)
              .map(({ slug, name }) => (
                <span key={slug}>{name}</span>
              ))}
          </small>
        ) : null}
      </td>
      {isEditing ? (
        <ProductForm
          columns={columns}
          initialValues={product}
          onSubmit={async (newProduct) => {
            await editProduct({ productId: product._id, data: newProduct });
            setIsEditing(false);
          }}
        />
      ) : (
        <>
          {columns.map((column) => (
            <td key={column}>
              {((value) => {
                if (typeof value === "number") return <code>{value}</code>;
                if (Array.isArray(value)) {
                  return (
                    <ul>
                      {value.map((v, i) => {
                        if (typeof v === "number")
                          return (
                            <li key={i}>
                              <code>{v}</code>
                            </li>
                          );
                        return <li key={i}>{v}</li>;
                      })}
                    </ul>
                  );
                }
                return <>{value}</>;
              })(product && product[column])}
            </td>
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
        {isAdmin && (
          <Button
            type="button"
            onClick={() => {
              if (product.locationIds && product.locationIds.length) {
                return window.alert(
                  "Product must be removed from all locations' menus before it can be removed.",
                );
              }
              window.confirm(
                `Are you sure you want to remote ${product.name}`,
              ) && removeProduct({ productId: product._id });
            }}
          >
            remove
          </Button>
        )}
      </td>
    </tr>
  );
}

export default function PageStock() {
  const [showRemoved, setShowRemoved] = useState(false);
  const { data: products, loading } = useMongoFetch(
    Products.find(
      { removedAt: { $exists: showRemoved } },
      { sort: { createdAt: -1 } },
    ),
    [showRemoved],
  );
  const [addProduct] = useMethod("Products.addProduct");
  const columns = useMemo(
    () =>
      loading
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
                "updatedAt",
                "locationIds",
              ].includes(name),
          ),
    [products, loading],
  );
  if (loading) return "Loading...";
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
              onSubmit={(newProduct) => addProduct({ data: newProduct })}
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
