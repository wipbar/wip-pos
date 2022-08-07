import { addHours, endOfHour, isWithinRange } from "date-fns";
import { sumBy } from "lodash";
import { useFind } from "meteor/react-meteor-data";
import React, { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Camps, { ICamp } from "../api/camps";
import Sales from "../api/sales";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useMongoFetch from "../hooks/useMongoFetch";
import { getCorrectTextColor } from "../util";

const getAvg = (arr: number[]) =>
  arr.reduce((acc, c) => acc + c, 0) / arr.length;

function createTrend<XK extends string, YK extends string>(
  data: Record<XK | YK, number>[],
  xKey: XK,
  yKey: YK,
) {
  const xData = data.map((value) => value[xKey]);
  const yData = data.map((value) => value[yKey]);

  // average of X values and Y values
  const xMean = getAvg(xData);
  const yMean = getAvg(yData);

  // Subtract X or Y mean from corresponding axis value
  const xMinusxMean = xData.map((val) => val - xMean);
  const yMinusyMean = yData.map((val) => val - yMean);

  const xMinusxMeanSq = xMinusxMean.map((val) => Math.pow(val, 2));

  const xy = [];
  for (let x = 0; x < data.length; x++) {
    xy.push(xMinusxMean[x]! * yMinusyMean[x]!);
  }

  // const xy = xMinusxMean.map((val, index) => val * yMinusyMean[index]);

  const xySum = sumBy(xy);

  // b1 is the slope
  const b1 = xySum / sumBy(xMinusxMeanSq);
  // b0 is the start of the slope on the Y axis
  const b0 = yMean - b1 * xMean;

  return { slope: b1, yStart: b0, calcY: (x: number) => b0 + b1 * x };
}

const XYAxisDomain = ["dataMin", "dataMax"];

export default function CampByCamp() {
  const camps = useFind(() => Camps.find({}, { sort: { start: 1 } }), []);
  const currentCamp = useCurrentCamp();

  const { data: sales } = useMongoFetch(() => Sales.find(), []);
  const longestCamp = camps.reduce<ICamp | null>((memo, camp) => {
    if (!memo) {
      memo = camp;
    } else {
      if (
        Number(camp.end) - Number(camp.start) >
        Number(memo.end) - Number(memo.start)
      )
        memo = camp;
    }
    return memo;
  }, null);

  const longestCampHours = longestCamp
    ? Math.ceil(
        (Number(longestCamp.end) - Number(longestCamp.start)) / (3600 * 1000),
      )
    : 0;

  const [data, campTotals] = useMemo(() => {
    const data = [];
    const campTotals: Record<string, number> = {};
    for (let i = 0; i < longestCampHours; i++) {
      const datapoint: { hour: number; [key: string]: number } = { hour: i };
      camps.forEach((camp) => {
        const count = sumBy(
          sales.filter((sale) =>
            isWithinRange(
              sale.timestamp,
              addHours(camp.start, i),
              endOfHour(addHours(camp.start, i)),
            ),
          ),
          ({ amount }) => amount,
        );
        if (count) {
          const campTotal = (campTotals[camp.slug] || 0) + count;
          campTotals[camp.slug] = campTotal;
          datapoint[camp.slug] = campTotal;
          datapoint[camp.slug + "individual"] = count;
        }
      });
      data.push(datapoint);
    }
    return [data, campTotals];
  }, [camps, longestCampHours, sales]);

  let prev = 0;
  const weights = data.map(
    (data) => (prev = (currentCamp && data[currentCamp.slug]) || prev),
  );
  const yMax = Math.max(...weights);
  const timestamps = data.map((data) => data.hour);
  const xMax = Math.max(...timestamps);
  const nowHour = Math.max(
    ...data
      .filter((d) => currentCamp && d[currentCamp.slug])
      .map((data) => data.hour),
  );

  const trendData = useMemo(() => {
    const trend =
      currentCamp &&
      createTrend(
        data.filter((d) => d[currentCamp.slug]),
        "hour",
        currentCamp.slug,
      );

    return [
      {
        [currentCamp?.slug + "-trend"]:
          trend &&
          data.find((d) => d[currentCamp.slug] && d.hour === nowHour)?.[
            currentCamp.slug
          ],
        hour: nowHour,
      },
      {
        [currentCamp?.slug + "-trend"]:
          trend && trend.calcY(Math.min(xMax, nowHour + 24)),
        hour: Math.min(xMax, nowHour + 24),
      },
    ] as const;
  }, [currentCamp, data, nowHour, xMax]);

  return (
    <div>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart
          data={data.map((d) =>
            d.hour === trendData[0].hour
              ? { ...d, ...trendData[0] }
              : d.hour === trendData[1].hour
              ? { ...d, ...trendData[1] }
              : d,
          )}
          margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="hour"
            tickFormatter={(hour) => "D" + String(Math.ceil((hour + 12) / 24))}
            interval={23}
          />
          <YAxis
            domain={XYAxisDomain}
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
              `H${String((hour + 12) % 24).padStart(2, "0")}D${String(
                Math.ceil(hour / 24),
              ).padStart(2, "0")}`
            }
            contentStyle={{ background: "#000" }}
          />
          <Legend />
          <ReferenceDot
            y={yMax}
            x={nowHour}
            key="Now"
            label={{
              value: currentCamp?.start?.getFullYear(),
              position: "insideBottomRight",
              offset: 8,
              style: { fill: currentCamp?.color },
            }}
            fill={currentCamp?.color}
            r={4}
            stroke={currentCamp?.color}
          />
          {camps.map((camp) =>
            camp.slug !== currentCamp?.slug ? (
              <ReferenceLine
                y={campTotals[camp.slug]}
                key={camp.slug + "-ReferenceLine"}
                label={{
                  value: camp.start?.getFullYear(),
                  position: "right",
                  offset: 5,
                  style: {
                    fill: camp.color,
                    stroke: getCorrectTextColor(camp.color),
                    strokeWidth: 0.2,
                  },
                  textAnchor: "end",
                }}
                stroke={camp.color}
                strokeDasharray="3 3"
              />
            ) : null,
          )}
          {camps.map((camp) => (
            <Line
              type="monotone"
              key={camp.slug}
              dataKey={camp.slug}
              name={"Σ" + camp.start.getFullYear()}
              stroke={camp.color}
              fill={getCorrectTextColor(camp.color)}
              strokeDasharray={
                camp.slug === currentCamp?.slug ? undefined : "3 3"
              }
              strokeWidth={camp.slug === currentCamp?.slug ? 4 : 1}
              dot={false}
              connectNulls
            />
          ))}
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={XYAxisDomain}
            strokeOpacity={0.5}
          />

          {currentCamp ? (
            <>
              <Bar
                yAxisId="right"
                key={currentCamp.slug + "individual"}
                dataKey={currentCamp.slug + "individual"}
                name={"Δ" + currentCamp.start.getFullYear()}
                fill={currentCamp?.color}
                fillOpacity={0.5}
              />
              <Line
                key={currentCamp.slug + "-trend"}
                dataKey={currentCamp.slug + "-trend"}
                stroke={currentCamp.color}
                fill={getCorrectTextColor(currentCamp?.color)}
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                connectNulls
              />
            </>
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
