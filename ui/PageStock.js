import { css } from "emotion";
import React, { useState } from "react";
import { isUserAdmin } from "../api/accounts";
import Locations from "../api/locations";
import Products from "../api/products";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useCurrentUser from "../hooks/useCurrentUser";
import useMethod from "../hooks/useMethod";
import useMongoFetch from "../hooks/useMongoFetch";
import { getCorrectTextColor, stringToColour } from "../util";
import PageStockItem from "./PageStockItem";

const Modal = ({ children, onDismiss }) => (
  <div
    onClick={onDismiss}
    className={css`
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.3);
      box-shadow: 0 0 10px rgba(255, 255, 255, 1);
      z-index: 665;
    `}
  >
    <div
      className={css`
        background: black;
        padding: 8px 8px;
        border-radius: 8px;
        position: relative;
        z-index: 667;
      `}
      onClick={(e) => {
        //  e.preventDefault();
        e.stopPropagation();
      }}
    >
      {children}
    </div>
  </div>
);
const NEW = Symbol("New");
export default function PageStock() {
  const user = useCurrentUser();
  const [editProduct] = useMethod("Products.editProduct");
  const [removeProduct] = useMethod("Products.removeProduct");
  const { location } = useCurrentLocation();
  const [showRemoved, setShowRemoved] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [showOnlyMenuItems, setShowOnlyMenuItems] = useState(false);

  const { data: products, loading } = useMongoFetch(
    Products.find(
      {
        removedAt: { $exists: showRemoved },
        ...(showOnlyMenuItems
          ? { locationIds: { $elemMatch: { $eq: location._id } } }
          : undefined),
      },
      { sort: { createdAt: -1 } },
    ),
    [showOnlyMenuItems, showRemoved, location],
  );

  if (loading) return "Loading...";
  return (
    <>
      <button onClick={() => setIsEditing(NEW)}>Create Product</button>
      {isEditing === NEW ? (
        <Modal>
          <PageStockItem onCancel={() => setIsEditing(null)} />
        </Modal>
      ) : isEditing ? (
        <Modal>
          <PageStockItem
            onCancel={() => setIsEditing(null)}
            product={products.find(({ _id }) => _id === isEditing)}
          />
        </Modal>
      ) : null}
      <label>
        <input
          type="checkbox"
          onChange={() => setShowOnlyMenuItems(!showOnlyMenuItems)}
          checked={showOnlyMenuItems}
        />
        show only items on the menu
      </label>
      <hr />
      <table>
        <thead>
          <tr>
            <th />
            <th>Brand</th>
            <th>Name</th>
            <th>Price</th>
            <th>Size</th>
            <th>ABV</th>
            <th>Description</th>
            <th>Tags</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td>
                {product ? (
                  <>
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
                  </>
                ) : null}
              </td>
              <td>{product.brandName}</td>
              <td>{product.name}</td>
              <td>{product.salePrice}</td>
              <td>
                {product.unitSize}
                {product.sizeUnit}
              </td>
              <td>{product.abv ? `${product.abv}%` : null}</td>
              <td>{product.description}</td>
              <td>
                {[...(product.tags || [])].sort()?.map((tag) => (
                  <span
                    key={tag}
                    className={css`
                      display: inline-block;
                      background: ${stringToColour(tag) ||
                      `rgba(0, 0, 0, 0.4)`};
                      color: ${getCorrectTextColor(stringToColour(tag)) ||
                      "white"};
                      padding: 0 3px;
                      border-radius: 4px;
                      margin-left: 2px;
                    `}
                  >
                    {tag.trim()}
                  </span>
                ))}
              </td>
              <td>
                <button onClick={() => setIsEditing(product._id)}>Edit</button>
                {product && isUserAdmin(user) && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to delete " + product.name,
                        )
                      ) {
                        removeProduct({ productId: product._id });
                      }
                    }}
                  >
                    Delete product
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
