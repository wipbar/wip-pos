import { css } from "@emotion/css";
import React from "react";
import QRCode from "react-qr-code";

export default function PageQR() {
  return (
    <div
      className={css`
        min-height: 100%;
        min-width: 100%;
        width: 100vw;
        height: 100vh;
        display: grid;
        align-items: center;
        justify-content: center;
        place-items: center;
        scrollbar-width: none;
      `}
    >
      <div
        className={css`
          aspect-ratio: 1/1;
          max-width: 100vw;
          max-height: 100vw;
          width: auto;
          height: 100%;
          font-size: 9vmin;
          display: flex;
          align-items: center;
          flex-direction: column;
          padding-top: 4vmin;
        `}
      >
        <QRCode
          value="https://wip.bar/"
          style={{
            maxWidth: "80%",
            width: "80%",
            height: "auto",
          }}
        />
        <pre
          className={css`
            margin: 4vmin;
          `}
        >
          HTTPS://WIP.BAR
        </pre>
      </div>
    </div>
  );
}
