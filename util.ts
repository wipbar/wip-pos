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

const types = ["beer", "soda", "cocktail", "spirit"];
export const tagsToString = (tags: string[] = emptyArray) =>
  [...tags]
    .sort()
    .sort((a, b) => Number(types.includes(b)) - Number(types.includes(a)))
    .join(",");

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

export function catchNaN(fn: () => number): number {
  try {
    return fn();
  } catch {
    return NaN;
  }
}
