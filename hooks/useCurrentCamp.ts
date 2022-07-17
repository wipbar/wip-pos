import useMongoFetch from "./useMongoFetch";
import Camps, { ICamp } from "../api/camps";
import useSession from "./useSession";
import useCurrentDate from "./useCurrentDate";

export default function useCurrentCamp(): ICamp | undefined {
  const currentDate = useCurrentDate(1000 * 60 * 60);
  const [currentCampSlug] = useSession<string | null>("currentCampSlug", null);

  const { data } = useMongoFetch(
    currentCampSlug
      ? Camps.find({ slug: currentCampSlug })
      : Camps.find({
          buildup: { $lte: currentDate },
          end: { $gte: currentDate },
        }),
    [currentCampSlug, currentDate],
  );

  return data[0];
}
