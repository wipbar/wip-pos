import { useTracker } from "meteor/react-meteor-data";
import { Mongo } from "meteor/mongo";
import useSubscription from "./useSubscription";

export default function useMongoFetch(query, deps = []) {
  useSubscription(
    query instanceof Mongo.Collection
      ? query._name
      : query instanceof Mongo.Cursor
      ? query.collection.name
      : false,
  );
  return useTracker(() => {
    if (!query) return [];
    if (query instanceof Mongo.Collection) return query.find().fetch();
    if (query instanceof Mongo.Cursor) return query.fetch();
  }, deps);
}
