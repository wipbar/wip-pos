import { addHours, endOfHour, isFuture, isPast, isWithinRange } from "date-fns";
import React, { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Camps from "../api/camps";
import Sales from "../api/sales";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useMongoFetch from "../hooks/useMongoFetch";

export default function CampByCamp() {
  const { data: camps, loading: campsLoading } = useMongoFetch(Camps, []);
  const {
    data: [currentCamp],
  } = useMongoFetch(Camps.find({}, { sort: { end: -1 } }));
  const isCurrentlyBuildup =
    currentCamp && isPast(currentCamp.buildup) && isFuture(currentCamp.start);
  const { location } = useCurrentLocation();
  const { data: sales, loading: salesLoading } = useMongoFetch(
    Sales.find({ locationId: location?._id }),
    [location],
  );
  const longestCamp = camps.reduce((memo, camp) => {
    if (!memo) {
      memo = camp;
    } else {
      if (
        camp.end - (isCurrentlyBuildup ? camp.buildup : camp.start) >
        memo.end - (isCurrentlyBuildup ? camp.buildup : memo.start)
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

  return (
    <ResponsiveContainer width={"100%"} height={350}>
      <LineChart
        data={data}
        margin={{ top: 0, right: 20, left: 40, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="hour"
          tickFormatter={(hour) => String((hour + 2) % 24).padStart(2, "0")}
        />
        <YAxis
          domain={["dataMin", "dataMax"]}
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
          wrapperStyle={{ background: "black" }}
        />
        <Legend />
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
        {camps.map((camp, i) =>
          i < camps.length - 1 ? (
            <ReferenceLine
              y={campTotals[camp.slug]}
              key={camp.slug + "-ReferenceLine"}
              label={{
                value: "Max " + camp.name,
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
      </LineChart>
    </ResponsiveContainer>
  );
}
