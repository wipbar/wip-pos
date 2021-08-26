import { Tracker } from "meteor/tracker";
import { useEffect, useState } from "react";
import SubsManager from "../SubsManager";

console.log(SubsManager);
export default function useSubscription(pubName, ...subOpts) {
  const [loading, setLoading] = useState(true);
  let comp = null;
  let handle = null;

  const stopComp = () => {
    comp?.stop?.();
    handle?.stop?.();
    comp = null;
    handle = null;
  };

  useEffect(() => {
    stopComp();
    Tracker.autorun((currentComp) => {
      comp = currentComp;
      if (pubName) {
        handle = SubsManager.subscribe(pubName, ...subOpts);
        setLoading(!handle.ready());
      }
    });
    return stopComp;
  }, [pubName, ...subOpts]);

  return loading;
}
