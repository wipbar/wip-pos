import { createBrowserHistory } from "history";
import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import React from "react";
import { render } from "react-dom";
import { Router } from "react-router";
import UI from "../ui";
import { Bornhack } from "../api/accounts";

console.log({ Bornhack });

Accounts.ui.config({ requestPermissions: { bornhack: ["read"] } });

const browserHistory = createBrowserHistory();
Meteor.startup(() =>
  render(
    <Router history={browserHistory}>
      <UI />
    </Router>,
    document.getElementById("react-target"),
  ),
);
