import React from "react";
import {
  Layer,
  Rectangle,
  ResponsiveContainer,
  Sankey,
  Tooltip,
} from "recharts";
import { useTracker } from "meteor/react-meteor-data";
import Products from "../api/products";
import Sales from "../api/sales";
import Camps from "../api/camps";
import { isPast } from "date-fns";
import useMongoFetch from "../hooks/useMongoFetch";
import useCurrentLocation from "../hooks/useCurrentLocation";

function Node({ x, y, width, height, index, payload, containerWidth, camp }) {
  const isOut = x + width + 6 > containerWidth;
  return (
    <Layer key={`CustomNode${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={
          payload?.name === "Mate"
            ? "#193781"
            : payload?.name === "Beer"
            ? "#FFED00"
            : payload?.name === "Non-Beer"
            ? "#D2691E"
            : payload?.name === "Non-Mate"
            ? "#16503f"
            : camp?.color || "#5192ca"
        }
        fillOpacity="1"
      />
      <text
        textAnchor={isOut ? "end" : "start"}
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2}
        fontSize="14"
        stroke="#FFED00"
      >
        {payload.name}
      </text>
      <text
        textAnchor={isOut ? "end" : "start"}
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2 + 13}
        fontSize="12"
        stroke="#FFED00"
        strokeOpacity="0.5"
      >
        {~~payload.value} units
      </text>
    </Layer>
  );
}
function Link({
  camp,
  sourceX,
  sourceY,
  sourceControlX,
  targetX,
  targetY,
  targetControlX,
  linkWidth,
  payload,
  ...others
}) {
  return (
    <path
      className="recharts-sankey-link"
      d={`
        M${sourceX},${sourceY}
        C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
      `}
      fill="none"
      stroke={
        payload.target.name === "Mate"
          ? "#193781"
          : payload.target.name === "Beer"
          ? "#FFED00"
          : payload.target.name === "Non-Beer"
          ? "#D2691E"
          : payload.target.name === "Non-Mate"
          ? "#16503f"
          : camp?.color || "#77c878"
      }
      strokeWidth={linkWidth}
      strokeOpacity="0.5"
      {...others}
    />
  );
}
export default function SalesSankey() {
  const currentLocation = useCurrentLocation()?.location;
  const {
    data: [currentCamp],
  } = useMongoFetch(Camps.find({}, { sort: { end: -1 } }));

  const data = useTracker(() => {
    const sales = Sales.find({
      timestamp: {
        $gte: isPast(currentCamp?.start)
          ? currentCamp?.start
          : currentCamp?.buildup,
        $lte: currentCamp?.end,
      },
    }).fetch();
    const productsSold = sales.reduce((memo, sale) => {
      memo.push(...sale.products.map(({ _id }) => Products.findOne(_id)));
      return memo;
    }, []);
    const data0 = {
      nodes: [
        { name: "Sales" },
        { name: "Alcoholic" },
        { name: "Beer" },
        { name: "Non-Beer" },
        { name: "Non-Alcoholic" },
        { name: "Mate" },
        { name: "Non-Mate" },
      ],
      links: [
        {
          source: 0,
          target: 1,
          value:
            productsSold.filter(
              ({ tags }) =>
                tags.includes("cocktail") ||
                tags.includes("spirit") ||
                tags.includes("cider") ||
                tags.includes("beer"),
            ).length || 0.00001,
        }, // Alcoholic
        {
          source: 1,
          target: 2,
          value:
            productsSold.filter(({ tags }) => tags.includes("beer")).length ||
            0.00001,
        }, // Beer
        {
          source: 1,
          target: 3,
          value:
            productsSold.filter(
              ({ tags }) =>
                tags.includes("cocktail") ||
                tags.includes("spirit") ||
                tags.includes("cider"),
            ).length || 0.00001,
        }, // Non-beer
        {
          source: 0,
          target: 4,
          value:
            productsSold.filter(
              ({ tags }) =>
                !(
                  tags.includes("cocktail") ||
                  tags.includes("spirit") ||
                  tags.includes("cider") ||
                  tags.includes("beer")
                ),
            ).length || 0.00001,
        }, // Non-alcoholic
        {
          source: 4,
          target: 5,
          value:
            productsSold.filter(
              ({ name, tags }) =>
                !(
                  tags.includes("cocktail") ||
                  tags.includes("spirit") ||
                  tags.includes("cider") ||
                  tags.includes("beer")
                ) && name === "Mate",
            ).length || 0.00001,
        }, // Mate
        {
          source: 4,
          target: 6,
          value:
            productsSold.filter(
              ({ name, tags }) =>
                !(
                  tags.includes("cocktail") ||
                  tags.includes("spirit") ||
                  tags.includes("cider") ||
                  tags.includes("beer")
                ) && name !== "Mate",
            ).length || 0.00001,
        }, // Non-mate
      ],
    };

    return data0;
  }, []);
  if (!data) return "Loading...";

  return (
    <ResponsiveContainer width={"100%"} height={350}>
      <Sankey
        height={350}
        data={data}
        nodePading={50}
        margin={{ left: 100, right: 100, bottom: 25 }}
        link={<Link camp={currentCamp} />}
        node={<Node camp={currentCamp} />}
      >
        <Tooltip />
      </Sankey>
    </ResponsiveContainer>
  );
}
