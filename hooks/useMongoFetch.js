import { Mongo } from "meteor/mongo";
import { useTracker } from "meteor/react-meteor-data";
import useSubscription from "./useSubscription";

const emptyArray = [];
export default function useMongoFetch(query, deps = emptyArray) {
  return {
    loading: useSubscription(
      query instanceof Mongo.Collection
        ? query._name
        : query instanceof Mongo.Cursor
        ? query.collection.name
        : false,
    ),
    data: useTracker(() => {
      if (!query) return [];
      if (query instanceof Mongo.Collection) return query.find().fetch();
      if (query instanceof Mongo.Cursor) return query.fetch();
    }, deps),
  };
}
