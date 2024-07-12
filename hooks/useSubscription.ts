import { useTracker } from "meteor/react-meteor-data";
import { DependencyList, useMemo, useRef, useState } from "react";
import SubsManager from "../SubsManager";
import { emptyArray } from "../util";

export default function useSubscription(
  pubName: string | false | undefined,
  pubArguments?: unknown,
  deps: DependencyList = emptyArray,
) {
  const [loading, setLoading] = useState(true);

  const handleRef = useRef<ReturnType<typeof SubsManager.subscribe> | null>(
    null,
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoArguments = useMemo(() => pubArguments, deps);

  useTracker(() => {
    if (pubName) {
      handleRef.current = SubsManager.subscribe(pubName, memoArguments);

      setLoading(!handleRef.current.ready());
    } else {
      setLoading(false);
    }
  }, [pubName, memoArguments]);

  return loading;
}
