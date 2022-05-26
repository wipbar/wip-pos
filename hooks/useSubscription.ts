import { Tracker } from "meteor/tracker";
import { useEffect, useState } from "react";
import SubsManager from "../SubsManager";

export default function useSubscription(pubName: string, ...subOpts: any[]) {
  const [loading, setLoading] = useState(true);
  let comp: ReturnType<typeof Tracker.autorun> | null = null;
  let handle: ReturnType<typeof SubsManager.subscribe> | null = null;

  const stopComp = () => {
    comp?.stop();
    if (handle && "stop" in handle) handle.stop();

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
