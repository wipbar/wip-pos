import { css } from "@emotion/css";
import { format } from "date-fns";
import { Random } from "meteor/random";
import { useFind } from "meteor/react-meteor-data";
import { Session } from "meteor/session";
import React, { Profiler, useMemo, useRef, useState } from "react";
import { useDraggable } from "react-use-draggable-scroll";
import type { ProductID } from "../api/products";
import Sales from "../api/sales";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useEvent from "../hooks/useEvent";
import useSession from "../hooks/useSession";
import useSubscription from "../hooks/useSubscription";
import {
  emptyArray,
  getCorrectTextColor,
  onProfilerRenderCallback,
  type Flavor,
} from "../util";
import CartView from "./CartView";
import ProductPicker from "./ProductPicker";

function MostRecentSale() {
  const currentCamp = useCurrentCamp();
  const { location } = useCurrentLocation(true);
  const [sale] = useFind(
    () =>
      Sales.find(
        { locationId: location?._id },
        { sort: { timestamp: -1 }, limit: 1 },
      ),
    [location?._id],
  );
  useSubscription(currentCamp && "sales", { from: currentCamp?.buildup }, [
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

Session.setDefault("carts", emptyArray);

export type CartID = Flavor<string, "CartID">;
export interface Cart {
  id: CartID;
  openedAt: Date;
  productIds: ProductID[];
}

export default function PageTend() {
  const { error } = useCurrentLocation(true);
  const currentCamp = useCurrentCamp();

  const [currentCartId, setCurrentCartId] = useState<null | CartID>(null);
  const [carts, setCarts] = useSession<Cart[]>("carts", emptyArray);

  const currentCart = useMemo(
    () => carts.find(({ id }) => id === currentCartId) || null,
    [carts, currentCartId],
  );

  const ref = useRef<HTMLDivElement | null>(null);
  // @ts-expect-error - ref value can be null
  const { events } = useDraggable(ref, {
    safeDisplacement: 64, // specify the drag sensitivity
  });

  const onPickerSetPickedProductIds = useEvent(
    (newPickedProductIds: ProductID[]) => {
      if (!currentCart) {
        const newCart = {
          id: Random.id() as CartID,
          openedAt: new Date(),
          productIds: newPickedProductIds,
        } satisfies Cart;
        setCarts((oldCarts) => [...oldCarts, newCart]);
        setCurrentCartId(newCart.id);
      } else {
        setCarts((oldCarts) =>
          oldCarts.map((oldCart) =>
            oldCart.id !== currentCart?.id
              ? oldCart
              : { ...oldCart, productIds: newPickedProductIds },
          ),
        );
      }
    },
  );

  const onCartSetPickedProductIds = useEvent(
    (cart: Cart | undefined, newPickedProductIds: ProductID[]) => {
      if (cart) {
        if (newPickedProductIds.length) {
          setCarts((oldCarts) =>
            oldCarts.map((oldCart) =>
              oldCart.id !== cart.id
                ? oldCart
                : { ...oldCart, productIds: newPickedProductIds },
            ),
          );
        } else {
          setCarts((oldCarts) =>
            oldCarts.filter((oldCart) => oldCart.id !== cart.id),
          );
          if (currentCartId) setCurrentCartId(null);
        }
      } else {
        const newCart = {
          id: Random.id() as CartID,
          openedAt: new Date(),
          productIds: newPickedProductIds,
        } satisfies Cart;
        setCarts((oldCarts) => [...oldCarts, newCart]);
        setCurrentCartId(newCart.id);
      }
    },
  );

  const onCartSetActive = useEvent((cart: Cart | undefined) => {
    if (!cart) return;

    setCurrentCartId(cart.id);
    setCarts((oldCarts) =>
      oldCarts.filter((oldCart) => oldCart.productIds.length),
    );
  });

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
        user-select: none;
      `}
    >
      <Profiler id="ProductPicker" onRender={onProfilerRenderCallback}>
        <ProductPicker
          className={css`
            flex: 3;
            overflow-y: scroll;
            overflow-x: hidden;
          `}
          pickedProductIds={currentCart?.productIds || emptyArray}
          setPickedProductIds={onPickerSetPickedProductIds}
        />
      </Profiler>
      <Profiler id="CartSidebar" onRender={onProfilerRenderCallback}>
        <div
          className={css`
            display: flex;
            flex-direction: column;
            flex: 1;
            min-width: 180px;
            overflow-y: auto;
          `}
          {...events}
          ref={ref}
        >
          {carts.map((cart) => (
            <CartView
              key={cart.id}
              cart={cart}
              onSetCurrentCartId={setCurrentCartId}
              setPickedProductIds={onCartSetPickedProductIds}
              onSetActive={onCartSetActive}
              isActive={currentCartId === cart.id}
            />
          ))}
          {currentCartId ? (
            <button
              className={css`
                margin: 0.5em 1em;
                padding: 0.5em;
                border-radius: 24px;

                background: ${currentCamp &&
                getCorrectTextColor(currentCamp.color)};
                color: ${currentCamp &&
                getCorrectTextColor(currentCamp.color, true)};
                border: 0;
              `}
              onClick={() => setCurrentCartId(null)}
            >
              Start New Cart 🛒
            </button>
          ) : (
            <CartView
              onSetCurrentCartId={setCurrentCartId}
              setPickedProductIds={onCartSetPickedProductIds}
              isActive
            />
          )}
          <MostRecentSale />
        </div>
      </Profiler>
    </div>
  );
}
