import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "../api/accounts";
import UI from "../ui";

Accounts.ui.config({ requestPermissions: { bornhack: ["read"] } });

Meteor.startup(() =>
  createRoot(document.getElementById("react-target")!).render(
    <BrowserRouter>
      <UI />
    </BrowserRouter>,
  ),
);
