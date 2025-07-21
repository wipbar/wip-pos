import { differenceInHours, min } from "date-fns";
import React, { useCallback, useEffect, useMemo } from "react";
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
import type { ICamp } from "../api/camps";
import { useInterval } from "../hooks/useCurrentDate";
import useMethod from "../hooks/useMethod";
import { emptyArray, getCorrectTextColor } from "../util";

const XYAxisDomain = ["dataMin", "dataMax"];
const YAxisTickFormatter = (amount: number) => String(~~amount);
const XAxisTickFormatter = (hour: number) =>
  String((hour + 6) % 24).padStart(2, "0");
const tooltipLabelFormatter = (hour: number) =>
  `H${String((hour + 6) % 24).padStart(2, "0")}`;

export default function DayByDay({ currentCamp }: { currentCamp: ICamp }) {
  const [getDayByDayData, result] = useMethod("Sales.stats.DayByDay");
  const data = result?.data || emptyArray;

  const updateDayByDayData = useCallback(async () => {
    if (currentCamp) {
      await getDayByDayData({ campSlug: currentCamp.slug });
    }
  }, [currentCamp, getDayByDayData]);

  useEffect(() => {
    void updateDayByDayData();
  }, [updateDayByDayData]);
  useInterval(() => updateDayByDayData(), 30000);

  const numberOfDaysInCurrentCamp = currentCamp
    ? Math.ceil(
        differenceInHours(min(new Date(), currentCamp.end), currentCamp.start) /
          24,
      )
    : 0;

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
          margin={{ top: 24, right: 8, left: 16, bottom: 0 }}
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
              x={Math.max(...data.map((d) => (d?.[i] ? d.x : 0)))}
              y={Math.max(...data.map((d) => d?.[i] || 0))}
              key={i + "dot"}
              label={{
                value: `D${i}`,
                position:
                  Math.max(...data.map((d) => (d?.[i] ? d.x : 0))) > 21
                    ? "left"
                    : "insideBottomRight",
                offset: 8,
                style: {
                  fill: currentCamp && getCorrectTextColor(currentCamp.color),
                },
              }}
              fill={currentCamp && getCorrectTextColor(currentCamp.color)}
              r={4}
              stroke={currentCamp && getCorrectTextColor(currentCamp.color)}
            />
          ))}
          {Array.from({ length: numberOfDaysInCurrentCamp }, (_, i) => (
            <Line
              type="monotone"
              key={i}
              dataKey={i}
              name={`ΣD${i}`}
              strokeDasharray={
                numberOfDaysInCurrentCamp - 1 === i ? undefined : "3 3"
              }
              strokeWidth={numberOfDaysInCurrentCamp - 1 === i ? 3 : 2}
              stroke={"#ffffff"}
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
