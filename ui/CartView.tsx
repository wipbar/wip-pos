import { css } from "@emotion/css";
import { differenceInSeconds } from "date-fns";
import { sumBy } from "lodash";
import { useFind } from "meteor/react-meteor-data";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Products, { type IProduct, type ProductID } from "../api/products";
import BarcodeScannerComponent from "../components/BarcodeScanner";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentDate from "../hooks/useCurrentDate";
import useMethod from "../hooks/useMethod";
import useSession from "../hooks/useSession";
import { getCorrectTextColor } from "../util";
import type { Cart } from "./PageTend";

function CartViewProductsItem({
  product,
  onRemoveClick,
}: {
  product: IProduct;
  onRemoveClick?: () => any;
}) {
  if (!product) null;
  return (
    <li
      className={css`
        margin: 0;
        list-style: none;
        padding: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.4);
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          max-width: 100%;
        `}
      >
        <button
          className={css`
            align-self: flex-start;
            display: flex;
            border-radius: 100%;
            margin-right: 5px;
            width: 32px;
            height: 32px;
            font-size: 32px;
            font-family: sans-serif;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border: 0;
            background: transparent;
            ${!onRemoveClick ? "opacity:0;" : ""}
          `}
          onClick={onRemoveClick}
        >
          🚮
        </button>
        <div
          className={css`
            flex: 1;
          `}
        >
          {product.brandName ? (
            <>
              <small>{product.brandName}</small>
              <br />
            </>
          ) : null}
          {product.name}
          <br />
          <small>
            <i>
              {product.unitSize}
              {product.sizeUnit}
            </i>
          </small>
        </div>
        <b
          className={css`
            line-height: 0.7;
            text-align: center;
          `}
        >
          <div>{product.salePrice}</div>
          <small>
            <small>ʜᴀx</small>
          </small>
        </b>
      </div>
    </li>
  );
}

function removeItem<T>(items: T[], i: number): T[] {
  return items.slice(0, i - 1).concat(items.slice(i, items.length));
}

const crankSound = new Audio("/cashregistercrank.mp3");
const dingSound = new Audio("/cashregisterding.mp3");

function fancyTimeFormat(duration: number) {
  // Hours, minutes and seconds
  const hrs = ~~(duration / 3600);
  const mins = ~~((duration % 3600) / 60);
  const secs = ~~duration % 60;

  // Output like "1:01" or "4:03:59" or "123:03:59"
  let ret = "";

  if (hrs > 0) {
    ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
  }

  ret += "" + mins + ":" + (secs < 10 ? "0" : "");
  ret += "" + secs;

  return ret;
}

export default function CartView({
  cart,
  setPickedProductIds,
  isActive,
  onSetActive,
}: {
  cart?: Cart;
  setPickedProductIds: (value: ProductID[]) => void;
  isActive?: boolean;
  onSetActive?: () => void;
}) {
  const currentDate = useCurrentDate();
  const currentCamp = useCurrentCamp();

  const { locationSlug } = useParams();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const products = useFind(() =>
    Products.find({ removedAt: { $exists: false } }),
  );
  const [doSellProducts, { isLoading: sellingLoading }] =
    useMethod("Sales.sellProducts");

  const handleSellClick = useCallback(async () => {
    if (!locationSlug) return;
    if (!cart) return;

    crankSound.play();
    doSellProducts({
      locationSlug,
      cartId: cart.id,
      productIds: cart.productIds,
    });

    setPickedProductIds([]);
    setConfirmOpen(false);
    dingSound.play();
    navigator.vibrate?.(500);
  }, [cart, doSellProducts, locationSlug, setPickedProductIds]);

  const haxTotal = sumBy(cart?.productIds || [], (id) =>
    Number(products.find(({ _id }) => id == _id)?.salePrice),
  );

  const [showOnlyBarCodeLessItems, setShowOnlyBarCodeLessItems] = useSession<
    boolean | null
  >("showOnlyBarCodeLessItems", null);

  const handleBarCode = useCallback(
    (resultBarCode: string) => {
      const product = products.find(({ barCode }) => resultBarCode === barCode);

      if (!product) return;

      setPickedProductIds([...(cart?.productIds || []), product._id]);

      if (showOnlyBarCodeLessItems === null) setShowOnlyBarCodeLessItems(true);
    },
    [
      cart?.productIds,
      products,
      setPickedProductIds,
      setShowOnlyBarCodeLessItems,
      showOnlyBarCodeLessItems,
    ],
  );

  const [isGiven, setIsGiven] = useState(false);
  const toggleGiven = useCallback(() => setIsGiven((v) => !v), []);

  const [isReceived, setIsReceived] = useState(false);
  const toggleReceived = useCallback(() => setIsReceived((v) => !v), []);

  useEffect(() => {
    if (isGiven && isReceived) {
      setConfirmOpen(true);
    }
  }, [isGiven, isReceived]);
  useEffect(() => {
    if (haxTotal) {
      setIsGiven(false);
      setIsReceived(false);
    }
  }, [haxTotal]);

  return (
    <div
      className={css`
        margin-right: 6px;
        background: rgba(255, 255, 255, 0.25);
        color: black;
        display: flex;
        flex-direction: column;
        max-height: 100%;
        border-left: 1px solid rgba(255, 255, 255, 0.4);
        transition: all 300ms ease-in-out;
        margin-top: 6px;
        margin-bottom: 6px;
        ${isActive
          ? css`
              box-shadow: ${currentCamp?.color} 0px 0 10px 0px;
              background: ${currentCamp &&
              getCorrectTextColor(currentCamp.color)};
              border-radius: 0px;
              border-top-right-radius: 12px;
              border-bottom-right-radius: 12px;
            `
          : css`
              cursor: pointer;
              border-radius: 24px;
              transform: scale(0.9);
            `}
      `}
      onClick={isActive ? undefined : onSetActive}
    >
      {cart?.openedAt ? (
        <center>
          <small>
            Opened{" "}
            {fancyTimeFormat(differenceInSeconds(currentDate, cart.openedAt))}{" "}
            ago
          </small>
        </center>
      ) : null}
      {cart?.productIds?.length ? (
        <>
          <ul
            className={css`
              flex: 1;
              margin: 0;
              list-style: none;
              padding: 0;
              overflow-y: scroll;
              overflow-x: hidden;
              max-height: calc(100vh - 230px);
            `}
          >
            {cart.productIds.map((id, i) => {
              const product = products.find(({ _id }) => id == _id);
              return product ? (
                <CartViewProductsItem
                  key={id + i}
                  product={product}
                  onRemoveClick={
                    isActive
                      ? () =>
                          setPickedProductIds(
                            removeItem(cart?.productIds, i + 1),
                          )
                      : undefined
                  }
                />
              ) : null;
            })}
          </ul>
          <div
            className={css`
              flex-shrink: 0;
              border-top: 2px solid rgba(255, 255, 255, 0.1);
              display: flex;
              bottom: 0;
              flex-direction: column;
              align-items: center;
              padding-bottom: 1em;
            `}
          >
            {isActive ? (
              <BarcodeScannerComponent onResult={handleBarCode} />
            ) : null}
            <big>
              <big>
                <b>
                  {haxTotal}{" "}
                  <small>
                    <small>ʜᴀx</small>
                  </small>
                </b>
              </big>
            </big>

            {isActive ? (
              <div
                className={css`
                  display: grid;
                  gap: 1em;
                  grid-auto-flow: column;
                  padding: 0 1em;
                  margin-top: 1em;
                  > label {
                    cursor: pointer;
                    background-color: ${currentCamp?.color || "black"};
                    color: ${currentCamp
                      ? getCorrectTextColor(currentCamp.color)
                      : "white"};

                    padding: 0.5em;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    grid-gap: 0.5em;

                    user-select: none;
                  }
                `}
              >
                <label>
                  <input
                    type="checkbox"
                    onChange={toggleReceived}
                    checked={isReceived}
                  />
                  <span>
                    Money
                    <br />
                    Received
                  </span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    onChange={toggleGiven}
                    checked={isGiven}
                  />
                  <span>
                    Items
                    <br />
                    Given
                  </span>
                </label>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div
          className={css`
            height: 100%;
            display: flex;
            align-items: center;
            flex-direction: column;
            padding: 1em;
          `}
        >
          No items in this cart yet...
          {isActive ? (
            <BarcodeScannerComponent onResult={handleBarCode} />
          ) : null}
        </div>
      )}
      {confirmOpen ? (
        <div
          className={css`
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
          `}
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className={css`
              background-color: ${currentCamp &&
              getCorrectTextColor(currentCamp.color)};
              color: ${currentCamp?.color};
              padding: 1em;
              text-align: center;
            `}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            please confirm tending{" "}
            <code>
              <b>{haxTotal}</b>
            </code>
            <small>
              <small>ʜᴀx</small>
            </small>{" "}
            for
            <ul>
              {cart?.productIds.map((id, i) => (
                <li key={i + id}>
                  {products.find(({ _id }) => _id === id)?.brandName}{" "}
                  {products.find(({ _id }) => _id === id)?.name}
                </li>
              ))}
            </ul>
            <br />
            <button
              type="button"
              className={css`
                display: inline-block;
                margin-top: 1em;

                background-color: ${currentCamp?.color};
                color: ${currentCamp && getCorrectTextColor(currentCamp.color)};

                padding: 1em;
                width: 100%;
              `}
              disabled={sellingLoading}
              onClick={handleSellClick}
            >
              {sellingLoading ? <>Selling...</> : <>yeah i got it</>}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
