import { Tracker } from "meteor/tracker";
import { useEffect, useRef, useState } from "react";
import SubsManager from "../SubsManager";

export default function useSubscription(pubName: string, ...args: unknown[]) {
  const [loading, setLoading] = useState(true);

  const compRef = useRef<ReturnType<typeof Tracker.autorun> | null>(null);
  const handleRef = useRef<ReturnType<typeof SubsManager.subscribe> | null>(
    null,
  );

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
        handleRef.current = SubsManager.subscribe(pubName, ...args);

        setLoading(!handleRef.current.ready());
      } else {
        setLoading(false);
      }
    });
    return stopComp;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubName, ...args]);

  return loading;
}
