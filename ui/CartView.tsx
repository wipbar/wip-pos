import { css } from "@emotion/css";
import { sumBy } from "lodash";
import { useFind } from "meteor/react-meteor-data";
import React, { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import Products, { IProduct, ProductID } from "../api/products";
import BarcodeScannerComponent from "../components/BarcodeScanner";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useMethod from "../hooks/useMethod";
import useSession from "../hooks/useSession";
import { getCorrectTextColor } from "../util";

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
            <small>HAX</small>
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

export default function CartView({
  pickedProductIds,
  setPickedProductIds,
  isActive,
  onSetActive,
}: {
  pickedProductIds: ProductID[];
  setPickedProductIds: (value: ProductID[]) => void;
  isActive?: boolean;
  onSetActive?: () => void;
}) {
  const currentCamp = useCurrentCamp();

  const { locationSlug } = useParams();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const products = useFind(
    () => Products.find({ removedAt: { $exists: false } }),
    [],
  );
  const [doSellProducts, { isLoading: sellingLoading }] =
    useMethod("Sales.sellProducts");

  const handleSellClick = useCallback(async () => {
    crankSound.play();
    doSellProducts({ locationSlug, productIds: pickedProductIds });

    setPickedProductIds([]);
    setConfirmOpen(false);
    dingSound.play();
    navigator.vibrate?.(500);
  }, [doSellProducts, locationSlug, pickedProductIds, setPickedProductIds]);

  const haxTotal = sumBy(pickedProductIds, (id) =>
    Number(products.find(({ _id }) => id == _id)?.salePrice),
  );

  const [showOnlyBarCodeLessItems, setShowOnlyBarCodeLessItems] = useSession<
    boolean | null
  >("showOnlyBarCodeLessItems", null);

  const handleBarCode = useCallback(
    (resultBarCode: string) => {
      const product = products.find(({ barCode }) => resultBarCode === barCode);

      if (!product) return;

      setPickedProductIds([...pickedProductIds, product._id]);

      if (showOnlyBarCodeLessItems === null) setShowOnlyBarCodeLessItems(true);
    },
    [
      pickedProductIds,
      products,
      setPickedProductIds,
      setShowOnlyBarCodeLessItems,
      showOnlyBarCodeLessItems,
    ],
  );

  return (
    <div
      className={css`
        background: rgba(255, 255, 255, 0.25);
        display: flex;
        flex-direction: column;
        max-height: 100%;
        border-left: 1px solid rgba(255, 255, 255, 0.4);
        transition: all 300ms ease-in-out;
        margin-bottom: 12px;
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
      {pickedProductIds?.length ? (
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
            {pickedProductIds.map((id, i) => {
              const product = products.find(({ _id }) => id == _id);
              return product ? (
                <CartViewProductsItem
                  key={id + i}
                  product={product}
                  onRemoveClick={
                    isActive
                      ? () =>
                          setPickedProductIds(
                            removeItem(pickedProductIds, i + 1),
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
                    <small>HAX</small>
                  </small>
                </b>
              </big>
            </big>

            {isActive ? (
              <div>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className={css`
                    display: block;

                    background-color: ${currentCamp?.color};
                    color: ${currentCamp &&
                    getCorrectTextColor(currentCamp.color)};

                    margin-top: 1em;
                    padding: 1em;
                  `}
                >
                  Press To Sell
                </button>
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
              <small>HAX</small>
            </small>{" "}
            for
            <ul>
              {pickedProductIds.map((id, i) => (
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
