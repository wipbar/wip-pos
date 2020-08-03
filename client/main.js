import { createBrowserHistory } from "history";
import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import React from "react";
import { render } from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import "../api/accounts";
import UI from "../ui";

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
