import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import React from "react";
import { render } from "react-dom";
import { BrowserRouter } from "react-router-dom";
import "../api/accounts";
import UI from "../ui";

Accounts.ui.config({ requestPermissions: { bornhack: ["read"] } });

Meteor.startup(() =>
  render(
    <BrowserRouter>
      <UI />
    </BrowserRouter>,
    document.getElementById("react-target"),
  ),
);
