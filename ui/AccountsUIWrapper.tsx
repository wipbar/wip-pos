import { Blaze } from "meteor/blaze";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import React, { LegacyRef, useEffect, useRef } from "react";

// Patch accounts-ui lol
(
  Template._loginButtonsLoggedInSingleLogoutButton as Blaze.Template & {
    __helpers: {
      set: (name: string, func: () => string) => void;
    };
  }
).__helpers.set("displayName", () => {
  const user = Meteor.user();
  if (!user) return "";

  if (user.services?.bornhack?.publicCreditName)
    return user.services.bornhack.publicCreditName;

  if (user.profile?.name) return user.profile.name;
  if (user.username) return user.username;
  if (user.emails?.[0]?.address) return user.emails[0].address;

  return "";
});

export default function AccountsUIWrapper() {
  const containerRef = useRef<HTMLDivElement>(undefined);
  const viewRef = useRef<Blaze.View>(undefined);

  useEffect(() => {
    if (containerRef.current)
      viewRef.current = Blaze.render(
        Template.loginButtons as Blaze.Template,
        containerRef.current,
      );
    return () => {
      if (viewRef.current) Blaze.remove(viewRef.current);
    };
  });

  return <div ref={containerRef as LegacyRef<HTMLDivElement> | undefined} />;
}
