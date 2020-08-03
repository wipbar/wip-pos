import { useTracker } from "meteor/react-meteor-data";

export default function useMongoFetch(query, deps = []) {
  return useTracker(() => query.fetch(), deps);
}
