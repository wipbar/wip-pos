import React, { useCallback, useEffect } from "react";
import {
  Layer,
  Rectangle,
  ResponsiveContainer,
  Sankey,
  type RectangleProps,
} from "recharts";
import type { SankeyLink, SankeyNode } from "recharts/types/util/types";
import type { ICamp } from "../api/camps";
import { useInterval } from "../hooks/useCurrentDate";
import useMethod from "../hooks/useMethod";
import { getCorrectTextColor } from "../util";

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
  const [getData, { data: methodData }] = useMethod("Sales.stats.SalesSankey");

  const updateData = useCallback(async () => {
    if (currentCamp) await getData({ campSlug: currentCamp.slug });
  }, [currentCamp, getData]);

  useEffect(() => {
    updateData();
  }, [updateData]);
  useInterval(() => updateData(), 10000);

  return (
    <ResponsiveContainer width="100%" height={350}>
      {methodData ? (
        <Sankey
          height={320}
          data={methodData}
          link={<Link camp={currentCamp} />}
          node={<Node camp={currentCamp} />}
        />
      ) : (
        <>{null}</>
      )}
    </ResponsiveContainer>
  );
}
