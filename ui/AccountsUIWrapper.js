import { Blaze } from "meteor/blaze";
import { Template } from "meteor/templating";
import React, { useEffect, useRef } from "react";

export default function AccountsUIWrapper() {
  const containerRef = useRef();
  const viewRef = useRef();
  useEffect(() => {
    viewRef.current = Blaze.render(Template.loginButtons, containerRef.current);
    return () => Blaze.remove(viewRef.current);
  });
  return <span ref={containerRef} />;
}
