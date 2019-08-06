import { Meteor } from "meteor/meteor";
import useTracker from "./useTracker";

export default function useCurrentUser() {
  return useTracker(() => Meteor.user());
}
