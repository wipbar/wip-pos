import { css } from "@emotion/css";
import { FastAverageColor } from "fast-average-color";
import { useFind } from "meteor/react-meteor-data";
import { lighten } from "polished";
import React, {
  type HTMLProps,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDraggable } from "react-use-draggable-scroll";
import { LongPressCallbackReason, useLongPress } from "use-long-press";
import Products, {
  type IProduct,
  type ProductID,
  getProductBarCode,
  getProductSize,
  isAlcoholic,
} from "../api/products";
import Stocks from "../api/stocks";
import useCurrentCamp from "../hooks/useCurrentCamp";
import { useInterval } from "../hooks/useCurrentDate";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useEvent from "../hooks/useEvent";
import useMethod from "../hooks/useMethod";
import useSession from "../hooks/useSession";
import {
  emptyArray,
  getCorrectTextColor,
  removeItem,
  sortTags,
  stringToColour,
  stringToColours,
  tagsToString,
} from "../util";
import { Modal } from "./PageProducts";
import PageProductsItem from "./PageProductsItem";

const fac = new FastAverageColor();

const collator = new Intl.Collator("en");

function ProductPickerProductStock({ product }: { product: IProduct }) {
  const [call, result] = useMethod("Products.getRemainingPercent");

  useEffect(() => {
    void call({ productId: product._id });
  }, [call, product._id]);
  useInterval(() => call({ productId: product._id }), 30000);

  return typeof result.data === "number" ? (
    <div
      className={css`
        white-space: nowrap;
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 8px;
        background: red;
        border-top-left-radius: 3px;
        border-bottom-left-radius: 3px;
        overflow: hidden;
      `}
    >
      <div
        className={css`
          background: rgb(0, 255, 0);
          position: absolute;
          right: 0;
          left: 0;
          bottom: 0;
          height: ${(1 - result.data) * 100}%;
        `}
      ></div>
    </div>
  ) : null;
}

function ProductPickerProduct({
  product,
  onPickedProduct,
  onLongPressedProduct,
  showItemDetails,
}: {
  product: IProduct;
  onPickedProduct: (product: IProduct) => void;
  onLongPressedProduct: (product: IProduct) => void;
  showItemDetails: boolean;
}) {
  const handlers = useLongPress(() => onLongPressedProduct(product), {
    cancelOnMovement: true,
    cancelOutsideElement: true,
    onCancel: (_event, meta) => {
      if (meta.reason === LongPressCallbackReason.CancelledByRelease) {
        onPickedProduct(product);
      }
    },
  });

  const sortedTags = useMemo(
    () => sortTags(product.tags || emptyArray),
    [product],
  );

  return (
    <button
      key={product._id}
      {...handlers()}
      className={css`
        background: ${sortedTags.length
          ? sortedTags.length === 1 && sortedTags[0]
            ? lighten(0.25, stringToColour(sortedTags[0], 0.9))
            : `linear-gradient(
          135deg,
          ${sortedTags
            .map((tag) => lighten(0.25, stringToColour(tag, 0.9)))
            .join(", ")} 
        )`
          : `rgba(255,255,255, 1)`};
        color: ${sortedTags.length
          ? getCorrectTextColor(
              `rgba(${fac
                .getColorFromArray4(
                  sortedTags.map((tag) => stringToColours(tag)).flat(),
                )
                .toString()})`,
            )
          : `rgba(0,0,0, 1)`};
        border: 2px solid black;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        border-radius: 5px;
        align-items: center;
        position: relative;
      `}
    >
      <ProductPickerProductStock product={product} />
      <div
        className={css`
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
        `}
      >
        {product.brandName ? (
          <div>
            <small>
              <small>{product.brandName}</small>
            </small>
          </div>
        ) : null}
        <div>
          <b
            className={css`
              font-size: 1.1em;
            `}
          >
            {product.name}
          </b>
          {showItemDetails && (
            <>
              <br />
              <small>
                <small>
                  <i>
                    {getProductSize(product)?.unitSize}
                    {getProductSize(product)?.sizeUnit}
                  </i>{" "}
                  {sortedTags?.map((tag) => (
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
                  ))}{" "}
                </small>
              </small>
            </>
          )}
        </div>
      </div>
      <div>
        {showItemDetails && (
          <span>
            <code>
              <b>{product.salePrice}</b>
            </code>
            <small>ʜᴀx</small>
          </span>
        )}
        {product.tap ? <small> 🚰 {product.tap}</small> : null}
      </div>
    </button>
  );
}

export default function ProductPicker({
  pickedProductIds,
  setPickedProductIds,
  ...props
}: {
  pickedProductIds: ProductID[];
  setPickedProductIds: (value: ProductID[]) => void;
} & HTMLProps<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement | null>(null);
  // @ts-expect-error - ref value can be null
  const { events } = useDraggable(ref, {
    safeDisplacement: 64, // specify the drag sensitivity
  });

  const { location } = useCurrentLocation();
  const currentCamp = useCurrentCamp();
  const [showOnlyMenuItems, setShowOnlyMenuItems] = useState(true);
  const [showOnlyBarCodeLessItems, setShowOnlyBarCodeLessItems] = useSession<
    boolean | null
  >("showOnlyBarCodeLessItems", null);
  const [showItemDetails, setShowItemDetails] = useState(true);
  const [isEditingProduct, setIsEditingProduct] = useState<null | ProductID>();
  const toggleOnlyMenuItems = useEvent(() =>
    setShowOnlyMenuItems(!showOnlyMenuItems),
  );
  const toggleShowOnlyBarCodeLessItems = useEvent(() =>
    setShowOnlyBarCodeLessItems(!showOnlyBarCodeLessItems),
  );
  const toggleItemDetails = useEvent(() =>
    setShowItemDetails(!showItemDetails),
  );
  const [activeFilters, setActiveFilters] = useState<string[]>(emptyArray);
  const [prevPickedProductIds, setPrevPickedProductIds] =
    useState(activeFilters);
  useEffect(() => {
    if (pickedProductIds?.length == 0 && prevPickedProductIds?.length > 0) {
      setActiveFilters(emptyArray);
    }
    setPrevPickedProductIds(pickedProductIds);
  }, [pickedProductIds, prevPickedProductIds]);

  const products = useFind(() =>
    Products.find({ removedAt: { $exists: false } }, { sort: { name: 1 } }),
  );
  const stocks = useFind(() =>
    Stocks.find({ removedAt: { $exists: false } }, { sort: { name: 1 } }),
  );

  const toggleTag = useEvent((tag: string) => {
    setActiveFilters(
      activeFilters.includes(tag.trim())
        ? removeItem(activeFilters, activeFilters.indexOf(tag.trim()))
        : [...activeFilters, tag.trim()],
    );
  });

  const allTags = useMemo(
    () =>
      sortTags(
        [
          ...products
            .filter(({ locationIds }) =>
              showOnlyMenuItems && location
                ? locationIds?.includes(location._id)
                : true,
            )
            .filter((product) =>
              showOnlyBarCodeLessItems
                ? !getProductBarCode(product, stocks)
                : true,
            )
            .reduce((memo, { tags }) => {
              tags?.forEach((tag) => memo.add(tag.trim()));

              return memo;
            }, new Set<string>(activeFilters)),
        ].sort(collator.compare.bind(collator)),
      ),
    [
      activeFilters,
      location,
      products,
      showOnlyBarCodeLessItems,
      showOnlyMenuItems,
      stocks,
    ],
  );

  const handlePickedProduct = useEvent((product: IProduct) => {
    setPickedProductIds([...pickedProductIds, product._id]);
  });

  const handleLongPressedProduct = useEvent((product: IProduct) => {
    setIsEditingProduct(product._id);
  });

  const sortedProducts = useMemo(
    () =>
      Array.from(products)
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => Number(a.tap || 0) - Number(b.tap || 0))
        .sort((a, b) =>
          tagsToString(a.tags).localeCompare(tagsToString(b.tags)),
        ),
    [products],
  );

  const filteredAndSortedProducts = useMemo(
    () =>
      sortedProducts.reduce((memo: IProduct[], product) => {
        if (
          (location?.curfew ? !isAlcoholic(product) : true) &&
          (!activeFilters.length ||
            !product.tags ||
            activeFilters.every(
              (filter) =>
                product.tags?.map((tag) => tag.trim()).includes(filter.trim()),
            )) &&
          (showOnlyMenuItems && location
            ? product.locationIds?.includes(location._id)
            : true) &&
          (showOnlyBarCodeLessItems
            ? !getProductBarCode(product, stocks)
            : true)
        ) {
          memo.push(product);
        }

        return memo;
      }, []),
    [
      activeFilters,
      location,
      showOnlyBarCodeLessItems,
      showOnlyMenuItems,
      sortedProducts,
      stocks,
    ],
  );

  return (
    <div
      {...props}
      className={
        css`
          box-shadow: ${currentCamp?.color} 0 0 10px 0px;
          background: ${currentCamp && getCorrectTextColor(currentCamp.color)};
        ` +
        (" " + (props.className || ""))
      }
      {...events}
      ref={ref}
    >
      <div
        className={css`
          display: grid;
          grid-gap: 0.5vw 1vw;
          padding: 1vw;
          grid-template-columns: repeat(auto-fill, minmax(172px, 1fr));
          text-align: center;
          > label {
            display: flex;
            align-items: center;
            background-color: ${(currentCamp &&
              getCorrectTextColor(currentCamp?.color, true)) ||
            "initial"};
            border: 2px solid black;
            color: ${(currentCamp && getCorrectTextColor(currentCamp?.color)) ||
            "initial"};
            padding: 0 6px;
            border-radius: 3px;
            font-size: 1em;
            > input {
              margin-right: 4px;
            }
          }
        `}
      >
        <label>
          <input
            type="checkbox"
            onChange={toggleOnlyMenuItems}
            checked={showOnlyMenuItems}
          />
          show only items on the menu
        </label>
        <label>
          <input
            type="checkbox"
            onChange={toggleShowOnlyBarCodeLessItems}
            checked={showOnlyBarCodeLessItems || false}
          />
          show only items without barcodes
        </label>
        <label>
          <input
            type="checkbox"
            onChange={toggleItemDetails}
            checked={showItemDetails}
          />
          show item details
        </label>
      </div>
      <div
        className={css`
          display: grid;
          grid-gap: 0.5vw 1vw;
          padding: 1vw;
          grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));

          > label {
            > input {
              margin-right: 4px;
            }
          }
        `}
      >
        {allTags.map((tag) => (
          <label
            key={tag}
            className={css`
              display: flex;
              align-items: center;
              background: ${stringToColour(tag) || `rgba(255, 255, 255, 0.4)`};
              color: ${getCorrectTextColor(stringToColour(tag)) || "white"};
              border: 2px solid black;
              padding: 0 6px;
              border-radius: 3px;
              margin-right: 2px;
              margin-bottom: 4px;
              font-size: 1.5em;
            `}
          >
            <input
              type="checkbox"
              checked={activeFilters.includes(tag.trim())}
              onChange={() => toggleTag(tag)}
            />
            {tag}
          </label>
        ))}
      </div>
      {isEditingProduct ? (
        <Modal onDismiss={() => setIsEditingProduct(null)}>
          <PageProductsItem
            product={products.find((p) => p._id === isEditingProduct)}
            onCancel={() => setIsEditingProduct(null)}
          />
        </Modal>
      ) : null}
      <div
        className={css`
          display: grid;
          grid-gap: 0.5vw 1vw;
          grid-template-columns: repeat(auto-fill, minmax(172px, 1fr));
          padding: 1vw;
        `}
      >
        {filteredAndSortedProducts.map((product) => (
          <ProductPickerProduct
            key={product._id}
            product={product}
            onPickedProduct={handlePickedProduct}
            onLongPressedProduct={handleLongPressedProduct}
            showItemDetails={showItemDetails}
          />
        ))}
      </div>
    </div>
  );
}
