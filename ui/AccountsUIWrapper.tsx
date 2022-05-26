import { Blaze } from "meteor/blaze";
import { Template } from "meteor/templating";
import React, { LegacyRef, useEffect, useRef } from "react";

export default function AccountsUIWrapper() {
  const containerRef = useRef<HTMLDivElement>();
  const viewRef = useRef<Blaze.View>();

  useEffect(() => {
    if (containerRef.current)
      viewRef.current = Blaze.render(
        Template.loginButtons,
        containerRef.current,
      );
    return () => {
      if (viewRef.current) Blaze.remove(viewRef.current);
    };
  });

  return <div ref={containerRef as LegacyRef<HTMLDivElement> | undefined} />;
}
