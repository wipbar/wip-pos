import { sumBy } from "lodash";
import { useFind } from "meteor/react-meteor-data";
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
import Camps from "../api/camps";
import useCurrentCamp from "../hooks/useCurrentCamp";
import { useInterval } from "../hooks/useCurrentDate";
import useMethod from "../hooks/useMethod";
import { emptyArray, getCorrectTextColor } from "../util";

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
const emptyData = { data: emptyArray };
export default function CampByCamp() {
  const camps = useFind(() => Camps.find({}, { sort: { start: 1 } }));
  const currentCamp = useCurrentCamp();

  const [getCampByCampData, { data: methodData }] = useMethod(
    "Sales.stats.CampByCamp",
  );

  const { data } = methodData || emptyData;

  const updateCampByCampData = useCallback(async () => {
    if (currentCamp) {
      await getCampByCampData(undefined);
    }
  }, [currentCamp, getCampByCampData]);

  useEffect(() => {
    updateCampByCampData();
  }, [updateCampByCampData]);
  useInterval(() => updateCampByCampData(), 10000);

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

    const endHour = Math.min(xMax, nowHour + 24);

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
          trend && Math.round(trend.calcY(endHour)),
        hour: endHour,
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
          margin={{ top: 24, right: 8, left: 16, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="hour"
            tickFormatter={(hour) => "D" + String(Math.ceil((hour + 6) / 24))}
            interval={23}
          />
          <YAxis
            domain={XYAxisDomain}
            tickFormatter={(amount: number) => String(~~amount)}
            label={{
              value: "Revenue (ʜᴀx)",
              angle: -90,
              offset: 70,
              position: "insideLeft",
              style: { fill: currentCamp?.color },
            }}
          />
          <Tooltip
            labelFormatter={(hour) =>
              `H${String((hour + 6) % 24).padStart(2, "0")}D${String(
                Math.ceil(hour / 24),
              ).padStart(2, "0")}`
            }
            contentStyle={{
              background: currentCamp?.color,
              color:
                currentCamp?.color && getCorrectTextColor(currentCamp?.color),
            }}
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
              style: {
                fill: "#ffffff",
              },
            }}
            fill={"#ffffff"}
            r={4}   
            stroke={"#ffffff"}
          />
          {camps.map((camp) => (
            <Line
              type="monotone"
              key={camp.slug}
              dataKey={camp.slug}
              name={"Σ" + camp.start.getFullYear()}
              stroke={camp.slug === currentCamp?.slug ? "#ffffff" : camp.color}
              fill={getCorrectTextColor(camp.color)}
              strokeDasharray={
                camp.slug === currentCamp?.slug ? undefined : "3 3"
              }
              strokeWidth={camp.slug === currentCamp?.slug ? 3 : 2}
              dot={false}
              connectNulls
            />
          ))}
          {currentCamp ? (
            <Line
              key={currentCamp.slug + "-trend"}
              dataKey={currentCamp.slug + "-trend"}
              fill={currentCamp.color}
              stroke={"#ffffff"}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              connectNulls
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
