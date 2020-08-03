import { Session } from "meteor/session";
import { useCallback, useEffect } from "react";
import { useTracker } from "meteor/react-meteor-data";

export default function useSession(sessionName, defaultValue) {
  const currentValue = useTracker(() => Session.get(sessionName), [
    sessionName,
  ]);
  useEffect(() => {
    if (typeof defaultValue !== "undefined" && currentValue !== defaultValue) {
      Session.setDefault(sessionName, defaultValue);
    }
  }, [currentValue, defaultValue, sessionName]);
  const setValue = useCallback(
    (value) =>
      Session.set(
        sessionName,
        typeof value === "function" ? value(currentValue) : value,
      ),
    [currentValue, sessionName],
  );
  return [currentValue, setValue];
}
