import { createBrowserHistory } from "history";
import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import React from "react";
import { render } from "react-dom";
import { Route, Router, Switch } from "react-router";
import App from "/ui/App";

Accounts.ui.config({ passwordSignupFields: "USERNAME_ONLY" });

const browserHistory = createBrowserHistory();
Meteor.startup(() =>
  render(
    <Router history={browserHistory}>
      <Switch>
        <Route exact path="/" component={App} />
        <Route exact path="/sales" component={() => "sales"} />
      </Switch>
    </Router>,
    document.getElementById("react-target"),
  ),
);
