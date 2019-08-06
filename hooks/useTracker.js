import { useState, useEffect } from "react";
import { Tracker } from "meteor/tracker";

export default function useTracker(trackerFun, deps = []) {
  const [res, setRes] = useState(trackerFun());

  useEffect(() => {
    let comp = null;
    const stopComp = () => {
      comp && comp.stop();
      comp = null;
    };
    stopComp();
    Tracker.autorun(currentComp => {
      comp = currentComp;
      setRes(trackerFun());
    });
    return stopComp;
  }, deps);

  return res;
}
