import useMongoFetch from "./useMongoFetch";
import Camps from "../api/camps";

export default function useCurrentCamp() {
  const { data } = useMongoFetch(Camps.find({}, { sort: { end: -1 } }));

  return data[0];
}
