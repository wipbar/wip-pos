import {
  addHours,
  differenceInHours,
  endOfHour,
  isFuture,
  isWithinRange,
  min,
} from "date-fns";
import { sumBy } from "lodash";
import { useFind } from "meteor/react-meteor-data";
import React, { useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Sales from "../api/sales";
import useCurrentCamp from "../hooks/useCurrentCamp";
import { getCorrectTextColor } from "../util";

const XYAxisDomain = ["dataMin", "dataMax"];
const YAxisTickFormatter = (amount: number) => String(~~amount);
const XAxisTickFormatter = (hour: number) =>
  String((hour + 8) % 24).padStart(2, "0");
const tooltipLabelFormatter = (hour: number) =>
  `H${String((hour + 8) % 24).padStart(2, "0")}`;

const offset = -4;
const emptyArray: [] = [];
export default function DayByDay() {
  const currentCamp = useCurrentCamp();
  const sales =
    useFind(
      () =>
        currentCamp
          ? Sales.find({
              timestamp: { $gte: currentCamp.start, $lte: currentCamp.end },
            })
          : undefined,
      [currentCamp],
    ) || emptyArray;
  const numberOfDaysInCurrentCamp = currentCamp
    ? Math.ceil(
        differenceInHours(min(new Date(), currentCamp.end), currentCamp.start) /
          24,
      )
    : 0;

  const data = useMemo(
    () =>
      currentCamp
        ? Array.from({ length: 24 }, (_, i) =>
            Array.from({ length: numberOfDaysInCurrentCamp }).reduce<{
              x: number;
              [key: string]: number | null;
            }>(
              (memo, _, j) => {
                const hour: number = j * 24 + i;

                if (isFuture(addHours(currentCamp.start, hour + offset)))
                  return memo;

                return {
                  ...memo,
                  [j]: sumBy(
                    sales.filter((sale) =>
                      isWithinRange(
                        sale.timestamp,
                        addHours(currentCamp.start, j * 24 + offset),
                        endOfHour(addHours(currentCamp.start, hour + offset)),
                      ),
                    ),
                    "amount",
                  ),
                };
              },
              { x: i },
            ),
          )
        : [],
    [currentCamp, numberOfDaysInCurrentCamp, sales],
  );
  const YAxisLabel = useMemo(
    () => ({
      value: "Revenue (ʜᴀx)",
      angle: -90,
      offset: 70,
      position: "insideLeft",
      style: { fill: currentCamp?.color },
    }),
    [currentCamp],
  );

  return (
    <div>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis interval={1} dataKey="x" tickFormatter={XAxisTickFormatter} />
          <YAxis
            domain={XYAxisDomain}
            tickFormatter={YAxisTickFormatter}
            label={YAxisLabel}
          />
          <Tooltip
            labelFormatter={tooltipLabelFormatter}
            contentStyle={{
              background: currentCamp?.color,
              color:
                currentCamp?.color && getCorrectTextColor(currentCamp?.color),
            }}
          />
          <Legend />
          {Array.from({ length: numberOfDaysInCurrentCamp }, (_, i) => (
            <ReferenceDot
              x={Math.max(...data.map((d) => (d[i] ? d.x : 0)))}
              y={Math.max(...data.map((d) => d[i] || 0))}
              key={i + "dot"}
              label={{
                value: `D${i + 1}`,
                position:
                  Math.max(...data.map((d) => (d[i] ? d.x : 0))) > 21
                    ? "left"
                    : "insideBottomRight",
                offset: 8,
                style: { fill: currentCamp?.color },
              }}
              fill={currentCamp?.color}
              r={4}
              stroke={currentCamp?.color}
            />
          ))}
          {Array.from({ length: numberOfDaysInCurrentCamp }, (_, i) => (
            <Line
              type="monotone"
              key={i}
              dataKey={i}
              name={`ΣD${i + 1}`}
              strokeDasharray={
                numberOfDaysInCurrentCamp - 1 === i ? undefined : "3 3"
              }
              strokeWidth={numberOfDaysInCurrentCamp - 1 === i ? 3 : 2}
              stroke={"#ffffff" || currentCamp?.color}
              strokeOpacity={1 - (numberOfDaysInCurrentCamp - 1 - i) / 10}
              style={{
                opacity: 1 - (numberOfDaysInCurrentCamp - 1 - i) / 10,
              }}
              dot={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
