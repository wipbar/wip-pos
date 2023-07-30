export function stringToColour(inputString: string, alpha = 1) {
  let sum = 0;

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

  return `rgba(${r},${g},${b},${alpha})`;
}

const cutHex = (h: string) => (h?.charAt(0) == "#" ? h?.substring(1, 7) : h);
const hexToR = (h: string) => parseInt(cutHex(h)?.substring(0, 2), 16);
const hexToG = (h: string) => parseInt(cutHex(h)?.substring(2, 4), 16);
const hexToB = (h: string) => parseInt(cutHex(h)?.substring(4, 6), 16);

export function getCorrectTextColor(hex: string, invert = false) {
  const threshold = 170; /* about half of 256. Lower threshold equals more dark text on dark background  */
  let hRed, hGreen, hBlue;
  if (hex?.startsWith("rgba(") || hex?.startsWith("rgb(")) {
    const [, vals] =
      hex.match(/^rgba\((.+)\)$/) || hex.match(/^rgb\((.+)\)$/) || [];
    if (vals) [hRed, hGreen, hBlue] = vals.split(",");
  } else {
    hRed = hexToR(hex);
    hGreen = hexToG(hex);
    hBlue = hexToB(hex);
  }

  const passesThreshold =
    (Number(hRed) * 299 + Number(hGreen) * 587 + Number(hBlue) * 114) / 500 >
    threshold;

  return (invert ? !passesThreshold : passesThreshold) ? "#000000" : "#ffffff";
}

declare abstract class As<Tag extends keyof never> {
  private static readonly $as$: unique symbol;
  private [As.$as$]: Record<Tag, true>;
}

export type Flavor<T, FlavorT extends string> = T & As<FlavorT>;
