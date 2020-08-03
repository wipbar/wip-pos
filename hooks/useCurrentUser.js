import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
console.log(useTracker)
export default function useCurrentUser() {
  return useTracker(() => Meteor.user());
}
