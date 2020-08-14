import {
  endOfHour,
  isPast,
  min,
  setHours,
  startOfHour,
  subHours,
} from "date-fns";
import { css } from "emotion";
import React, { useMemo } from "react";
import Camps from "../api/camps";
import Products from "../api/products";
import Sales from "../api/sales";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useMongoFetch from "../hooks/useMongoFetch";
import Masonry from "react-masonry-css";

function SparkLine({
  data,
  strokeWidth = 1,
  stroke = "transparent",
  fill = "yellow",
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

const rolloverOffset = 4;
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function PageMenu() {
  const {
    data: [currentCamp],
  } = useMongoFetch(Camps.find({}, { sort: { end: -1 } }));
  const currentDate = new Date();
  const from =
    subHours(currentDate, 24) ||
    startOfHour(
      setHours(
        isPast(currentCamp?.start) ? currentCamp?.start : currentCamp?.buildup,
        rolloverOffset,
      ),
    );
  const to =
    currentDate ||
    endOfHour(min(setHours(currentCamp?.end, rolloverOffset), currentDate));
  const {
    location = {},
    loading: locationLoading,
    error,
  } = useCurrentLocation();
  const { data: sales, loading: salesLoading } = useMongoFetch(
    Sales.find({ timestamp: { $gte: from, $lte: to } }),
    [from, to],
  );
  const { data: products, loading: productsLoading } = useMongoFetch(
    Products.find(
      {
        removedAt: { $exists: false },
        locationIds: { $elemMatch: { $eq: location._id } },
      },
      { sort: { brandName: 1, name: 1 } },
    ),
    [location._id],
  );
  const productsGroupedByTags = useMemo(
    () =>
      Object.entries(
        products.reduce((memo, product) => {
          const key = [...(product.tags || [])].sort()?.join(",") || "other";
          if (memo[key]) {
            memo[key].push(product);
          } else {
            memo[key] = [product];
          }
          return memo;
        }, []),
      ),
    [products],
  );

  if (productsLoading || locationLoading) return "Loading...";
  if (error) return error;
  const randomIndex = getRandomInt(0, productsGroupedByTags?.length - 1);
  return (
    <Masonry
      breakpointCols={3}
      className="my-masonry-grid"
      columnClassName="my-masonry-grid_column"
    >
      {productsGroupedByTags
        .sort((a, b) => a[0].localeCompare(b[0]))
        //        .sort((a, b) => b[1].length - a[1].length)
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
          ).sort(([, a], [, b]) => b.length - a.length);
          return (
            <>
              <div
                key={tags}
                className={css`
                  -webkit-column-break-inside: avoid;
                  page-break-inside: avoid;
                  break-inside: avoid;
                  border: 3px solid #ffed00;
                  margin: 5px;
                  padding: 4px;
                  flex: 32% 0;
                `}
              >
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
                        <div key={product._id}>
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
                            <b>{product.salePrice}</b>
                          </div>
                          <SparkLine
                            className={css`
                              border-bottom: yellow 1px solid;
                            `}
                            data={(() => {
                              let productTotalForPeriod = 0;
                              const salesData = sales.reduce((memo, sale) => {
                                const count = sale.products.filter(
                                  (saleProduct) =>
                                    saleProduct._id === product._id,
                                ).length;
                                if (count) {
                                  productTotalForPeriod =
                                    productTotalForPeriod + count;
                                  memo.push([sale.timestamp, count]);
                                }

                                return memo;
                              }, []);

                              salesData.unshift([from, 0]);

                              salesData.push([
                                currentDate,
                                productTotalForPeriod,
                              ]);
                              return salesData;
                            })()}
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
                  `}
                >
                  <pre>ZFN4rgb73BQjXUzJzYtcCkCtApf9BS5j</pre>
                </center>
              ) : null}
            </>
          );
        })}
    </Masonry>
  );
}
