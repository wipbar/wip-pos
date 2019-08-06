import { Meteor } from "meteor/meteor";
import { useCallback, useReducer } from "react";

export default function useMethod(methodName, { transform } = {}) {
  const [{ isLoading, error, data }, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "loading":
          return { ...state, isLoading: true };
        case "success":
          return {
            ...state,
            isLoading: false,
            error: null,
            data: action.payload,
          };
        case "failure":
          return {
            ...state,
            isLoading: false,
            error: action.payload,
            data: null,
          };
        default:
          return state;
      }
    },
    {
      isLoading: false,
      data: null,
      error: null,
    },
  );

  const call = useCallback(
    (...args) =>
      new Promise((resolve, reject) => {
        dispatch({ type: "loading" });
        Meteor.call(methodName, ...args, (err, result) => {
          if (err) {
            dispatch({ type: "failure", payload: err });
            reject(err);
          } else {
            dispatch({
              type: "success",
              payload: transform ? transform(result) : result,
            });
            resolve(result);
          }
        });
      }),
    [methodName, transform],
  );

  return [call, { isLoading, data, error }];
}
