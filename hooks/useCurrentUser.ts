import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";

export default function useCurrentUser() {
  return useTracker(() => Meteor.user());
}
