import { Mongo } from "meteor/mongo";
import { useFind } from "meteor/react-meteor-data";
import { DependencyList, useMemo } from "react";
import useSubscription from "./useSubscription";

const emptyArray: [] = [];
export default function useMongoFetch<T>(
  queryFn: () => Mongo.Cursor<T> | null | undefined,
  deps: DependencyList,
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const query = useMemo(queryFn, deps);

  return {
    loading: useSubscription(
      query instanceof Mongo.Cursor
        ? //@ts-expect-error
          query.collection.name
        : false,
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    data: useFind(queryFn, deps) || emptyArray,
  };
}
