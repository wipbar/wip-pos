import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import React, { SVGProps } from "react";

const FontAwesomeIcon = ({
  icon,
  size,
  className = "",
  ...elProps
}: {
  icon: IconDefinition;
  size?: number;
  className?: string;
} & SVGProps<SVGSVGElement>) => {
  if (!icon) return null;

  const {
    icon: [width, height, , , d],
    iconName,
    prefix,
  } = icon;

  return (
    <svg
      aria-hidden="true"
      className={[
        "svg-inline--fa",
        `fa-${iconName}`,
        `fa-w-${Math.ceil((width / height) * 16)}`,
        size ? `fa-${size}` : "",
        className,
      ].join(" ")}
      data-icon={iconName}
      data-prefix={prefix}
      role="img"
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      {...elProps}
    >
      {Array.isArray(d) ? (
        d.map((D) => <path key={D} d={D} fill="currentColor" />)
      ) : (
        <path d={d} fill="currentColor" />
      )}
    </svg>
  );
};

FontAwesomeIcon.displayName = "FontAwesomeIcon";
FontAwesomeIcon.defaultProps = {
  className: "",
  icon: null,
  size: null,
};
export default FontAwesomeIcon;
