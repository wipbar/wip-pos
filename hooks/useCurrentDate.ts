import { useEffect, useRef, useState } from "react";

export default function useCurrentDate(interval = 1000) {
  const [date, setDate] = useState(new Date());

  useInterval(() => {
    setDate(new Date());
  }, interval);

  return date;
}

export function useInterval(callback: () => any, delay: number) {
  const savedCallback = useRef<() => any>();

  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}
