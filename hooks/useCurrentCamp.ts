import useMongoFetch from "./useMongoFetch";
import Camps, { ICamp } from "../api/camps";
import useSession from "./useSession";
import useCurrentDate from "./useCurrentDate";

export default function useCurrentCamp(): ICamp | undefined {
  const currentDate = useCurrentDate();
  const [currentCampSlug] = useSession<string | null>("currentCampSlug", null);

  const { data } = useMongoFetch(
    currentCampSlug
      ? Camps.find({ slug: currentCampSlug })
      : Camps.find(
          { buildup: { $lte: currentDate }, end: { $gte: currentDate } },
          { sort: { end: -1 } },
        ),
    [currentCampSlug],
  );

  return data[0];
}
