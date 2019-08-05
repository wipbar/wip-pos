import React from "react";
import Links from "../api/links";
import { useTracker } from "react-meteor-hooks";

export default function Info() {
  const links = useTracker(() => Links.find().fetch());
  return (
    <div>
      <h2>Learn Meteor!</h2>
      <ul>
        {links.map(link => (
          <li key={link._id}>
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
