import { Tracker } from "meteor/tracker";
import { useEffect, useRef, useState } from "react";
import SubsManager from "../SubsManager";

export default function useSubscription(pubName: string) {
  const [loading, setLoading] = useState(true);

  let compRef = useRef<ReturnType<typeof Tracker.autorun> | null>(null);
  let handleRef = useRef<ReturnType<typeof SubsManager.subscribe> | null>(null);

  const stopComp = () => {
    compRef.current?.stop();
    if (handleRef.current && "stop" in handleRef.current)
      handleRef.current.stop();

    compRef.current = null;
    handleRef.current = null;
  };

  useEffect(() => {
    stopComp();
    Tracker.autorun((currentComp) => {
      compRef.current = currentComp;
      if (pubName) {
        handleRef.current = SubsManager.subscribe(pubName);
        setLoading(!handleRef.current.ready());
      } else {
        setLoading(false);
      }
    });
    return stopComp;
  }, [pubName]);

  return loading;
}
