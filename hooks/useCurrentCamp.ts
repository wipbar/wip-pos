import { useFind } from "meteor/react-meteor-data";
import Camps, { ICamp } from "../api/camps";
import useCurrentDate from "./useCurrentDate";
import useSession from "./useSession";

export default function useCurrentCamp(): ICamp | undefined {
  const currentDate = useCurrentDate(1000 * 60 * 60);
  const [currentCampSlug] = useSession<string | null>("currentCampSlug", null);

  const slugCamp = useFind(
    () =>
      currentCampSlug
        ? Camps.find({ slug: currentCampSlug }, { limit: 1 })
        : null,
    [currentCampSlug],
  )?.[0];

  const currentCamp = useFind(
    () =>
      Camps.find(
        {
          buildup: { $lte: currentDate },
          teardown: { $gte: currentDate },
        },
        { limit: 1 },
      ),
    [currentDate],
  )?.[0];

  const lastCamp = useFind(
    () =>
      Camps.find(
        { buildup: { $lte: currentDate } },
        { sort: { buildup: -1 }, limit: 1 },
      ),
    [currentDate],
  )?.[0];

  return slugCamp || currentCamp || lastCamp;
}
