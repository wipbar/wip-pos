import { Mongo } from "meteor/mongo";
import { useTracker } from "meteor/react-meteor-data";
import { DependencyList } from "react";
import useSubscription from "./useSubscription";

const emptyArray: [] = [];
export default function useMongoFetch<T>(
  query: Mongo.Collection<T> | Mongo.Cursor<T> | undefined,
  deps: DependencyList = emptyArray,
) {
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
      if (query instanceof Mongo.Collection) return query.find().fetch();
      if (query instanceof Mongo.Cursor) return query.fetch();
      throw new Error("useMongoFetch only accepts Collection and Cursor");
    }, deps),
  };
}
