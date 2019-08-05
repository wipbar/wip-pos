import React from "react";
import { useCurrentUser } from "react-meteor-hooks";
import AccountsUIWrapper from "./AccountsUIWrapper";
import Hello from "./Hello";
import Info from "./Info";
import ProductPicker from "./ProductPicker";
import SlideConfirm from "./SlideConfirm";

export default function App() {
  const currentUser = useCurrentUser();
  console.log(currentUser);
  return (
    <div>
      <AccountsUIWrapper />
      <h1>Welcome to Meteor, {currentUser && currentUser.username}!</h1>
      <SlideConfirm onConfirm={() => console.log("confirmed!")} />
      <Hello />
      <Info />
      <ProductPicker />
    </div>
  );
}
