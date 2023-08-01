import { css } from "@emotion/css";
import { faBan } from "@fortawesome/free-solid-svg-icons/faBan";
import { faMinus } from "@fortawesome/free-solid-svg-icons/faMinus";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash";
import { useFind } from "meteor/react-meteor-data";
import { opacify } from "polished";
import React, { ReactNode, useState } from "react";
import { isUserAdmin } from "../api/accounts";
import type { ILocation } from "../api/locations";
import Products, {
  ProductID,
  isAlcoholic,
  productsMethods,
} from "../api/products";
import FontAwesomeIcon from "../components/FontAwesomeIcon";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useCurrentUser from "../hooks/useCurrentUser";
import useMethod from "../hooks/useMethod";
import { getCorrectTextColor, stringToColour } from "../util";
import PageProductsItem from "./PageProductsItem";

export const Modal = ({
  children,
  onDismiss,
}: {
  children: ReactNode | ReactNode[];
  onDismiss?: () => void;
}) => {
  const currentCamp = useCurrentCamp();
  return (
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
        background: ${currentCamp &&
        opacify(-0.25, getCorrectTextColor(currentCamp.color))};
        z-index: 665;
      `}
    >
      <div
        className={css`
          background-color: ${currentCamp &&
          getCorrectTextColor(currentCamp.color)};
          color: ${currentCamp?.color};
          box-shadow: 0 0 24px
            ${currentCamp &&
            opacify(-0.25, getCorrectTextColor(currentCamp.color, true))};
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
};
function CurfewButton({ location }: { location: ILocation }) {
  const [toggleCurfew] = useMethod<{ locationId: string }>(
    "Locations.toggleCurfew",
  );
  return (
    <button
      type="button"
      onClick={() => {
        toggleCurfew({ locationId: location._id });
      }}
    >
      {location.curfew ? "Exit curfew" : "Enter curfew"}
    </button>
  );
}
const NEW = Symbol("New");
export default function PageProducts() {
  const user = useCurrentUser();
  const [editProduct] = useMethod<
    Parameters<(typeof productsMethods)["Products.editProduct"]>[0]
  >("Products.editProduct");
  const [removeProduct] = useMethod<
    Parameters<(typeof productsMethods)["Products.removeProduct"]>[0]
  >("Products.removeProduct");
  const { location, error } = useCurrentLocation(true);
  const [showRemoved] = useState(false);
  const [isEditing, setIsEditing] = useState<null | ProductID | typeof NEW>(
    null,
  );
  const [showOnlyMenuItems, setShowOnlyMenuItems] = useState(false);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);

  const products = useFind(
    () =>
      Products.find(
        // @ts-expect-error
        {
          removedAt: { $exists: showRemoved },
          ...(showOnlyMenuItems
            ? { locationIds: { $elemMatch: { $eq: location?._id } } }
            : undefined),
        },
        { sort: sortBy ? { [sortBy]: 1 } : { updatedAt: -1, createdAt: -1 } },
      ),
    [location?._id, showRemoved, showOnlyMenuItems, sortBy],
  );

  if (error) return error;

  return (
    <div>
      <button onClick={() => setIsEditing(NEW)}>Create Product</button>
      {isEditing === NEW ? (
        <Modal onDismiss={() => setIsEditing(null)}>
          <PageProductsItem onCancel={() => setIsEditing(null)} />
        </Modal>
      ) : isEditing ? (
        <Modal onDismiss={() => setIsEditing(null)}>
          <PageProductsItem
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
        {products[0]
          ? Object.keys(products[0]).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))
          : null}
      </select>
      {location ? <CurfewButton location={location} /> : null}
      <hr />
      <div
        className={css`
          overflow-x: auto;
        `}
      >
        <table
          className={css`
            width: 100%;
          `}
        >
          <thead>
            <tr>
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
              const isOnMenu =
                location && product.locationIds?.includes(location?._id);
              return (
                <tr key={product._id}>
                  <td>{product.brandName}</td>
                  <td>{product.name}</td>
                  <td
                    className={css`
                      white-space: nowrap;
                    `}
                  >
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
                  <td>
                    <button
                      onClick={() => {
                        if (!location) return;

                        editProduct({
                          productId: product._id,
                          data: isOnMenu
                            ? {
                                locationIds: product.locationIds?.filter(
                                  (id) => id !== location._id,
                                ),
                              }
                            : {
                                locationIds: [
                                  ...(product.locationIds || []),
                                  location._id,
                                ],
                              },
                        });
                      }}
                      disabled={location?.curfew && isAlcoholic(product)}
                      style={{
                        whiteSpace: "nowrap",
                        width: "100%",
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
                    <div
                      className={css`
                        white-space: nowrap;
                      `}
                    >
                      <button onClick={() => setIsEditing(product._id)}>
                        <FontAwesomeIcon icon={faPencilAlt} />
                      </button>
                      {product && isUserAdmin(user) && (
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to delete " +
                                  product.name,
                              )
                            ) {
                              removeProduct({ productId: product._id });
                            }
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
