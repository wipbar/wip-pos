import { css } from "@emotion/css";
import { format } from "date-fns";
import { useTracker } from "meteor/react-meteor-data";
import React, { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useSound from "use-sound";
import Products, { IProduct } from "../api/products";
import Sales from "../api/sales";
import BarcodeScannerComponent from "../components/BarcodeScanner";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useMethod from "../hooks/useMethod";
import useMongoFetch from "../hooks/useMongoFetch";
import useSession from "../hooks/useSession";
import { getCorrectTextColor } from "../util";
import useSubscription from "/hooks/useSubscription";

function MostRecentSale() {
  const currentCamp = useCurrentCamp();
  const { location, loading: locationLoading } = useCurrentLocation(true);
  const [sale] = useTracker(
    () =>
      Sales.find(
        { locationId: location?._id },
        { sort: { timestamp: -1 }, limit: 1 },
      ).fetch(),
    [location?._id],
  );
  const salesLoading = useSubscription(
    "sales",
    { from: currentCamp?.buildup },
    [currentCamp?.buildup],
  );

  if (locationLoading || salesLoading) return null;
  return (
    <div
      className={css`
        font-size: 0.7em;
        opacity: 0.7;
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

function CartViewProductsItem({
  product,
  onRemoveClick,
}: {
  product: IProduct;
  onRemoveClick: () => any;
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

export default function CartView() {
  const currentCamp = useCurrentCamp();

  const [playCrank] = useSound("/cashregistercrank.mp3");
  const [playDing] = useSound("/cashregisterding.mp3");

  const { locationSlug } = useParams();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data: products } = useMongoFetch(
    () => Products.find({ removedAt: { $exists: false } }),
    [],
  );
  const [pickedProductIds, setPickedProductIds] = useSession<string[]>(
    "pickedProductIds",
    [],
  );
  const [sellingLoading, setSellingLoading] = useState(false);
  const [doSellProducts] = useMethod("Sales.sellProducts");

  const haxTotal = pickedProductIds?.reduce(
    (m, id) => m + Number(products.find(({ _id }) => id == _id)?.salePrice),
    0,
  );

  const handleBarCode = useCallback(
    (resultBarCode: string) => {
      const product = products.find(({ barCode }) => resultBarCode === barCode);
      console.log({ resultBarCode, product });
      if (product) setPickedProductIds([...pickedProductIds, product._id]);
    },
    [pickedProductIds, products, setPickedProductIds],
  );

  return (
    <div
      className={css`
        width: 200px;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        max-height: 100%;
        flex: 1;
        border-left: 1px solid rgba(255, 255, 255, 0.4);
      `}
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
                  onRemoveClick={() =>
                    setPickedProductIds(removeItem(pickedProductIds, i + 1))
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
              position: sticky;
              flex-direction: column;
              align-items: center;
              padding-bottom: 1em;
              box-shadow: ${currentCamp?.color} 0 0 10px 0px;
              background: ${currentCamp &&
              getCorrectTextColor(currentCamp.color)};
            `}
          >
            <BarcodeScannerComponent onResult={handleBarCode} />
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
          </div>
        </>
      ) : (
        <div
          className={css`
            height: 100%;
            display: flex;
            align-items: flex-end;
            justify-content: flex-end;
            flex-direction: column;
          `}
        >
          <BarcodeScannerComponent onResult={handleBarCode} />
          <MostRecentSale />
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
              onClick={async () => {
                try {
                  setSellingLoading(true);
                  playCrank();
                  await doSellProducts({
                    locationSlug,
                    productIds: pickedProductIds,
                  });
                  playDing();
                  setPickedProductIds([]);
                  setConfirmOpen(false);
                  try {
                    console.log(navigator.vibrate?.(500));
                    // eslint-disable-next-line no-empty
                  } catch {}
                  // eslint-disable-next-line no-empty
                } catch {}
                setSellingLoading(false);
              }}
            >
              {sellingLoading ? <>Selling...</> : <>yeah i got it</>}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
