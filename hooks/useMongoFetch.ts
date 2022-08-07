import { Mongo } from "meteor/mongo";
import { useTracker } from "meteor/react-meteor-data";
import { DependencyList, useMemo } from "react";
import useSubscription from "./useSubscription";

const emptyArray: [] = [];
export default function useMongoFetch<T extends object>(
  queryFn: () => Mongo.Cursor<T> | undefined,
  deps: DependencyList,
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const query = useMemo(queryFn, deps);

  return {
    loading: useSubscription(
      query instanceof Mongo.Collection
        ? //@ts-expect-error
          query._name
        : query instanceof Mongo.Cursor
        ? //@ts-expect-error
          query.collection.name
        : false,
    ),
    data: useTracker(() => {
      if (!query) return emptyArray;
      if (query instanceof Mongo.Cursor) return query.fetch();
      throw new Error("useMongoFetch only accepts Collection and Cursor");
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps),
  };
}
