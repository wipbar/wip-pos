export function stringToColour(inputString, alpha = 1) {
  var sum = 0;

  for (var i in inputString) sum += inputString.charCodeAt(i);

  let r = ~~(
    ("0." +
      Math.sin(sum + 1)
        .toString()
        .substr(6)) *
    256
  );
  let g = ~~(
    ("0." +
      Math.sin(sum + 2)
        .toString()
        .substr(6)) *
    256
  );
  let b = ~~(
    ("0." +
      Math.sin(sum + 3)
        .toString()
        .substr(6)) *
    256
  );

  return `rgba(${r},${g},${b},${alpha})`;
}

export function getCorrectTextColor(hex) {
  const threshold = 170; /* about half of 256. Lower threshold equals more dark text on dark background  */
  let hRed, hGreen, hBlue;
  if (hex.startsWith("rgba(")) {
    const [, vals] = hex.match(/^rgba\((.+)\)$/);
    if (vals) {
      [hRed, hGreen, hBlue] = vals.split(",");
    }
  } else {
    hRed = hexToR(hex);
    hGreen = hexToG(hex);
    hBlue = hexToB(hex);
  }

  const cutHex = (h) => (h.charAt(0) == "#" ? h.substring(1, 7) : h);
  const hexToR = (h) => parseInt(cutHex(h).substring(0, 2), 16);
  const hexToG = (h) => parseInt(cutHex(h).substring(2, 4), 16);
  const hexToB = (h) => parseInt(cutHex(h).substring(4, 6), 16);

  return (hRed * 299 + hGreen * 587 + hBlue * 114) / 1000 > threshold
    ? "#000000"
    : "#ffffff";
}
