import { css } from "@emotion/css";
import { sample, zip } from "lodash";
import { useFind } from "meteor/react-meteor-data";
import { darken, lighten, transparentize } from "polished";
import React, {
  Fragment,
  SVGProps,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { getProductSize } from "../api/products";
import Styles, { type IStyle } from "../api/styles";
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
import { emptyObject, getCorrectTextColor } from "../util";

const flows = [
  ...draculaFlow,
  ...blackulaFlow,
  ...blackulaFlow,
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

export default function PageMenu() {
  const currentCamp = useCurrentCamp();
  const currentDate = useCurrentDate(30000);
  const { location, error } = useCurrentLocation();

  const style =
    useFind(() => Styles.find({ page: "menu" }))?.[0]?.style ||
    (emptyObject as IStyle["style"]);

  const [getData, { data: oij }] = useMethod("Products.menu.Menu");

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
      <marquee scrollAmount="20">
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
          <pre>Rendered: {new Date().toLocaleString()}</pre>
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

  const list = oij.sort(
    (a, b) => getOijProductsLength(b) - getOijProductsLength(a),
  );

  return (
    <div
      className={css`
        font-size: 0.8em;
        padding: 0.5em;
        column-width: 15em;
        @media (min-width: 1400px) {
          column-width: 17vw;
        }
        column-fill: balance;
        column-gap: 0.5em;
        max-width: 100%;
        break-inside: avoid;
        min-height: 100%;
      `}
      style={style}
    >
      {
        /*oij
        .sort((a, b) => getOijProductsLength(b) - getOijProductsLength(a))
        .map((_, i, list) =>
          zip(
            list.slice(0, list.length / 2),
            list.slice(list.length / 2, list.length).reverse(),
          ).flat(),
        )*/
        (
          zip(
            list.slice(0, Math.ceil(list.length / 2)),
            list.slice(Math.ceil(list.length / 2), list.length).reverse(),
          )
            .flat()
            .filter(Boolean) as typeof list
        ).map(([tags, productsByBrandName, tagsSpark]) => (
          <div
            key={tags}
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
                font-size: 2.25em;
                text-align: center;
              `}
            >
              {tags}
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
                transparentize(4 / 5, getCorrectTextColor(currentCamp?.color))};
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
                  <>
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
                        `}
                      >
                        {brandName}
                      </div>
                      <small
                        className={css`
                          padding: 0.25em 0.9em 0px;
                        `}
                      >
                        ʜᴀx
                      </small>
                    </small>
                    <li
                      key={brandName}
                      className={css`
                        margin: 0;
                        padding: 0.25em 0.5em 0px;
                        display: flex;
                        flex-direction: column;
                        background: ${currentCamp &&
                        transparentize(
                          4 / 5,
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
                            opacity: 0.75;
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
                        {products.map(([product, productSpark], i, list) => {
                          const nextProduct = list[i + 1]?.[0];
                          const productSize = getProductSize(product);
                          const subTexts = [
                            product.description || null,
                            (typeof product.abv === "number" &&
                              !Number.isNaN(product.abv)) ||
                            (typeof product.abv === "string" && product.abv)
                              ? `${product.abv}%`
                              : null,

                            productSize
                              ? `${productSize.unitSize}${productSize.sizeUnit}`
                              : null,
                          ].filter(Boolean);

                          return (
                            <div
                              key={product._id}
                              className={css`
                                position: relative;
                                break-inside: avoid;
                                line-height: 1.2;
                                ${product.salePrice == 0
                                  ? `
                          box-shadow: 0 0 20px black, 0 0 40px black;
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
                                      margin-top: 2px;
                                      font-weight: bold;
                                      line-height: 0.8;
                                    `}
                                  >
                                    {product.name}{" "}
                                    <small
                                      style={{
                                        fontWeight: "normal",
                                        lineHeight: 1,
                                        display: "inline-block",
                                        ...(product.name.startsWith("Purple") &&
                                        nextProduct?.name.startsWith("Purple")
                                          ? { display: "none" }
                                          : {}),
                                      }}
                                    >
                                      {subTexts.map((thing, i) => (
                                        <Fragment key={thing}>
                                          {i > 0 ? ", " : null}
                                          <small key={thing}>{thing}</small>
                                        </Fragment>
                                      ))}
                                    </small>
                                  </div>
                                </span>
                                <div
                                  className={css`
                                    text-align: right;
                                  `}
                                >
                                  <b>{Number(product.salePrice) || "00"}</b>
                                  {product.tap ? (
                                    <div
                                      className={css`
                                        line-height: 0.5;
                                        white-space: nowrap;
                                      `}
                                    >
                                      <small>🚰 {product.tap}</small>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <SparkLine
                                className={css`
                                  margin-top: -2px;
                                  margin-left: -0.5em;
                                  margin-right: -0.5em;
                                  width: calc(100% + 1em);
                                  display: block;
                                  border-bottom: ${currentCamp?.color} 1px solid;
                                `}
                                fill={currentCamp?.color}
                                data={productSpark}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </li>
                  </>
                ))}
              </ul>
            </div>
          </div>
        ))
      }
      <center
        className={css`
          margin-top: -0.5em;
          margin-bottom: 1em;
          font-size: 0.6em;
        `}
      >
        <pre>Rendered: {new Date().toLocaleString()}</pre>
      </center>
      {flow && location?.slug === "bar" ? (
        <p
          className={css`
            font-weight: 600;
            text-align: center;
            font-size: 0.9em;
            color: ${currentCamp &&
            getCorrectTextColor(
              getCorrectTextColor(currentCamp?.color) === "white"
                ? lighten(4 / 5, currentCamp?.color)
                : darken(4 / 5, currentCamp?.color),
            )};
          `}
        >
          {`"${flow}"`}
          <p
            className={css`
              font-size: 0.55em;
            `}
          >
            - {flowSource}
          </p>
        </p>
      ) : null}
    </div>
  );
}
