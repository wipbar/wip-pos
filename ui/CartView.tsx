import { css } from "@emotion/css";
import { sumBy } from "lodash";
import { Meteor } from "meteor/meteor";
import { useFind } from "meteor/react-meteor-data";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Products, {
  getProductSize,
  type IProduct,
  type ProductID,
} from "../api/products";
import Stocks from "../api/stocks";
import BarcodeScannerComponent from "../components/BarcodeScanner";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useEvent from "../hooks/useEvent";
import useMethod from "../hooks/useMethod";
import useSession from "../hooks/useSession";
import { emptyArray, getCorrectTextColor } from "../util";
import CartViewOpenedAt from "./CartOpenedAt";
import type { Cart, CartID } from "./PageTend";

function CartViewProductsItem({
  product,
  onRemoveClick,
  sellingLoading,
}: {
  product: IProduct;
  onRemoveClick?: () => any;
  sellingLoading: boolean;
}) {
  const currentCamp = useCurrentCamp();

  const stocks = useFind(() =>
    Stocks.find({}, { sort: { name: -1, createdAt: -1 } }),
  );

  if (!product) null;

  const productSize = getProductSize(product);

  return (
    <li
      className={css`
        margin: 0;
        list-style: none;
        padding: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        border-bottom: 1px solid ${currentCamp && currentCamp?.color};
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
            display: flex;
            align-self: flex-end;
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
          disabled={sellingLoading}
        >
          🚮
        </button>
        <div
          className={css`
            flex: 1;
            line-height: 1;
          `}
        >
          {product.brandName ? (
            <>
              <small>{product.brandName}</small>
              <br />
            </>
          ) : null}
          {product.name}
          {productSize ? (
            <small>
              {" "}
              ({productSize.unitSize}
              {productSize.sizeUnit})
            </small>
          ) : null}
          {product.tap ? (
            <span
              className={css`
                line-height: 0.5;
                white-space: nowrap;
              `}
            >
              <small>🚰 {product.tap}</small>
            </span>
          ) : null}
          {product.components && product.components?.length > 1 ? (
            <small>
              <small>
                <br />
                <ul>
                  {product.components.map(({ stockId, sizeUnit, unitSize }) => {
                    return (
                      <li key={stockId}>
                        {unitSize}
                        {sizeUnit} x{" "}
                        {stocks.find(({ _id }) => _id === stockId)?.name ||
                          null}{" "}
                      </li>
                    );
                  })}
                </ul>
              </small>
            </small>
          ) : null}
        </div>
        <b
          className={css`
            line-height: 0.7;
            text-align: center;
          `}
        >
          <div>
            <code>{product.salePrice}</code>
          </div>
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
crankSound.volume = 0.75;
const dingSound = new Audio("/cashregisterding.mp3");
dingSound.volume = 0.75;
const ohnoSound = new Audio("/cashregisterohno.mp3");
const badbarcodeSound = new Audio("/badbarcode.mp3");
const badBarCodes = ["5707323573420"];

export default function CartView({
  cart,
  setPickedProductIds,
  isActive,
  onSetActive,
  onSetCurrentCartId,
}: {
  cart?: Cart;
  setPickedProductIds: (cart: Cart | undefined, value: ProductID[]) => void;
  isActive?: boolean;
  onSetActive?: (cart: Cart | undefined) => void;
  onSetCurrentCartId: (id: CartID | null) => void;
}) {
  const currentCamp = useCurrentCamp();

  const { locationSlug } = useParams();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const products = useFind(
    () =>
      Products.find({
        removedAt: { $exists: false },
        _id: { $in: cart?.productIds ?? [] },
      }),
    [cart?.productIds],
  );
  const stocks = useFind(() => Stocks.find({ removedAt: { $exists: false } }));
  const [doSellProducts, { isLoading: sellingLoading }] =
    useMethod("Sales.sellProducts");

  const handleSellClick = useEvent(async () => {
    if (!locationSlug) return;
    if (!cart) return;

    await crankSound.play();
    setConfirmOpen(false);
    onSetCurrentCartId(null);

    try {
      await doSellProducts({
        locationSlug,
        cartId: cart.id,
        productIds: cart.productIds,
      });
    } catch (sellError) {
      console.error(sellError);
      if (!(sellError instanceof Meteor.Error)) {
        throw sellError;
      }
      if (sellError.error !== "CART_ALREADY_SOLD") {
        await ohnoSound.play();
        return;
      }
    }
    setPickedProductIds(cart, emptyArray);
    await dingSound.play();

    navigator.vibrate?.(500);
  });

  const haxTotal = sumBy(cart?.productIds || emptyArray, (id) =>
    Number(products.find(({ _id }) => id == _id)?.salePrice),
  );

  const [showOnlyBarCodeLessItems, setShowOnlyBarCodeLessItems] = useSession<
    boolean | null
  >("showOnlyBarCodeLessItems", null);

  const handleBarCode = useEvent(async (resultBarCode: string) => {
    if (badBarCodes.includes(resultBarCode)) {
      await badbarcodeSound.play();
      return;
    }

    let product = products.find(({ barCode }) => resultBarCode === barCode);

    if (!product) {
      const stock = stocks.find(({ barCode }) => barCode === resultBarCode);

      if (stock) {
        product = products.find(
          ({ components }) =>
            components?.length == 1 &&
            components?.some(({ stockId }) => stockId === stock._id),
        );
      }
    }

    if (!product) return;

    setPickedProductIds(cart, [
      ...(cart?.productIds || emptyArray),
      product._id,
    ]);

    if (showOnlyBarCodeLessItems === null) setShowOnlyBarCodeLessItems(true);
  });

  const [isGiven, setIsGiven] = useState(false);
  const toggleGiven = useEvent(() => setIsGiven((v) => !v));

  const [isReceived, setIsReceived] = useState(false);
  const toggleReceived = useEvent(() => setIsReceived((v) => !v));

  const [amountReceived, setAmountReceived] = useState(0);
  const addReceived = useEvent((amount: number) =>
    setAmountReceived((v) => v + amount),
  );
  useEffect(() => {
    if (amountReceived && haxTotal && amountReceived >= haxTotal) {
      setIsReceived(true);
    }
  }, [amountReceived, haxTotal]);
  useEffect(() => {
    if (!isReceived) setAmountReceived(0);
  }, [isReceived]);

  useEffect(() => {
    if (isGiven && isReceived) setConfirmOpen(true);
  }, [isGiven, isReceived]);
  useEffect(() => {
    if (haxTotal) {
      setIsGiven(false);
      setIsReceived(false);
    }
  }, [haxTotal]);

  const handleCartClick = useEvent(() => {
    if (isActive) return;

    if (onSetActive) onSetActive(cart);
  });

  return (
    <div
      className={css`
        margin-right: 6px;
        background: rgba(255, 255, 255, 0.25);
        color: black;
        display: flex;
        flex-direction: column;
        border-left: 1px solid rgba(255, 255, 255, 0.4);
        transition: all 300ms ease-in-out;
        margin-top: 6px;
        margin-bottom: 6px;
        ${isActive
          ? css`
              box-shadow: ${currentCamp?.color} 0px 0 10px 0px;
              background: ${currentCamp &&
              getCorrectTextColor(currentCamp.color)};
              color: ${currentCamp &&
              getCorrectTextColor(currentCamp.color, true)};
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
      onClick={handleCartClick}
    >
      {sellingLoading ? (
        <center
          className={css`
            border-bottom: 1px solid ${currentCamp && currentCamp?.color};
          `}
        >
          <small>Sale Pending...</small>
        </center>
      ) : null}
      {cart?.openedAt ? <CartViewOpenedAt cart={cart} /> : null}
      {cart?.productIds?.length ? (
        <>
          <ul
            className={css`
              flex: 1;
              margin: 0;
              list-style: none;
              padding: 0;
            `}
          >
            {cart.productIds.map((id, i) => {
              const product = products.find(({ _id }) => id == _id);
              return product ? (
                <CartViewProductsItem
                  key={id + i}
                  product={product}
                  sellingLoading={sellingLoading}
                  onRemoveClick={
                    isActive
                      ? () =>
                          setPickedProductIds(
                            cart,
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
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              display: flex;
              bottom: 0;
              flex-direction: column;
              align-items: center;
              padding-bottom: 1em;
            `}
          >
            {isActive && !sellingLoading ? (
              <BarcodeScannerComponent onResult={handleBarCode} />
            ) : null}
            <big>
              <big>
                <b>
                  <code>{haxTotal}</code>
                  <small>
                    <small>ʜᴀx</small>
                  </small>
                </b>
              </big>
            </big>

            {isActive ? (
              <>
                {!sellingLoading ? (
                  <div
                    className={css`
                      margin-top: 12px;
                      padding: 0 8px;
                      display: flex;
                      width: 100%;
                      flex-direction: row;
                      align-items: center;
                      justify-content: space-around;
                      > button {
                        border-radius: 100%;
                        width: 15%;
                        font-size: 14px;
                        aspect-ratio: 1 / 1;
                        line-height: 0.9;
                        > small {
                          display: block;
                        }
                        > code {
                          font-weight: bold;
                        }

                        &:nth-child(1) {
                          background-color: hotpink;
                        }
                        &:nth-child(2) {
                          background-color: #ff8800;
                        }
                        &:nth-child(3) {
                          background-color: greenyellow;
                        }
                        &:nth-child(4) {
                          background-color: aqua;
                        }
                        &:nth-child(5) {
                          background-color: white;
                        }
                      }
                    `}
                  >
                    <button onClick={() => addReceived(100)}>
                      <code>100</code>
                      <small>ʜᴀx</small>
                    </button>
                    <button onClick={() => addReceived(50)}>
                      <code>50</code>
                      <small>ʜᴀx</small>
                    </button>
                    <button onClick={() => addReceived(20)}>
                      <code>20</code>
                      <small>ʜᴀx</small>
                    </button>
                    <button onClick={() => addReceived(10)}>
                      <code>10</code>
                      <small>ʜᴀx</small>
                    </button>
                    <button onClick={() => addReceived(5)}>
                      <code>5</code>
                      <small>ʜᴀx</small>
                    </button>
                    <button
                      onClick={() => {
                        setAmountReceived(0);
                        setIsReceived(false);
                      }}
                    >
                      X
                    </button>
                  </div>
                ) : null}
                {sellingLoading ? (
                  <div
                    className={css`
                      display: grid;
                      gap: 0.5vw;
                      grid-auto-flow: column;
                      padding: 0 1vw;
                      margin-top: 1em;
                    `}
                  >
                    <button
                      type="button"
                      className={css`
                        display: inline-block;

                        background-color: ${currentCamp?.color};
                        color: ${currentCamp &&
                        getCorrectTextColor(currentCamp.color)};

                        padding: 1em;
                        width: 100%;
                      `}
                      disabled={sellingLoading}
                      onClick={handleSellClick}
                    >
                      {sellingLoading ? <>Selling...</> : <>yeah i got it</>}
                    </button>
                  </div>
                ) : (
                  <div
                    className={css`
                      display: grid;
                      gap: 0.5vw;
                      grid-auto-flow: column;
                      padding: 0 0.5vw;
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
                        {amountReceived ? (
                          <>
                            <code>{amountReceived}</code>/
                          </>
                        ) : null}
                        <code>{haxTotal}</code>
                        <small>ʜᴀx</small>
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
                        <span
                          className={css`
                            white-space: nowrap;
                          `}
                        >
                          {cart.productIds.length} items
                        </span>
                        <br />
                        Given
                      </span>
                    </label>
                    <button
                      className={css`
                        background: red;
                      `}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to cancel this transaction?",
                          )
                        ) {
                          setPickedProductIds(cart, emptyArray);
                        }
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                )}
                {amountReceived > haxTotal ? (
                  <div
                    className={css`
                      color: red;
                      margin-top: 0.5em;
                    `}
                  >
                    Change: {amountReceived - haxTotal}
                    <small>ʜᴀx</small>
                  </div>
                ) : null}
              </>
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
