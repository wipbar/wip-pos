import {
  addHours,
  differenceInDays,
  endOfHour,
  isFuture,
  isWithinRange,
} from "date-fns";
import React, { useMemo } from "react";
import {
  Bar,
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
import useMongoFetch from "../hooks/useMongoFetch";
import useCurrentCamp from "/hooks/useCurrentCamp";

export default function DayByDay() {
  const { data: sales } = useMongoFetch(Sales);
  const currentCamp = useCurrentCamp();
  const numberOfDaysInCurrentCamp = currentCamp
    ? differenceInDays(currentCamp.end, currentCamp.start)
    : 7; // Mostly they're 7 days

  const data = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) =>
        Array.from({ length: numberOfDaysInCurrentCamp }).reduce<{
          x: number;
          [key: string]: number | null;
        }>(
          (memo, _, j) => {
            const hour = j * 24 + i;

            if (!currentCamp) return memo;

            if (isFuture(addHours(currentCamp.start, hour + 6))) return memo;

            return {
              ...memo,
              [j]:
                sales
                  .filter((sale) =>
                    isWithinRange(
                      sale.timestamp,
                      addHours(currentCamp.start, j * 24 + 6),
                      endOfHour(addHours(currentCamp.start, hour + 6)),
                    ),
                  )
                  .reduce((memo, sale) => memo + Number(sale.amount), 0) ||
                null,
              [j + "individual"]:
                sales
                  .filter((sale) =>
                    isWithinRange(
                      sale.timestamp,
                      addHours(currentCamp.start, hour + 6),
                      endOfHour(addHours(currentCamp.start, hour + 6)),
                    ),
                  )
                  .reduce((memo, sale) => memo + Number(sale.amount), 0) ||
                null,
            };
          },
          { x: i },
        ),
      ),
    [currentCamp, numberOfDaysInCurrentCamp, sales],
  );

  return (
    <div>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            interval={1}
            dataKey="x"
            tickFormatter={(hour) => String((hour + 8) % 24).padStart(2, "0")}
          />
          <YAxis
            domain={["dataMin", "dataMax"]}
            tickFormatter={(amount: number) => String(~~amount)}
            label={{
              value: "Revenue (HAX)",
              angle: -90,
              offset: 70,
              position: "insideLeft",
              style: { fill: currentCamp?.color },
            }}
          />
          <Tooltip
            labelFormatter={(hour) =>
              `H${String((hour + 8) % 24).padStart(2, "0")}`
            }
            contentStyle={{ background: "#000", color: "#FFF" }}
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
              strokeWidth={numberOfDaysInCurrentCamp - 1 === i ? 4 : 3}
              stroke={currentCamp?.color}
              strokeOpacity={1 - (numberOfDaysInCurrentCamp - 1 - i) / 10}
              style={{
                opacity: 1 - (numberOfDaysInCurrentCamp - 1 - i) / 10,
              }}
              dot={false}
            />
          ))}
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={["dataMin", "dataMax"]}
            strokeOpacity={0.5}
          />
          {Array.from({ length: numberOfDaysInCurrentCamp }, (_, i) =>
            numberOfDaysInCurrentCamp - 1 === i ? (
              <Bar
                yAxisId="right"
                key={i + "individual"}
                dataKey={i + "individual"}
                name={`ΔD${i + 1}`}
                fill={currentCamp?.color}
                fillOpacity={0.5}
              />
            ) : null,
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
