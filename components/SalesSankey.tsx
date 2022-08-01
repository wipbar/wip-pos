import React, { useCallback, useMemo } from "react";
import {
  Layer,
  Rectangle,
  RectangleProps,
  ResponsiveContainer,
  Sankey,
  Tooltip,
} from "recharts";
import type { SankeyLink, SankeyNode } from "recharts/types/util/types";
import type { ICamp } from "../api/camps";
import Products, { IProduct } from "../api/products";
import Sales from "../api/sales";
import useMongoFetch from "../hooks/useMongoFetch";
import { getCorrectTextColor } from "/util";

function Node({
  x,
  y,
  width,
  height,
  index,
  payload,
  camp,
}: RectangleProps & {
  camp?: ICamp;
  index?: number;
  payload?: SankeyNode & { name: string; sourceLinks: any[]; color?: string };
  width?: number;
  height?: number;
}) {
  if (
    typeof width !== "number" ||
    typeof height !== "number" ||
    typeof x !== "number" ||
    typeof y !== "number"
  )
    return null;

  const isOut = Boolean(payload?.sourceLinks.length);
  return (
    <Layer key={`CustomNode${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={payload?.color || camp?.color}
        fillOpacity="1"
      />
      {payload?.name ? (
        <text
          textAnchor={isOut ? "end" : "start"}
          x={isOut ? x - 6 : x + width + 6}
          y={y + height / 2}
          fontSize="16"
          fontWeight="800"
          fill={getCorrectTextColor(camp?.color || "edab00", true)}
          stroke={getCorrectTextColor(camp?.color || "edab00", false)}
          strokeWidth={0.5}
          strokeOpacity={1}
        >
          {payload.name}
        </text>
      ) : null}
      {payload?.value ? (
        <text
          textAnchor={isOut ? "end" : "start"}
          x={isOut ? x - 6 : x + width + 6}
          y={y + height / 2 + 13}
          fontSize="14"
          fontWeight="800"
          fill={getCorrectTextColor(camp?.color || "edab00", true)}
          stroke={getCorrectTextColor(camp?.color || "edab00", false)}
          strokeWidth={0.5}
          strokeOpacity={1}
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sourceRelativeY,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  targetRelativeY,
  ...others
}: {
  payload?: SankeyLink & { target: { name: string; color?: string } };
  camp?: ICamp;
  sourceX?: number;
  sourceY?: number;
  sourceControlX?: number;
  targetX?: number;
  targetY?: number;
  targetControlX?: number;
  sourceRelativeY?: number;
  targetRelativeY?: number;
  linkWidth?: number;
}) {
  return (
    <path
      className="recharts-sankey-link"
      d={`
        M${sourceX},${sourceY}
        C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
      `}
      fill="none"
      stroke={payload?.target?.color || camp?.color}
      strokeWidth={linkWidth}
      strokeOpacity="0.75"
      {...others}
    />
  );
}

export default function SalesSankey({ currentCamp }: { currentCamp?: ICamp }) {
  const { data: campSales } = useMongoFetch(
    () =>
      currentCamp
        ? Sales.find({
            timestamp: { $gte: currentCamp.start, $lte: currentCamp.end },
          })
        : undefined,
    [currentCamp],
  );
  const { data: allSales } = useMongoFetch(() => Sales.find(), []);
  const sales = useMemo(
    () => (campSales?.length ? campSales : allSales),
    [campSales, allSales],
  );
  const salesNode = useMemo(
    () =>
      currentCamp && campSales?.length
        ? `Sales (${currentCamp.name})`
        : "Sales (all time)",
    [currentCamp, campSales],
  );
  const nodes = useMemo(
    () => [
      { color: "", name: salesNode },
      { color: "#FFED00", name: "Alcoholic" },
      { color: "#FFED00", name: "Beer" },
      { color: "#FFED00", name: "Tap" },
      { color: "#FFED00", name: "Non-Tap" },
      { color: "#D2691E", name: "Non-Beer" },
      { color: "#D2691E", name: "Cocktail" },
      { color: "#D2691E", name: "Non-Cocktail" },
      { color: "#193781", name: "Non-Alcoholic" },
      { color: "#193781", name: "Mate" },
      { color: "#16503f", name: "Non-Mate" },
    ],
    [salesNode],
  );
  const getNode = useCallback(
    (name: string) => nodes.findIndex((node) => node.name === name),
    [nodes],
  );

  const { data: products } = useMongoFetch(() => Products.find(), []);

  const data = useMemo(() => {
    const productsSold = sales.reduce<IProduct[]>((memo, sale) => {
      for (const saleProduct of sale.products) {
        const product = products.find(({ _id }) => _id === saleProduct._id);
        if (product) memo.push(product);
      }
      return memo;
    }, []);
    const links = [
      {
        source: getNode(salesNode),
        target: getNode("Alcoholic"),
        value: productsSold.filter(
          ({ tags }) =>
            tags?.includes("cocktail") ||
            tags?.includes("spirit") ||
            tags?.includes("cider") ||
            tags?.includes("beer"),
        ).length,
      },
      {
        source: getNode("Alcoholic"),
        target: getNode("Beer"),
        value: productsSold.filter(({ tags }) => tags?.includes("beer")).length,
      },
      {
        source: getNode("Beer"),
        target: getNode("Tap"),
        value: productsSold.filter(
          ({ tags }) => tags?.includes("beer") && tags?.includes("tap"),
        ).length,
      },
      {
        source: getNode("Beer"),
        target: getNode("Non-Tap"),
        value: productsSold.filter(
          ({ tags }) => tags?.includes("beer") && !tags?.includes("tap"),
        ).length,
      },
      {
        source: getNode("Alcoholic"),
        target: getNode("Non-Beer"),
        value: productsSold.filter(
          ({ tags }) =>
            tags?.includes("cocktail") ||
            tags?.includes("spirit") ||
            tags?.includes("cider"),
        ).length,
      },
      {
        source: getNode("Non-Beer"),
        target: getNode("Cocktail"),
        value: productsSold.filter(({ tags }) => tags?.includes("cocktail"))
          .length,
      },
      {
        source: getNode("Non-Beer"),
        target: getNode("Non-Cocktail"),
        value: productsSold.filter(
          ({ tags }) =>
            !tags?.includes("cocktail") &&
            (tags?.includes("spirit") || tags?.includes("cider")),
        ).length,
      },
      {
        source: getNode(salesNode),
        target: getNode("Non-Alcoholic"),
        value: productsSold.filter(
          ({ tags }) =>
            !(
              tags?.includes("cocktail") ||
              tags?.includes("spirit") ||
              tags?.includes("cider") ||
              tags?.includes("beer")
            ),
        ).length,
      },
      {
        source: getNode("Non-Alcoholic"),
        target: getNode("Mate"),
        value: productsSold.filter(
          ({ brandName, tags }) =>
            !(
              tags?.includes("cocktail") ||
              tags?.includes("spirit") ||
              tags?.includes("cider") ||
              tags?.includes("beer")
            ) && brandName?.includes("Mate"),
        ).length,
      },
      {
        source: getNode("Non-Alcoholic"),
        target: getNode("Non-Mate"),
        value: productsSold.filter(
          ({ brandName, tags }) =>
            !(
              tags?.includes("cocktail") ||
              tags?.includes("spirit") ||
              tags?.includes("cider") ||
              tags?.includes("beer")
            ) && !brandName?.includes("Mate"),
        ).length,
      },
    ]
      .map((link) => ({ ...link, value: link.value }))
      .filter(({ value }) => value >= 1);

    return {
      links,
      nodes: nodes.filter(
        ({ name }) =>
          name === salesNode ||
          links.some(({ target }) => target === getNode(name)),
      ),
    };
  }, [sales, getNode, salesNode, nodes, products]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <Sankey
        height={320}
        data={data}
        link={<Link camp={currentCamp} />}
        node={<Node camp={currentCamp} />}
      >
        <Tooltip />
      </Sankey>
    </ResponsiveContainer>
  );
}
