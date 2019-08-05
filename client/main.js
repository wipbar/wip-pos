import { Meteor } from "meteor/meteor";
import React from "react";
import { render } from "react-dom";
import App from "/ui/App";
import { Accounts } from "meteor/accounts-base";

Accounts.ui.config({ passwordSignupFields: "USERNAME_ONLY" });

Meteor.startup(() => render(<App />, document.getElementById("react-target")));
