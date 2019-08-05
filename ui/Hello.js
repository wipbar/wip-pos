import { css } from "emotion";
import React, { useCallback, useState } from "react";

export default function Hello() {
  const [counter, setCounter] = useState(0);
  const incrementCounter = useCallback(
    () => setCounter(counter => counter + 1),
    [useCallback],
  );
  return (
    <div
      className={css`
        background: teal;
      `}
    >
      <button onClick={incrementCounter}>Click Me</button>
      <p>You&#39;ve pressed the button {counter} times.</p>
    </div>
  );
}
