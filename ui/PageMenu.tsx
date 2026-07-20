import { css } from "@emotion/css";
import { convert } from "convert";
import sample from "lodash/sample";
import uniqBy from "lodash/uniqBy";
import zip from "lodash/zip";
import { useFind } from "meteor/react-meteor-data";
import { darken, lighten, transparentize } from "polished";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  type SVGProps,
} from "react";
import { useMatch } from "react-router";
import {
  getProductABV,
  getProductBrandName,
  getProductDescription,
  getProductName,
  getProductSize,
  isBasicallySameProduct,
  type IProduct,
} from "../api/products";
import Stocks, { type IStock } from "../api/stocks";
import Styles from "../api/styles";
import {
  blackulaFlow,
  draculaFlow,
  negative25Flow,
  tranculaFlow,
} from "../flow";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentDate, { useInterval } from "../hooks/useCurrentDate";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useMethod from "../hooks/useMethod";
import useSubscription from "../hooks/useSubscription";
import {
  emptyArray,
  getCorrectTextColor,
  SizeUnit,
  sortTags,
  stringToColour,
} from "../util";

const flows = [
  ...draculaFlow,
  ...blackulaFlow,
  ...blackulaFlow,
  ...negative25Flow,
  ...negative25Flow,
  ...tranculaFlow,
  ...tranculaFlow,
  ...tranculaFlow,
];

function SparkLine({
  data,
  strokeWidth = 1,
  stroke = "transparent",
  fill,
  ...props
}: {
  data: (readonly [number, number])[];
} & SVGProps<SVGSVGElement>) {
  const viewBoxWidth = 1000;
  const viewBoxHeight = 10;

  const pathD = useMemo(() => {
    const xOffset = 0;
    const yOffset = viewBoxHeight;
    let minX: number | null = null,
      maxX: number | null = null,
      minY: number | null = null,
      maxY: number | null = null;

    for (const [x, y] of data) {
      if (!minX || x < minX) minX = x;
      if (!maxX || x > maxX) maxX = x;
      if (!minY || y < minY) minY = y;
      if (!maxY || y > maxY) maxY = y;
    }
    const XDelta = maxX! - minX!;
    const YDelta = maxY! - minY!;
    const dataPoints = data
      .filter(() => YDelta !== 0)
      .map(([x, y]) =>
        [
          "L",
          xOffset + ((x - minX!) / XDelta) * viewBoxWidth,
          yOffset - ((y - minY!) / YDelta) * viewBoxHeight,
        ].join(" "),
      )
      .join(" ");

    return `M 0 ${viewBoxHeight} L ${viewBoxWidth} ${viewBoxHeight} ${dataPoints}`;
  }, [data]);

  return (
    <svg
      width="100%"
      height={viewBoxHeight}
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="none"
      {...props}
    >
      {pathD && (
        <path d={pathD} stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
      )}
    </svg>
  );
}

const genstandInCl = 1.5;
export const sizeAndAbvToUnit = (
  size: number,
  sizeUnit: SizeUnit,
  abv: number,
) => {
  const sizeInCl = convert(size, sizeUnit).to("cl");
  const alcoholInCl = (sizeInCl * abv) / 100;
  return alcoholInCl / genstandInCl;
};

export function ProductsItem({
  product,
  componentStocks,
  productSpark,
  soldOutRatio,
  showBrandName,
  hidePrice,
  servingTime,
  sizePrices,
}: {
  product: IProduct;
  componentStocks: IStock[];
  productSpark?: (readonly [number, number])[];
  soldOutRatio?: number | null;
  servingTime?: number;
  showBrandName?: boolean;
  hidePrice?: boolean;
  /** If this is provided, it will override the default size and sale price. This represents multiple size options, which are separate products¨
   * in the database, but should be displayed as one product in the menu.
   */
  sizePrices?: {
    productId: IProduct["_id"];
    unitSize: IProduct["unitSize"];
    salePrice: IProduct["salePrice"];
  }[];
}) {
  const currentCamp = useCurrentCamp();

  const productName = getProductName(product, componentStocks);
  const productBrandName = getProductBrandName(product, componentStocks);
  const productDescription = getProductDescription(product, componentStocks);
  const productSize = getProductSize(product);
  const productAbv = getProductABV(product, componentStocks);

  const subTexts = useMemo(
    () =>
      [
        showBrandName ? productBrandName || null : null,
        !showBrandName ? productDescription || null : null,
        productAbv
          ? `${
              product.components && product.components.length > 1 ? "~" : ""
            }${productAbv.toLocaleString("da", {
              maximumSignificantDigits: 2,
            })}%`
          : null,
        /*
        productSize && productAbv
          ? sizeAndAbvToUnit(
              productSize?.unitSize,
              productSize?.sizeUnit,
              productAbv,
            ).toLocaleString("da", { maximumSignificantDigits: 2 }) +
            " genstande"
          : null,
          */
        productSize && hidePrice
          ? `${productSize.unitSize}${productSize.sizeUnit}`.trim()
          : null,
        showBrandName
          ? sortTags(product.tags || emptyArray).map((tag) => (
              <span
                key={tag}
                className={css`
                  display: inline-block;
                  background: ${tag === "io"
                    ? "yellow"
                    : stringToColour(tag) || `rgba(0, 0, 0, 0.4)`};
                  color: ${getCorrectTextColor(stringToColour(tag)) || "white"};
                  padding: 0 3px;
                  border-radius: 4px;
                  margin-left: 2px;
                `}
              >
                {tag.trim()}
              </span>
            ))
          : null,
        servingTime ? (
          <small
            className={css`
              white-space: nowrap;
            `}
          >
            ⏳
            {(servingTime / 1000).toLocaleString("en", {
              maximumSignificantDigits: 2,
            })}
            s
          </small>
        ) : null,
      ].filter((t): t is NonNullable<typeof t> => Boolean(t)),
    [
      showBrandName,
      productBrandName,
      productDescription,
      productAbv,
      product.components,
      product.tags,
      productSize,
      hidePrice,
      servingTime,
    ],
  );

  return (
    <div
      key={product._id}
      className={css`
        padding: 0.125em 0.5em 0px;
        padding-right: 0.25em;
        position: relative;
        break-inside: avoid;
        line-height: 1.2;
        ${product.salePrice == 0
          ? `
              box-shadow:
                0 0 20px black,
                0 0 40px black;
              color: black;
              background: turquoise;
              padding: 0 4px;
              animation-name: wobble;
              animation-iteration-count: infinite;
              animation-duration: 2s;
              transform-origin: 50% 50%;
              z-index: 50;
            `
          : ""}
      `}
    >
      {/*<ProductTrend
                            product={product}
                            className={css`
                              position: absolute !important;
                              bottom: 0;
                              width: 100%;
                              z-index: 0;
                            `}
                          />*/}
      {soldOutRatio !== undefined ? (
        <div
          className={css`
            background: red;
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            width: 4px;
          `}
        >
          {soldOutRatio !== null && !Number.isNaN(soldOutRatio) ? (
            <div
              className={css`
                background: rgb(0, 255, 0);
                position: absolute;
                right: 0;
                left: 0;
                bottom: 0;
                height: ${Math.min((1 - soldOutRatio) * 100, 100)}%;
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
      ) : null}
      <div
        className={css`
          flex: 1;
          display: flex;
        `}
      >
        <div
          className={css`
            flex: 1;
            font-weight: bold;
            line-height: 0.8;
          `}
        >
          {product.tap && !hidePrice ? <small>{product.tap}🚰</small> : null}{" "}
          {productName}{" "}
          <small
            style={{
              fontWeight: "normal",
              lineHeight: 0.75,
              display: "inline-block",
              marginBottom: "0.25em",
            }}
          >
            {subTexts.map((thing, i) => (
              <Fragment
                key={String(
                  // eslint-disable-next-line @typescript-eslint/no-base-to-string
                  typeof thing === "string" || !Array.isArray(thing)
                    ? thing
                    : thing[0]?.key,
                )}
              >
                {i > 0 ? (
                  typeof thing === "string" || !Array.isArray(thing) ? (
                    <small>, </small>
                  ) : (
                    <small> </small>
                  )
                ) : null}
                <small>{thing}</small>
              </Fragment>
            ))}
          </small>
        </div>
        {hidePrice ? null : (
          <div
            className={css`
              text-align: right;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              align-items: flex-end;
              margin-left: 0.5em;
            `}
          >
            {(
              sizePrices ?? [
                {
                  productId: product._id,
                  salePrice: product.salePrice,
                  unitSize: productSize?.unitSize,
                },
              ]
            ).map((sizePrice) =>
              (sizePrice.salePrice || 0) >= 0 ? (
                <div
                  key={sizePrice.productId}
                  className={css`
                    display: flex;
                    flex-direction: column;
                  `}
                >
                  <b
                    className={css`
                      line-height: 0.9;
                    `}
                  >
                    {Number(sizePrice.salePrice) || "00"}
                  </b>
                  {sizePrice.unitSize && productSize ? (
                    <span
                      className={css`
                        font-size: 0.5em;
                        vertical-align: top;
                        line-height: 0.9;
                      `}
                    >{`${sizePrice.unitSize}${productSize.sizeUnit}`}</span>
                  ) : null}
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>
      {productSpark ? (
        <SparkLine
          className={css`
            margin-top: -2px;
            /* compensate for padding and health bar */
            margin-left: calc(-0.5em + 4px);
            width: calc(100% + 0.75em - 4px);
            display: block;
            border-bottom: ${currentCamp?.color} 1px solid;
          `}
          fill={currentCamp?.color}
          data={productSpark}
        />
      ) : null}
    </div>
  );
}

export function StockItem({ stock }: { stock: IStock }) {
  const subTexts = [`${stock.unitSize}${stock.sizeUnit}`].filter(Boolean);

  return (
    <div
      key={stock._id}
      className={css`
        padding: 0.125em 0em 0px;
        position: relative;
        break-inside: avoid;
        line-height: 1.2;
      `}
    >
      <div
        className={css`
          flex: 1;
          display: flex;
          justify-content: space-between;
        `}
      >
        <span>
          <div
            className={css`
              font-weight: bold;
              line-height: 0.8;
            `}
          >
            {stock.brandName ? `${stock.brandName} ` : null}
            {stock.name}{" "}
            <small
              style={{
                fontWeight: "normal",
                lineHeight: 1,
                display: "inline-block",
              }}
            >
              {subTexts.map((thing, i) => (
                <Fragment key={thing}>
                  {i > 0 ? ", " : null}
                  <small>{thing}</small>
                </Fragment>
              ))}
            </small>
          </div>
        </span>
      </div>
    </div>
  );
}

export default function PageMenu() {
  useSubscription("stocks");
  const currentCamp = useCurrentCamp();
  const currentDate = useCurrentDate(30000);
  const { location, error } = useCurrentLocation();
  const match = useMatch("/:locationSlug/menu/:tags");
  const tagsFilter = match?.params.tags?.split(",") || emptyArray;

  const style = useFind(() => Styles.find({ page: "menu" }), [])?.[0]?.style;

  const [getData, { data: oij }] = useMethod("Products.menu.Menu");

  const stocks = useFind(
    () => Stocks.find({ removedAt: { $exists: false } }),
    [],
  );

  const updateData = useCallback(async () => {
    if (currentCamp) await getData({ locationSlug: location!.slug });
  }, [currentCamp, getData, location]);

  useEffect(() => {
    void updateData();
  }, [updateData]);
  useInterval(() => updateData(), 30000);

  if (error) return error;

  if (location?.closed) {
    return (
      <div
        className={css`
          font-size: 3em;
          flex: 1;
          background: ${Number(currentDate.getSeconds()) % 2
            ? currentCamp && getCorrectTextColor(currentCamp.color)
            : currentCamp?.color};
          color: ${Number(currentDate.getSeconds()) % 2
            ? currentCamp?.color
            : currentCamp && getCorrectTextColor(currentCamp.color)};
          font-size: 6em;
          height: 80vh;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
        `}
      >
        <center>
          We are closed
          <br />
          at the moment
          <br />
          <img
            src="/img/logo_square_white_on_transparent_500_RGB.png"
            className={css`
              width: 20vh;
              margin: -5vh;
            `}
          />
        </center>
      </div>
    );
  }

  if (!oij?.length) {
    return (
      // @ts-ignore
      // eslint-disable-next-line react/no-unknown-property
      <marquee scrollamount="20">
        <big
          className={css`
            font-size: 6em;
            height: 80vh;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
          `}
        >
          <center>
            Nothing for sale
            <br />
            at the moment :(
          </center>
        </big>
        <center>
          <pre>Rendered: {new Date().toLocaleString("en-DK")}</pre>
        </center>
        {/* @ts-ignore */}
      </marquee>
    );
  }
  const flow = sample(flows);

  const flowSource = flow
    ? draculaFlow.includes(flow)
      ? "Dracula"
      : blackulaFlow.includes(flow)
      ? "Blackula"
      : negative25Flow.includes(flow)
      ? "Negative 25"
      : tranculaFlow.includes(flow)
      ? "Trancula"
      : "Unknown"
    : "Unknown";

  const getOijProductsLength = (o: NonNullable<typeof oij>[number]): number =>
    o[1]?.reduce((m, b) => m + b[1].length, 0) || NaN;

  const positiveTagFilter = tagsFilter.length
    ? tagsFilter.filter((tag) => !tag.startsWith("!"))
    : null;
  const negativeTagFilter = tagsFilter.length
    ? tagsFilter.filter((tag) => tag.startsWith("!"))
    : null;

  let list = oij
    .filter(
      (o) =>
        (!positiveTagFilter ||
          positiveTagFilter.every((tag) => o[0].includes(tag))) &&
        (!negativeTagFilter ||
          negativeTagFilter.every((tag) => !o[0].includes(tag.slice(1)))),
    )
    .sort((a, b) => getOijProductsLength(b) - getOijProductsLength(a));
  const mergeBrands = (a: (typeof list)[number][1]) => {
    const merged: typeof a = [];
    const brandMap = new Map<string, (typeof a)[0][1]>();
    for (const [brandName, products] of a) {
      if (!brandMap.has(brandName)) {
        brandMap.set(brandName, []);
      }
      brandMap.get(brandName)!.push(...products);
    }
    for (const [brandName, products] of brandMap) {
      merged.push([brandName, products]);
    }
    return merged;
  };
  list = list.reduce(
    (memo, [tags, productsByBrandName, tagsSpark]) => {
      if (!tags.includes("tap")) {
        productsByBrandName = Array.from(productsByBrandName).sort(
          (a, b) => b[1].length - a[1].length,
        );
        productsByBrandName = zip(
          productsByBrandName.slice(
            0,
            Math.ceil(productsByBrandName.length / 2),
          ),
          productsByBrandName
            .slice(
              Math.ceil(productsByBrandName.length / 2),
              productsByBrandName.length,
            )
            .reverse(),
        )
          .flat()
          .filter((l): l is NonNullable<typeof l> => Boolean(l));
      }
      const tagsProductsLength = getOijProductsLength([
        tags,
        productsByBrandName,
        tagsSpark,
        tags,
      ]);
      // TODO: split more if more than 24 products
      if (tagsProductsLength > 12) {
        let newLizt1: typeof productsByBrandName = [];
        let newLizt2: typeof productsByBrandName = [];
        let i = 0;
        for (const [brandName, products] of productsByBrandName) {
          for (const product of products) {
            if (i < tagsProductsLength / 2) {
              newLizt1.push([brandName, [product]]);
            } else {
              newLizt2.push([brandName, [product]]);
            }
            i++;
          }
        }
        newLizt1 = mergeBrands(newLizt1);
        newLizt2 = mergeBrands(newLizt2);
        memo.push(
          [tags, newLizt1, tagsSpark, tags + `1`],
          [tags, newLizt2, tagsSpark, tags + `2`],
        );
      } else {
        memo.push([tags, productsByBrandName, tagsSpark, tags]);
      }
      return memo;
    },
    [] as typeof list,
  );

  return (
    <div
      className={css`
        font-size: 0.8em;
        padding: 0.5em;
        column-width: 15em;
        @media (min-width: 1400px) {
          column-width: 11em;
        }
        column-fill: balance;
        column-gap: 0.5em;
        max-width: 100%;
        break-inside: avoid;
        min-height: 100%;
      `}
      style={style}
    >
      {zip(
        list.slice(0, Math.ceil(list.length / 2)),
        list.slice(Math.ceil(list.length / 2), list.length).reverse(),
      )
        .flat()
        .filter((l): l is NonNullable<typeof l> => Boolean(l))
        .map(([tags, productsByBrandName, tagsSpark, key]) => (
          <div
            key={key || tags}
            className={css`
              color: ${currentCamp &&
              getCorrectTextColor(
                getCorrectTextColor(currentCamp.color) === "white"
                  ? lighten(4 / 5, currentCamp.color)
                  : darken(4 / 5, currentCamp.color),
              )};

              break-inside: avoid;
            `}
          >
            <h1
              className={css`
                margin: 0;
                font-size: 2em;
                text-align: center;
                color: ${currentCamp && getCorrectTextColor(currentCamp.color)};
                display: flex;
                justify-content: space-evenly;
                margin-bottom: -8px;
              `}
            >
              {sortTags(tags.split(",") || emptyArray).map((tag) => (
                <span
                  key={tag}
                  className={css`
                    display: inline-block;
                    background: ${tag === "io"
                      ? "yellow"
                      : stringToColour(tag) || `rgba(0, 0, 0, 0.4)`};
                    color: ${getCorrectTextColor(stringToColour(tag)) ||
                    "white"};
                    padding: 0em;
                    border-radius: 4px;
                    margin-left: 2px;
                    flex: 1;
                  `}
                >
                  {tag.trim()}
                </span>
              ))}
            </h1>
            <SparkLine
              className={css`
                margin-top: -8px;
                display: block;
                border-bottom: ${currentCamp &&
                  getCorrectTextColor(
                    getCorrectTextColor(currentCamp?.color) === "white"
                      ? lighten(4 / 5, currentCamp?.color)
                      : darken(4 / 5, currentCamp?.color),
                  )}
                  1px solid;
              `}
              fill={
                currentCamp &&
                getCorrectTextColor(
                  getCorrectTextColor(currentCamp?.color) === "white"
                    ? lighten(4 / 5, currentCamp?.color)
                    : darken(4 / 5, currentCamp?.color),
                )
              }
              data={tagsSpark}
            />
            <div
              className={css`
                background: ${currentCamp &&
                transparentize(5 / 6, getCorrectTextColor(currentCamp?.color))};
                color: ${currentCamp &&
                getCorrectTextColor(
                  getCorrectTextColor(currentCamp?.color) === "white"
                    ? lighten(4 / 5, currentCamp?.color)
                    : darken(4 / 5, currentCamp?.color),
                )};

                break-inside: avoid;
                padding: 0.25em;
                margin-bottom: 0.5em;
              `}
            >
              <ul
                className={css`
                  margin: 0;
                  padding: 0;
                  list-style: none;
                  display: flex;
                  flex-direction: column;
                  gap: 0.25em;
                `}
              >
                {productsByBrandName.map(([brandName, products]) => (
                  <Fragment key={brandName}>
                    <small
                      className={css`
                        flex: 1;
                        display: flex;
                        justify-content: space-around;
                      `}
                    >
                      <div
                        className={css`
                          flex: 1;
                          text-align: center;
                          font-weight: 600;
                          color: ${currentCamp &&
                          getCorrectTextColor(currentCamp?.color)};
                        `}
                      >
                        {brandName}
                      </div>
                      <small
                        className={css`
                          padding: 0.25em 0.9em 0px;
                          padding-right: 0.6em;
                        `}
                      >
                        ʜᴀx
                      </small>
                    </small>
                    <li
                      key={brandName}
                      className={css`
                        margin: 0;
                        display: flex;
                        flex-direction: column;
                        background: ${currentCamp &&
                        transparentize(
                          2 / 5,
                          getCorrectTextColor(currentCamp?.color),
                        )};
                        align-items: stretch;
                        break-inside: avoid;

                        border: 1px solid
                          ${currentCamp &&
                          transparentize(
                            1 / 5,
                            getCorrectTextColor(currentCamp?.color),
                          )};
                        position: relative;
                      `}
                    >
                      {brandName === "BornHack" &&
                      tags.includes("spirit") &&
                      tags.includes("bottle") ? (
                        <img
                          src="/img/logo_square_white_on_transparent_500_RGB.png"
                          className={css`
                            object-fit: contain;
                            position: absolute;
                            height: 100%;
                            width: auto;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            opacity: 0.5;
                            z-index: 0;
                          `}
                        />
                      ) : null}
                      <div
                        className={css`
                          display: flex;
                          flex-direction: column;
                          gap: 0.125em;
                        `}
                      >
                        {products
                          .reduce(
                            (memo, menuItemTuple) => {
                              const lastEntry = memo[memo.length - 1];
                              const lastProductOrProducts = lastEntry?.[0];
                              if (
                                lastEntry &&
                                lastProductOrProducts &&
                                (Array.isArray(lastProductOrProducts)
                                  ? lastProductOrProducts.some((p) =>
                                      isBasicallySameProduct(
                                        p,
                                        menuItemTuple[0],
                                      ),
                                    )
                                  : isBasicallySameProduct(
                                      lastProductOrProducts,
                                      menuItemTuple[0],
                                    ))
                              ) {
                                memo[memo.length - 1]![0] = uniqBy(
                                  Array.isArray(lastProductOrProducts)
                                    ? [
                                        ...lastProductOrProducts,
                                        menuItemTuple[0],
                                      ]
                                    : [lastProductOrProducts, menuItemTuple[0]],
                                  (p) => p._id,
                                );
                              } else {
                                memo.push(
                                  menuItemTuple as (typeof memo)[number],
                                );
                              }

                              return memo;
                            },
                            [] as [
                              IProduct | IProduct[],
                              (readonly [number, number])[],
                              number | null,
                              number | undefined,
                            ][],
                          )
                          .map(
                            ([
                              productOrProducts,
                              productSpark,
                              soldOutRatio,
                              servingTime,
                            ]) => {
                              const product = Array.isArray(productOrProducts)
                                ? productOrProducts[0]!
                                : productOrProducts;

                              const componentStocks = (product.components ?? [])
                                .map((component) =>
                                  stocks.find(
                                    (stock) => stock._id === component.stockId,
                                  ),
                                )
                                .filter((s): s is IStock => Boolean(s));

                              return (
                                <ProductsItem
                                  key={product._id}
                                  product={product}
                                  componentStocks={componentStocks}
                                  productSpark={productSpark}
                                  servingTime={servingTime}
                                  soldOutRatio={soldOutRatio}
                                  sizePrices={
                                    Array.isArray(productOrProducts)
                                      ? productOrProducts.map((p) => ({
                                          productId: p._id,
                                          unitSize: getProductSize(p)?.unitSize,
                                          salePrice: p.salePrice ?? NaN,
                                        }))
                                      : undefined
                                  }
                                />
                              );
                            },
                          )}
                      </div>
                    </li>
                  </Fragment>
                ))}
              </ul>
            </div>
          </div>
        ))}
      <center
        className={css`
          margin-top: -0.5em;
          margin-bottom: 1em;
          font-size: 0.6em;
        `}
      >
        <pre>Rendered: {new Date().toLocaleString("en-DK")}</pre>
      </center>
      {flow && location?.slug === "bar" ? (
        <p
          className={css`
            font-weight: 600;
            text-align: center;
            font-size: 0.9em;
            color: ${currentCamp && getCorrectTextColor(currentCamp.color)};
            opacity: 0.5;
            break-inside: avoid;
          `}
        >
          {`"${flow}"`}
          <span
            className={css`
              display: block;
              font-size: 0.55em;
            `}
          >
            - {flowSource}
          </span>
        </p>
      ) : null}
    </div>
  );
}
