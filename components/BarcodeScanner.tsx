import { css } from "@emotion/css";
import React, { ReactElement, useEffect, useRef, useState } from "react";

export const useKeyDownListener = (handler: (event: KeyboardEvent) => void) => {
  const savedHandler = useRef<(event: KeyboardEvent) => void>(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventListener = (event: KeyboardEvent) =>
      savedHandler.current?.(event);

    window.addEventListener("keydown", eventListener);
    return () => {
      window.removeEventListener("keydown", eventListener);
    };
  }, []);
};

export default function BarcodeScanner({
  onResult,
}: {
  onResult: (result: string) => void;
}): ReactElement {
  const [keyBuffer, setKeyBuffer] = useState<null | string>(null);

  useKeyDownListener((event: KeyboardEvent): void => {
    if (!Number.isNaN(Number(event.key))) {
      event.preventDefault();
      setKeyBuffer((prevKeyBuffer) => (prevKeyBuffer ?? "") + event.key);
    }
    if (keyBuffer && event.key === "Enter") {
      event.preventDefault();
      onResult(keyBuffer);
      setKeyBuffer(null);
    }
  });

  return (
    <div
      className={css`
        color: green;
      `}
    >
      Scanner:{" "}
      <span
        className={css`
          color: yellow;
          text-shadow:
            0 0 4px red,
            0 0 4px red;
        `}
      >
        {keyBuffer ?? "Waiting for scan"}
      </span>
    </div>
  );
}
