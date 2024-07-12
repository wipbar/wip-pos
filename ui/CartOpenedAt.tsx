import { css } from "@emotion/css";
import { differenceInSeconds } from "date-fns";
import React from "react";
import useCurrentCamp from "../hooks/useCurrentCamp";
import useCurrentDate from "../hooks/useCurrentDate";
import type { Cart } from "./PageTend";

function fancyTimeFormat(duration: number) {
  // Hours, minutes and seconds
  const hrs = ~~(duration / 3600);
  const mins = ~~((duration % 3600) / 60);
  const secs = ~~duration % 60;

  // Output like "1:01" or "4:03:59" or "123:03:59"
  let ret = "";

  if (hrs > 0) {
    ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
  }

  ret += "" + mins + ":" + (secs < 10 ? "0" : "");
  ret += "" + secs;

  return ret;
}

export default function CartViewOpenedAt({ cart }: { cart?: Cart }) {
  const currentDate = useCurrentDate();
  const currentCamp = useCurrentCamp();

  return cart?.openedAt ? (
    <center
      className={css`
        border-bottom: 1px solid ${currentCamp && currentCamp?.color};
      `}
    >
      <small>
        Opened{" "}
        {fancyTimeFormat(differenceInSeconds(currentDate, cart.openedAt))} ago
      </small>
    </center>
  ) : null;
}
