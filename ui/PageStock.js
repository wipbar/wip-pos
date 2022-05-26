import { faBan } from "@fortawesome/free-solid-svg-icons/faBan";
import { faMinus } from "@fortawesome/free-solid-svg-icons/faMinus";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash";
import { css } from "emotion";
import React, { useState } from "react";
import { isUserAdmin } from "../api/accounts";
import Products, { isAlcoholic } from "../api/products";
import FontAwesomeIcon from "../components/FontAwesomeIcon";
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
function CurfewButton({ location }) {
  const [toggleCurfew] = useMethod("Locations.toggleCurfew");
  return (
    <button
      type="button"
      onClick={() => {
        toggleCurfew({ locationId: location._id }).then(console.log);
      }}
    >
      {location.curfew ? "Exit curfew" : "Enter curfew"}
    </button>
  );
}
const NEW = Symbol("New");
export default function PageStock() {
  const user = useCurrentUser();
  const [editProduct] = useMethod("Products.editProduct");
  const [removeProduct] = useMethod("Products.removeProduct");
  const {
    location,
    error,
    loading: locationLoading,
  } = useCurrentLocation(true);
  const [showRemoved] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [showOnlyMenuItems, setShowOnlyMenuItems] = useState(false);
  const [sortBy, setSortBy] = useState(undefined);

  const { data: products, loading } = useMongoFetch(
    Products.find(
      {
        removedAt: { $exists: showRemoved },
        ...(showOnlyMenuItems
          ? { locationIds: { $elemMatch: { $eq: location?._id } } }
          : undefined),
      },
      { sort: sortBy ? { [sortBy]: 1 } : { updatedAt: -1, createdAt: -1 } },
    ),
    [showOnlyMenuItems, showRemoved, location?._id, sortBy],
  );

  if (loading || locationLoading) return <>Loading...</>;

  if (error) return error;

  return (
    <div>
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
      <select
        onChange={(event) => setSortBy(event.target.value || undefined)}
        value={sortBy}
      >
        <option value={""}>Sort By...</option>
        {products?.length
          ? Object.keys(products[0]).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))
          : null}
      </select>
      <CurfewButton location={location} />
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
            <th>Tap</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isOnMenu = product.locationIds?.includes(location?._id);
            return (
              <tr key={product._id}>
                <td>
                  <button
                    onClick={() =>
                      editProduct({
                        productId: product._id,
                        data: product.locationIds?.includes(location?._id)
                          ? {
                              locationIds: product.locationIds?.filter(
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
                    disabled={location?.curfew && isAlcoholic(product)}
                    style={{
                      whiteSpace: "nowrap",
                      background:
                        location?.curfew && isAlcoholic(product)
                          ? "gray"
                          : isOnMenu
                          ? "red"
                          : "limegreen",
                      color: "white",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={
                        location?.curfew && isAlcoholic(product)
                          ? faBan
                          : isOnMenu
                          ? faMinus
                          : faPlus
                      }
                    />{" "}
                    Menu
                  </button>
                </td>
                <td>{product.brandName}</td>
                <td>{product.name}</td>
                <td>
                  {product.salePrice}{" "}
                  {product.shopPrices?.some(
                    ({ buyPrice }) =>
                      buyPrice &&
                      Number(buyPrice) !== Number(product.salePrice) &&
                      Number(buyPrice) < Number(product.salePrice),
                  ) ? null : (
                    <small>?</small>
                  )}
                </td>
                <td>
                  {product.unitSize}
                  {product.sizeUnit}
                </td>
                <td>{product.abv ? `${product.abv}%` : null}</td>
                <td>{product.description}</td>
                <td style={{ whiteSpace: "nowrap" }}>
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
                <td>{product.tap}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button onClick={() => setIsEditing(product._id)}>
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </button>
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
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
