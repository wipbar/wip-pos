import useTracker from "./useTracker";

export default function useMongoFetch(query, deps = []) {
  return useTracker(() => query.fetch(), deps);
}
