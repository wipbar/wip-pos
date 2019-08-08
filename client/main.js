import { createBrowserHistory } from "history";
import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import React from "react";
import { render } from "react-dom";
import { Router } from "react-router";
import UI from "../ui";

Accounts.ui.config({ passwordSignupFields: "USERNAME_ONLY" });

const browserHistory = createBrowserHistory();
Meteor.startup(() =>
  render(
    <Router history={browserHistory}>
      <UI />
    </Router>,
    document.getElementById("react-target"),
  ),
);
