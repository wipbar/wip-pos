import React from "react";
import Hello from "./Hello";
import Info from "./Info";
import AccountsUIWrapper from "./AccountsUIWrapper";
import { useCurrentUser } from "react-meteor-hooks";

export default function App() {
  const currentUser = useCurrentUser();
  console.log(currentUser);
  return (
    <div>
      <AccountsUIWrapper />
      <h1>Welcome to Meteor, {currentUser && currentUser.username}!</h1>
      <Hello />
      <Info />
    </div>
  );
}
