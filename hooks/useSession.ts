import { useTracker } from "meteor/react-meteor-data";
import { Session } from "meteor/session";
import { useCallback, useEffect } from "react";

type NoFunctionValue =
  | boolean
  | string
  | number
  | null
  | undefined
  | object
  | NoFunctionValue[];

export default function useSession<T extends NoFunctionValue = any>(
  sessionName: string,
  defaultValue?: T,
) {
  const currentValue = useTracker<T>(
    () => Session.get(sessionName),
    [sessionName],
  );
  useEffect(() => {
    if (typeof defaultValue !== "undefined" && currentValue !== defaultValue) {
      Session.setDefault(sessionName, defaultValue);
    }
  }, [currentValue, defaultValue, sessionName]);
  const setValue = useCallback(
    (value: T | ((value: T) => T)) =>
      Session.set(
        sessionName,
        typeof value === "function" ? value(currentValue) : value,
      ),
    [currentValue, sessionName],
  );
  return [currentValue, setValue] as const;
}
