import {
  addHours,
  endOfHour,
  isPast,
  isWithinRange,
  min,
  setHours,
  startOfHour,
  subHours,
} from "date-fns";
import { css } from "emotion";
import React, { useMemo } from "react";
import Camps from "../api/camps";
import Products, { isAlcoholic } from "../api/products";
import Sales from "../api/sales";
import ProductTrend from "../components/ProductTrend";
import useCurrentDate from "../hooks/useCurrentDate";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useMongoFetch from "../hooks/useMongoFetch";
import useWhyDidYouUpdate from "../hooks/useWhyDidYouUpdate";

function SparkLine({
  data,
  strokeWidth = 1,
  stroke = "transparent",
  fill = "#E22028",
  minMaxY,
  ...props
}) {
  //  console.log(data);
  const viewBoxWidth = 1000;
  const viewBoxHeight = 10;

  const pathD = useMemo(() => {
    if (data.length) {
      const xOffset = -1;
      const yOffset = viewBoxHeight;
      let minX,
        maxX,
        minY,
        maxY = minMaxY;
      for (let [x, y] of data) {
        if (!minX || x < minX) minX = x;
        if (!maxX || x > maxX) maxX = x;
        if (!minY || y < minY) minY = y;
        if (!maxY || y > maxY) maxY = y;
      }
      const XDelta = maxX - minX;
      const YDelta = maxY - minY;
      let dataPoints = data
        .map(([x, y]) =>
          [
            "L",
            xOffset + ((x - minX) / XDelta) * (viewBoxWidth + 1),
            yOffset - ((y - minY) / YDelta) * viewBoxHeight,
          ].join(" "),
        )
        .join(" ");
      const firstPoint = `L ${xOffset} ${viewBoxHeight}`;
      const lastPoint = `L ${xOffset + (viewBoxWidth + 1)} ${viewBoxHeight}`;
      return `M ${xOffset} ${yOffset} ${firstPoint} ${dataPoints} ${lastPoint}`;
    }
  }, [data, minMaxY]);

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

const rolloverOffset = 5;
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function PageMenu() {
  const {
    data: [currentCamp],
  } = useMongoFetch(Camps.find({}, { sort: { end: -1 } }));
  const currentDate = useCurrentDate(60000);
  const from = useMemo(
    () =>
      subHours(currentDate, 24) ||
      startOfHour(
        setHours(
          isPast(currentCamp?.start)
            ? currentCamp?.start
            : currentCamp?.buildup,
          rolloverOffset,
        ),
      ),
    [currentCamp, currentDate],
  );
  const to = useMemo(
    () =>
      currentDate ||
      endOfHour(min(setHours(currentCamp?.end, rolloverOffset), currentDate)),
    [currentCamp, currentDate],
  );
  const { location, loading: locationLoading, error } = useCurrentLocation();
  const { data: sales, loading: salesLoading } = useMongoFetch(
    Sales.find({ timestamp: { $gte: from, $lte: to } }),
    [from, to],
  );
  const { data: products, loading: productsLoading } = useMongoFetch(
    Products.find(
      {
        removedAt: { $exists: false },
        locationIds: { $elemMatch: { $eq: location?._id } },
      },
      { sort: { brandName: 1, name: 1 } },
    ),
    [location?._id],
  );
  useWhyDidYouUpdate("PageMenu", { products, sales, from, to });
  const productsGroupedByTags = useMemo(
    () =>
      Object.entries(
        products
          .filter((product) => (location.curfew ? isAlcoholic(product) : true))
          .reduce((memo, product) => {
            const key = [...(product.tags || [])].sort()?.join(",") || "other";
            if (memo[key]) {
              memo[key].push(product);
            } else {
              memo[key] = [product];
            }
            return memo;
          }, []),
      ),
    [location?.curfew, products],
  );

  if (productsLoading || locationLoading || salesLoading)
    return <>Loading...</>;

  if (error) return error;

  const randomIndex = getRandomInt(0, productsGroupedByTags?.length - 1);
  const randomIndex2 = getRandomInt(0, productsGroupedByTags?.length - 1);

  if (!productsGroupedByTags.length) {
    return (
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
      </marquee>
    );
  }
  return (
    <div className="my-masonry-grid">
      {productsGroupedByTags
        .sort((a, b) => a[0].localeCompare(b[0]))
        .sort((a, b) => b[1].length - a[1].length)
        .map(([tags, products], i) => {
          const productsByBrandName = Object.entries(
            products.reduce((m, product) => {
              if (m[product.brandName]) {
                m[product.brandName].push(product);
              } else {
                m[product.brandName] = [product];
              }
              return m;
            }, {}),
          )
            .sort(([, a], [, b]) => b.length - a.length)
            .map(([brand, products]) => [
              brand,
              products
                .sort((a, b) => a.name.localeCompare(b.name))
                .sort((a, b) => a.tap?.localeCompare(b.tap) || 0),
            ])
            .sort(
              ([, aProducts], [, bProducts]) =>
                aProducts?.[0]?.tap?.localeCompare(bProducts?.[0]?.tap) || 0,
            );
          return (
            <>
              <div key={tags} className={css``}>
                <h3
                  className={css`
                    margin: 0;
                    padding: 8px;
                  `}
                >
                  {tags?.join?.(", ") || tags}
                </h3>
                <ul
                  className={css`
                    margin: 0;
                    padding: 0;
                    list-style: none;
                  `}
                >
                  {productsByBrandName.map(([brandName, products]) => (
                    <li
                      key={brandName}
                      className={css`
                        margin: 0;
                        padding: 4px 6px;
                        display: flex;
                        flex-direction: column;
                        background: rgba(255, 255, 255, 0.1);
                        margin-top: 4px;
                        align-items: stretch;
                        -webkit-column-break-inside: avoid;
                        page-break-inside: avoid;
                        break-inside: avoid;
                      `}
                    >
                      <small
                        className={css`
                          flex: 1;
                          display: flex;
                          justify-content: space-between;
                        `}
                      >
                        <span>{brandName}</span>
                        <small>HAX</small>
                      </small>
                      {products.map((product) => (
                        <div
                          key={product._id}
                          className={css`
                            position: relative;
                            ${product.name.includes("Kramse")
                              ? `
                                  box-shadow: 0 0 20px black, 0 0 40px black;
                                  color: black;
                                  background: rgba(255, 0, 0, 0.75);
                                  padding: 0 4px;
                                  animation-name: wobble;
                                  animation-iteration-count: infinite;
                                  animation-duration: 2s;
                                `
                              : ""}
                          `}
                        >
                          <ProductTrend
                            product={product}
                            className={css`
                              position: absolute !important;
                              bottom: 0;
                              width: 100%;
                              z-index: 0;
                            `}
                          />
                          <div
                            className={css`
                              flex: 1;
                              display: flex;
                              justify-content: space-between;
                              margin-bottom: -12px;
                            `}
                          >
                            <span>
                              <div
                                className={css`
                                  font-weight: 500;
                                `}
                              >
                                {product.name}
                              </div>
                              <small
                                className={css`
                                  margin-top: -0.25em;
                                  display: block;
                                `}
                              >
                                {[
                                  product.description || null,
                                  product.unitSize && product.sizeUnit
                                    ? `${product.unitSize}${product.sizeUnit}`
                                    : null,
                                  typeof product.abv === "number" ||
                                  (typeof product.abv === "string" &&
                                    product.abv)
                                    ? `${product.abv}%`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .map((thing, i) => (
                                    <React.Fragment key={thing}>
                                      {i > 0 ? ", " : null}
                                      <small key={thing}>{thing}</small>
                                    </React.Fragment>
                                  ))}
                              </small>
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
                              border-bottom: #e22028 1px solid;
                            `}
                            data={Array.from({ length: 24 }, (_, i) => [
                              23 - i,
                              sales.reduce(
                                (memo, sale) =>
                                  isWithinRange(
                                    sale.timestamp,
                                    addHours(currentDate, -i),
                                    endOfHour(addHours(currentDate, -i)),
                                  )
                                    ? memo +
                                      sale.products.filter(
                                        (saleProduct) =>
                                          saleProduct._id === product._id,
                                      ).length
                                    : memo,
                                0,
                              ),
                            ])}
                          />
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
              {randomIndex === i ? (
                <center
                  className={css`
                    margin-top: -8px;
                    margin-bottom: 16px;
                    font-size: 0.6em;
                  `}
                >
                  <pre>ET1kkcTIrNKUEsI9NWKuYr8VGGOFlj@4</pre>
                </center>
              ) : null}
              {randomIndex2 === i ? (
                <center
                  className={css`
                    margin-top: -8px;
                    margin-bottom: 16px;
                    font-size: 0.6em;
                  `}
                >
                  <pre>Rendered: {new Date().toLocaleString()}</pre>
                </center>
              ) : null}
            </>
          );
        })}
    </div>
  );
}
