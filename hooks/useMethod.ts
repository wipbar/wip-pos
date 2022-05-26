import { Meteor } from "meteor/meteor";
import { useCallback, useReducer } from "react";

export default function useMethod<Input extends any[] = any[], Output = any>(
  method: string | Function,
) {
  const [{ isLoading, error, data }, dispatch] = useReducer(
    (
      state: {
        isLoading: boolean;
        error?: Error | null;
        data?: Output | null;
      },
      action:
        | { type: "loading" }
        | { type: "success"; payload: Output }
        | { type: "failure"; payload: Error },
    ) => {
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
    { isLoading: false, data: null, error: null },
  );

  const call = useCallback(
    (...args: Input) =>
      new Promise((resolve, reject) => {
        dispatch({ type: "loading" });
        const callbackHandler = (err: Error, result: Output) => {
          if (err) {
            dispatch({ type: "failure", payload: err });
            reject(err);
          } else {
            dispatch({ type: "success", payload: result });
            resolve(result);
          }
        };

        typeof method === "function"
          ? method.call(args, callbackHandler)
          : Meteor.call(method, ...args, callbackHandler);
      }),
    [method],
  );

  return [call, { isLoading, data, error }];
}
