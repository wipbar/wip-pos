import { css } from "@emotion/css";
import { format } from "date-fns";
import { useFind } from "meteor/react-meteor-data";
import { Session } from "meteor/session";
import React, { useMemo, useState } from "react";
import Sales from "../api/sales";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useSession from "../hooks/useSession";
import useSubscription from "../hooks/useSubscription";
import CartView from "./CartView";
import ProductPicker from "./ProductPicker";

function MostRecentSale() {
  const currentCamp = useCurrentCamp();
  const { location } = useCurrentLocation(true);
  const [sale] = useFind(() =>
    Sales.find(
      { locationId: location?._id },
      { sort: { timestamp: -1 }, limit: 1 },
    ),
  );
  useSubscription("sales", { from: currentCamp?.buildup }, [
    currentCamp?.buildup,
  ]);

  if (!sale) return null;

  return (
    <div
      className={css`
        justify-self: flex-end;
        padding: 1em;
        color: gray;
      `}
    >
      Last sale: {format(sale.timestamp, "HH:mm:ss")}{" "}
      <code>
        <b>{sale.amount}</b>
      </code>
      <small>{sale.currency}</small>
      <ul
        className={css`
          padding: 0;
          margin: 0;
          padding-bottom: 20px;
        `}
      >
        {sale.products.map((product, i) => (
          <li key={sale._id + i + product._id}>
            {product.brandName ? <>{product.brandName} - </> : null}{" "}
            {product.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

Session.setDefault("pickedProductIdsLists", [[]]);

export default function PageTend() {
  const { error } = useCurrentLocation(true);

  const [currentCart, setCurrentCart] = useState(0);
  const [pickedProductIdsLists, setPickedProductIdsLists] = useSession<
    string[][]
  >("pickedProductIdsLists", [[]]);
  console.log({ pickedProductIdsLists, setPickedProductIdsLists });
  const current = useMemo(
    () => (pickedProductIdsLists.length >= currentCart ? currentCart : 0),
    [currentCart, pickedProductIdsLists.length],
  );

  if (error) return error;

  return (
    <div
      className={css`
        flex: 1;
        display: flex;
        width: 100%;
        height: 100%;
        max-height: 100%;
        align-items: stretch;
        max-height: calc(100vh - 80px);
      `}
    >
      <ProductPicker
        className={css`
          flex: 3;
          overflow-y: scroll;
          overflow-x: hidden;
        `}
        pickedProductIds={pickedProductIdsLists[current]!}
        setPickedProductIds={(newPickedProductIds) =>
          setPickedProductIdsLists((oldPickedProductIdsLists) =>
            oldPickedProductIdsLists.map((l) =>
              l === pickedProductIdsLists[current] ? newPickedProductIds : l,
            ),
          )
        }
      />
      <div
        className={css`
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        `}
      >
        {pickedProductIdsLists.map((pickedProductIds, i) => (
          <CartView
            key={i}
            pickedProductIds={pickedProductIds}
            setPickedProductIds={(newPickedProductIds) => {
              if (newPickedProductIds.length) {
                setPickedProductIdsLists((oldPickedProductIdsLists) =>
                  oldPickedProductIdsLists.map((l) =>
                    l === pickedProductIds ? newPickedProductIds : l,
                  ),
                );
              } else {
                setPickedProductIdsLists((oldPickedProductIdsLists) => {
                  if (oldPickedProductIdsLists.length === 1) {
                    // If this would remove the last list make the new list of lists a list with an empty list
                    return [[]];
                  }
                  return oldPickedProductIdsLists.filter(
                    (l) => l !== pickedProductIds,
                  );
                });
                setCurrentCart(0);
              }
            }}
            onSetActive={() => setCurrentCart(i)}
            isActive={current === i}
          />
        ))}
        {!pickedProductIdsLists.some(({ length }) => !length) ? (
          <button
            onClick={() => {
              setPickedProductIdsLists((oldPickedProductIdsLists) => [
                ...oldPickedProductIdsLists,
                [],
              ]);
              setCurrentCart(pickedProductIdsLists.length);
            }}
          >
            start new cart
          </button>
        ) : null}
        <MostRecentSale />
      </div>
    </div>
  );
}
