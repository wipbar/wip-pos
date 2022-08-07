import { useFind } from "meteor/react-meteor-data";
import Camps, { ICamp } from "../api/camps";
import useCurrentDate from "./useCurrentDate";
import useSession from "./useSession";

export default function useCurrentCamp(): ICamp | undefined {
  const currentDate = useCurrentDate(1000 * 60 * 60);
  const [currentCampSlug] = useSession<string | null>("currentCampSlug", null);

  return useFind(
    () =>
      currentCampSlug
        ? Camps.find({ slug: currentCampSlug })
        : Camps.find({
            buildup: { $lte: currentDate },
            end: { $gte: currentDate },
          }),
    [currentCampSlug, currentDate],
  )?.[0];
}
