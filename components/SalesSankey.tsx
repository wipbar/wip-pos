import React from "react";
import {
  Layer,
  Rectangle,
  RectangleProps,
  ResponsiveContainer,
  Sankey,
  Tooltip,
} from "recharts";
import { useTracker } from "meteor/react-meteor-data";
import Products, { IProduct } from "../api/products";
import Sales from "../api/sales";
import Camps, { ICamp } from "../api/camps";
import { isPast } from "date-fns";
import useMongoFetch from "../hooks/useMongoFetch";
import { SankeyLink, SankeyNode } from "recharts/types/util/types";

function Node({
  x,
  y,
  width,
  height,
  index,
  payload,
  containerWidth,
  camp,
}: RectangleProps & {
  camp: ICamp;
  index?: number;
  payload?: SankeyNode & { name: string };
  containerWidth?: number;
}) {
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
      {payload?.name ? (
        <text
          textAnchor={isOut ? "end" : "start"}
          x={isOut ? x - 6 : x + width + 6}
          y={y + height / 2}
          fontSize="14"
          stroke="#FFED00"
        >
          {payload.name}
        </text>
      ) : null}
      {payload?.value ? (
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
      ) : null}
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
}: {
  payload?: SankeyLink & { target: { name: string } };
  camp: ICamp;
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
        payload?.target.name === "Mate"
          ? "#193781"
          : payload?.target.name === "Beer"
          ? "#FFED00"
          : payload?.target.name === "Non-Beer"
          ? "#D2691E"
          : payload?.target.name === "Non-Mate"
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
    const productsSold = sales.reduce<IProduct[]>((memo, sale) => {
      memo.push(...sale.products.map(({ _id }) => Products.findOne(_id)!));
      return memo;
    }, []);
    const nodes = [
      { name: "Sales" },
      { name: "Alcoholic" },
      { name: "Beer" },
      { name: "Tap" },
      { name: "Non-Tap" },
      { name: "Non-Beer" },
      { name: "Non-Alcoholic" },
      { name: "Mate" },
      { name: "Non-Mate" },
      { name: "Non-Cocktail" },
      { name: "Cocktail" },
    ];
    const getNode = (name: string) =>
      nodes.findIndex((node) => node.name === name);
    const data0 = {
      nodes,
      links: [
        {
          source: getNode("Sales"),
          target: getNode("Alcoholic"),
          value:
            productsSold.filter(
              ({ tags }) =>
                tags?.includes("cocktail") ||
                tags?.includes("spirit") ||
                tags?.includes("cider") ||
                tags?.includes("beer"),
            ).length || 0.00001,
        }, // Alcoholic
        {
          source: getNode("Alcoholic"),
          target: getNode("Beer"),
          value:
            productsSold.filter(({ tags }) => tags?.includes("beer")).length ||
            0.00001,
        }, // Beer
        {
          source: getNode("Beer"),
          target: getNode("Tap"),
          value:
            productsSold.filter(
              ({ tags }) => tags?.includes("beer") && tags?.includes("tap"),
            ).length || 0.00001,
        }, // Tap Beer
        {
          source: getNode("Beer"),
          target: getNode("Non-Tap"),
          value:
            productsSold.filter(
              ({ tags }) => tags?.includes("beer") && !tags?.includes("tap"),
            ).length || 0.00001,
        }, // Non-Tap Beer
        {
          source: getNode("Alcoholic"),
          target: getNode("Non-Beer"),
          value:
            productsSold.filter(
              ({ tags }) =>
                tags?.includes("cocktail") ||
                tags?.includes("spirit") ||
                tags?.includes("cider"),
            ).length || 0.00001,
        }, // Non-beer
        {
          source: getNode("Non-Beer"),
          target: getNode("Cocktail"),
          value:
            productsSold.filter(({ tags }) => tags?.includes("cocktail"))
              .length || 0.00001,
        }, // Cocktails
        {
          source: getNode("Non-Beer"),
          target: getNode("Non-Cocktail"),
          value:
            productsSold.filter(
              ({ tags }) =>
                !tags?.includes("cocktail") &&
                (tags?.includes("spirit") || tags?.includes("cider")),
            ).length || 0.00001,
        }, // Non-Cocktail
        {
          source: getNode("Sales"),
          target: getNode("Non-Alcoholic"),
          value:
            productsSold.filter(
              ({ tags }) =>
                !(
                  tags?.includes("cocktail") ||
                  tags?.includes("spirit") ||
                  tags?.includes("cider") ||
                  tags?.includes("beer")
                ),
            ).length || 0.00001,
        }, // Non-alcoholic
        {
          source: getNode("Non-Alcoholic"),
          target: getNode("Mate"),
          value:
            productsSold.filter(
              ({ brandName, tags }) =>
                !(
                  tags?.includes("cocktail") ||
                  tags?.includes("spirit") ||
                  tags?.includes("cider") ||
                  tags?.includes("beer")
                ) && brandName?.includes("Mate"),
            ).length || 0.00001,
        }, // Mate
        {
          source: getNode("Non-Alcoholic"),
          target: getNode("Non-Mate"),
          value:
            productsSold.filter(
              ({ brandName, tags }) =>
                !(
                  tags?.includes("cocktail") ||
                  tags?.includes("spirit") ||
                  tags?.includes("cider") ||
                  tags?.includes("beer")
                ) && !brandName?.includes("Mate"),
            ).length || 0.00001,
        }, // Non-mate
      ],
    };

    return data0;
  }, []);

  if (!data) return <>Loading...</>;

  return (
    <ResponsiveContainer width={"100%"} height={350}>
      <Sankey
        height={320}
        data={data}
        nodePadding={10}
        margin={{ left: 100, right: 100, bottom: 25 }}
        link={<Link camp={currentCamp} />}
        node={<Node camp={currentCamp} />}
      >
        <Tooltip />
      </Sankey>
    </ResponsiveContainer>
  );
}
