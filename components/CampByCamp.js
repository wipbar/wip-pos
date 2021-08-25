import { addHours, endOfHour, isFuture, isPast, isWithinRange } from "date-fns";
import React, { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Camps from "../api/camps";
import Sales from "../api/sales";
import useMongoFetch from "../hooks/useMongoFetch";

function getAvg(arr) {
  const total = arr.reduce((acc, c) => acc + c, 0);
  return total / arr.length;
}

function getSum(arr) {
  return arr.reduce((acc, c) => acc + c, 0);
}

function createTrend(data, xKey, yKey) {
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
    xy.push(xMinusxMean[x] * yMinusyMean[x]);
  }

  // const xy = xMinusxMean.map((val, index) => val * yMinusyMean[index]);

  const xySum = getSum(xy);

  // b1 is the slope
  const b1 = xySum / getSum(xMinusxMeanSq);
  // b0 is the start of the slope on the Y axis
  const b0 = yMean - b1 * xMean;

  return {
    slope: b1,
    yStart: b0,
    calcY: (x) => b0 + b1 * x,
  };
}

export default function CampByCamp() {
  const { data: camps, loading: campsLoading } = useMongoFetch(Camps, []);
  const {
    data: [currentCamp],
  } = useMongoFetch(Camps.find({}, { sort: { end: -1 } }));
  const isCurrentlyBuildup = Boolean(
    currentCamp &&
      isPast(currentCamp.buildup) &&
      isFuture(currentCamp.start) &&
      false,
  );
  console.log(isCurrentlyBuildup);
  const { data: sales, loading: salesLoading } = useMongoFetch(Sales, []);
  const longestCamp = camps.reduce((memo, camp) => {
    if (!memo) {
      memo = camp;
    } else {
      if (
        camp.end - (isCurrentlyBuildup ? camp.buildup : camp.start) >
        memo.end - (isCurrentlyBuildup ? memo.buildup : memo.start)
      )
        memo = camp;
    }
    return memo;
  }, null);
  const longestCampHours = longestCamp
    ? Math.ceil(
        (longestCamp.end -
          (isCurrentlyBuildup ? longestCamp.buildup : longestCamp.start)) /
          (3600 * 1000),
      )
    : null;
  const longestCampBuildupHours = isCurrentlyBuildup
    ? (longestCamp.start - longestCamp.buildup) / 1000 / 60 / 60
    : 0;
  console.log(longestCampBuildupHours);
  const [data, campTotals] = useMemo(() => {
    const data = [];
    let campTotals = {};
    for (let i = 0; i < longestCampHours; i++) {
      const datapoint = { hour: i - longestCampBuildupHours };
      camps.forEach((camp) => {
        const start = isCurrentlyBuildup ? camp.buildup : camp.start;
        const count = sales
          .filter((sale) =>
            isWithinRange(
              sale.timestamp,
              addHours(start, i),
              endOfHour(addHours(start, i)),
            ),
          )
          .reduce((memo, sale) => memo + Number(sale.amount), 0);
        if (count) {
          campTotals[camp.slug] = (campTotals[camp.slug] || 0) + count;
          datapoint[camp.slug] = campTotals[camp.slug];
        }
      });
      data.push(datapoint);
    }
    return [data, campTotals];
  }, [
    camps,
    isCurrentlyBuildup,
    longestCampBuildupHours,
    longestCampHours,
    sales,
  ]);
  if (campsLoading || salesLoading) return "Loading...";
  let prev = 0;
  const weights = data.map((data) => (prev = data["bornhack-2021"] || prev));
  const yMax = Math.max(...weights);
  const yMin = Math.min(...weights);
  const timestamps = data.map((data) => data.hour);
  const xMax = Math.max(...timestamps);
  const nowHour = Math.max(
    ...data.filter((d) => d["bornhack-2021"]).map((data) => data.hour),
  );
  const xMin = Math.min(...timestamps);

  const trendData = (() => {
    const trend = createTrend(
      data.filter((d) => d["bornhack-2021"]),
      "hour",
      "bornhack-2021",
    );

    return [
      {
        "bornhack-2021-trend": data.find(
          (d) => d["bornhack-2021"] && d.hour === nowHour,
        )?.["bornhack-2021"],
        hour: nowHour,
      },
      {
        "bornhack-2021-trend": trend.calcY(Math.min(xMax, nowHour + 24)),
        hour: Math.min(xMax, nowHour + 24),
      },
    ];
  })();

  return (
    <ResponsiveContainer width="50%" height={350}>
      <LineChart
        data={data.map((d) =>
          d.hour === trendData[0].hour
            ? { ...d, ...trendData[0] }
            : d.hour === trendData[1].hour
            ? { ...d, ...trendData[1] }
            : d,
        )}
        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="hour"
          tickFormatter={(hour) => String((hour + 2) % 24).padStart(2, "0")}
        />
        <YAxis
          domain={["dataMin", "dataMax"]}
          tickFormatter={(amount) => ~~amount}
          label={{
            value: "Revenue (HAX)",
            angle: -90,
            offset: 70,
            position: "insideLeft",
            style: { fill: "yellow" },
          }}
        />
        <Tooltip
          labelFormatter={(hour) =>
            `H${String((hour + 2) % 24).padStart(2, "0")}D${String(
              Math.ceil(hour / 24),
            ).padStart(2, "0")}`
          }
          fill="#000"
          contentStyle={{ background: "#000" }}
        />
        <Legend />
        {isCurrentlyBuildup && (
          <ReferenceLine
            x={0 - 2 + 12}
            strokeWidth={2}
            stroke={currentCamp?.color || "#00FFFF"}
            label={{
              value: "Start " + currentCamp?.name,
              position: "insideLeft",
              style: { fill: currentCamp?.color },
            }}
          />
        )}
        <ReferenceDot
          y={yMax}
          x={nowHour}
          key="Now"
          label={{
            value: currentCamp?.start?.getFullYear(),
            position: "right",
            style: { fill: currentCamp?.color },
          }}
          fill={currentCamp?.color}
          r={4}
          stroke={currentCamp?.color}
        />
        {camps.map((camp, i) =>
          i < camps.length - 1 ? (
            <ReferenceLine
              y={campTotals[camp.slug]}
              key={camp.slug + "-ReferenceLine"}
              label={{
                value: "Max " + camp.start?.getFullYear(),
                position: "insideTop",
                style: { fill: camp.color },
              }}
              stroke={camp.color}
              strokeDasharray="3 3"
            />
          ) : null,
        )}
        {camps.map((camp, i) => (
          <Line
            type="monotone"
            key={camp.slug}
            dataKey={camp.slug}
            name={camp.name}
            stroke={camp.color}
            strokeDasharray={camps.length - 1 === i ? undefined : "3 3"}
            strokeWidth={4}
            dot={false}
            connectNulls
          />
        ))}
        <Line
          key={currentCamp.slug + "-trend"}
          dataKey={currentCamp.slug + "-trend"}
          stroke={currentCamp.color}
          strokeWidth={2}
          strokeDasharray="4 2"
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
