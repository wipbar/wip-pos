import express from "express";
import sumBy from "lodash/sumBy";
import { readableColor } from "polished";

export function stringToColours(inputString: string) {
  let sum = 0;

  // eslint-disable-next-line @typescript-eslint/no-for-in-array
  for (const i in inputString.split("")) {
    sum += inputString.charCodeAt(Number(i));
  }

  const r = ~~(
    Number(
      "0." +
        Math.sin(sum + 1)
          .toString()
          .substr(6),
    ) * 256
  );
  const g = ~~(
    Number(
      "0." +
        Math.sin(sum + 2)
          .toString()
          .substr(6),
    ) * 256
  );
  const b = ~~(
    Number(
      "0." +
        Math.sin(sum + 3)
          .toString()
          .substr(6),
    ) * 256
  );

  return [r, g, b, 255];
}
export function stringToColour(inputString: string, alpha = 1) {
  const [r, g, b] = stringToColours(inputString);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function getCorrectTextColor(hex: string, invert = false) {
  return readableColor(
    hex,
    invert ? "#ffffff" : "#000000",
    invert ? "#000000" : "#ffffff",
    false,
  );
}

declare abstract class As<Tag extends keyof never> {
  private static readonly $as$: unique symbol;
  private [As.$as$]: Record<Tag, true>;
}

export type Flavor<T, FlavorT extends string> = T & As<FlavorT>;

export const units = ["cl", "l", "pc", "ml", "g", "kg"] as const;
export type SizeUnit = (typeof units)[number];

export function removeItem<T>(items: T[], i: number) {
  return items.slice(0, i).concat(items.slice(i + 1, items.length));
}

const types = ["beer", "soda", "cocktail", "spirit", "cider"];
export const sortTags = (tags: string[] = emptyArray) =>
  [...tags]
    .sort()
    .sort((a, b) => Number(types.includes(b)) - Number(types.includes(a)));
export const tagsToString = (tags: string[] = emptyArray) =>
  sortTags(tags).join(",");

export const onProfilerRenderCallback: React.ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
) => {
  return;

  const stats = `${id}(${phase}): ${actualDuration.toFixed(
    2,
  )}ms actual, ${baseDuration.toFixed(2)}ms base\n`;

  console.log(stats);

  document.querySelector("#performance-metrics")!.textContent =
    stats + document.querySelector("#performance-metrics")!.textContent;
};

export const emptyObject = Object.freeze({});
export const emptyArray = [];

export function catchNaN(fn: () => number, defaultValue = NaN): number {
  try {
    return fn();
  } catch {
    return defaultValue;
  }
}

export const ceil5 = (x: number) => Math.ceil(x / 5) * 5;
export const floor5 = (x: number) => Math.floor(x / 5) * 5;

type AsyncRequestHandler = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => Promise<void> | void;

export const wrapRoute =
  (fn: AsyncRequestHandler): express.RequestHandler =>
  (req, res, next) =>
    fn(req, res, next)?.catch?.(next);

export const getAvg = (arr: number[]) =>
  arr.reduce((acc, c) => acc + c, 0) / arr.length;

export function createTrend<XK extends string, YK extends string>(
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
