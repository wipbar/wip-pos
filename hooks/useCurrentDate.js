import { useEffect, useState } from "react";

export default function useCurrentDate(interval = 1000) {
  var [date, setDate] = useState(new Date());

  useEffect(() => {
    var timer = setInterval(() => setDate(new Date()), interval);
    return function cleanup() {
      clearInterval(timer);
    };
  });

  return date;
}
