import { useEffect, useRef, useState } from "react";

export default function useCurrentDate(interval = 1000) {
  var [date, setDate] = useState(new Date());

  useInterval(() => {
    setDate(new Date());
  }, interval);

  return date;
}

function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    let id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}
