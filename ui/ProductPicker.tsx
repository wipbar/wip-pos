import { css } from "@emotion/css";
import { FastAverageColor } from "fast-average-color";
import { useFind } from "meteor/react-meteor-data";
import { lighten } from "polished";
import {
    type HTMLProps,
    lazy,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useDraggable } from "react-use-draggable-scroll-safe";
import { LongPressCallbackReason, useLongPress } from "use-long-press";
import Products, {
    type IProduct,
    type ProductID,
    getProductBarCode,
    getProductBrandName,
    getProductName,
    getProductSize,
    isAlcoholic,
    isBasicallySameProduct,
} from "../api/products";
import Stocks, { type IStock } from "../api/stocks";
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

const PageProductsItem = lazy(() => import("./PageProductsItem"));

const fac = new FastAverageColor();

const collator = new Intl.Collator("en");

function ProductPickerProductStock({ productId }: { productId: ProductID }) {
  const [call, result] = useMethod("Products.getRemainingPercent");

  useEffect(() => {
    void call({ productId });
  }, [call, productId]);
  useInterval(() => call({ productId }), 30000);

  const soldOutRatio = result.data;

  return (
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
      {soldOutRatio !== undefined &&
      soldOutRatio !== null &&
      !Number.isNaN(soldOutRatio) ? (
        <div
          className={css`
            background: rgb(0, 255, 0);
            position: absolute;
            right: 0;
            left: 0;
            bottom: 0;
            height: ${(1 - soldOutRatio) * 100}%;
          `}
        />
      ) : (
        <div
          className={css`
            background: rgb(127, 127, 127);
            position: absolute;
            right: 0;
            left: 0;
            bottom: 0;
            height: 100%;
          `}
        />
      )}
    </div>
  );
}

function ProductPickerProduct({
  products,
  stocks,
  onPickedProduct,
  onLongPressedProduct,
  showItemDetails,
}: {
  products: [IProduct, ...IProduct[]];
  stocks: IStock[];
  onPickedProduct: (product: IProduct) => void;
  onLongPressedProduct: (product: IProduct) => void;
  showItemDetails: boolean;
}) {
  const product = products[0];
  const [disambiguationProducts, setDisambiguationProducts] = useState<
    [IProduct, ...IProduct[]] | null
  >(null);

  const handlers = useLongPress(
    () => {
      if (products.length > 1) {
        setDisambiguationProducts(products);
      } else {
        onLongPressedProduct(product);
      }
    },
    {
      cancelOnMovement: true,
      cancelOutsideElement: true,
      onCancel: (_event, meta) => {
        if (meta.reason === LongPressCallbackReason.CancelledByRelease) {
          if (products.length > 1) {
            setDisambiguationProducts(products);
          } else {
            onPickedProduct(product);
          }
        }
      },
    },
  );

  const sortedTags = useMemo(
    () => sortTags(product.tags || emptyArray),
    [product],
  );

  const brandName = getProductBrandName(product, stocks);
  const name = getProductName(product, stocks);

  return (
    <>
      {disambiguationProducts ? (
        <Modal onDismiss={() => setDisambiguationProducts(null)}>
          <div
            className={css`
              display: grid;
              grid-gap: 0.5vw 1vw;
              grid-template-columns: repeat(auto-fill, minmax(172px, 1fr));
              padding: 1vw;
            `}
          >
            {disambiguationProducts.map((product) => (
              <ProductPickerProduct
                key={product._id}
                products={[product]}
                stocks={stocks}
                onPickedProduct={(product) => {
                  setDisambiguationProducts(null);
                  onPickedProduct(product);
                }}
                onLongPressedProduct={(product) => {
                  setDisambiguationProducts(null);
                  onLongPressedProduct(product);
                }}
                showItemDetails={showItemDetails}
              />
            ))}
          </div>
        </Modal>
      ) : null}
      <button
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
        <ProductPickerProductStock productId={product._id} />
        <div
          className={css`
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
          `}
        >
          {brandName ? (
            <div>
              <small>
                <small>{brandName}</small>
              </small>
            </div>
          ) : null}
          <div>
            <b
              className={css`
                font-size: 1.1em;
              `}
            >
              {name}
            </b>
            {showItemDetails && (
              <>
                <br />
                <small>
                  <small>
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
        {products.length > 1 ? (
          <div>{products.length} variants</div>
        ) : (
          <div>
            <i
              className={css`
                font-size: 0.8em;
              `}
            >
              {getProductSize(product)?.unitSize}
              {getProductSize(product)?.sizeUnit}
            </i>{" "}
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
        )}
      </button>
    </>
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

  const products = useFind(
    () =>
      Products.find({ removedAt: { $exists: false } }, { sort: { name: 1 } }),
    [],
  );
  const stocks = useFind(
    () => Stocks.find({ removedAt: { $exists: false } }, { sort: { name: 1 } }),
    [],
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
        .sort((a, b) => {
          const aName = getProductName(a, stocks);
          const bName = getProductName(b, stocks);
          if (!aName || !bName) return 0;
          return aName.localeCompare(bName);
        })
        .sort((a, b) => Number(a.tap || 0) - Number(b.tap || 0))
        .sort((a, b) =>
          tagsToString(a.tags).localeCompare(tagsToString(b.tags)),
        ),
    [products, stocks],
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
        {filteredAndSortedProducts
          .reduce((memo: [IProduct, ...IProduct[]][], product) => {
            if (
              memo[memo.length - 1]?.[0] &&
              isBasicallySameProduct(product, memo[memo.length - 1]![0])
            ) {
              memo[memo.length - 1]!.push(product);
            } else {
              memo.push([product]);
            }

            return memo;
          }, [])
          .map((products) => (
            <ProductPickerProduct
              key={products[0]._id}
              products={products}
              stocks={stocks}
              onPickedProduct={handlePickedProduct}
              onLongPressedProduct={handleLongPressedProduct}
              showItemDetails={showItemDetails}
            />
          ))}
      </div>
    </div>
  );
}
