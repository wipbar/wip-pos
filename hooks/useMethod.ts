import { Meteor } from "meteor/meteor";
import { useCallback, useReducer } from "react";
import { locationMethods } from "../api/locations";
import { productsMethods } from "../api/products";
import { salesMethods } from "../api/sales";
import { stocksMethods } from "../api/stocks";

type MethodMap = typeof stocksMethods &
  typeof productsMethods &
  typeof salesMethods &
  typeof locationMethods;

export default function useMethod<
  M extends keyof MethodMap,
  Input = Parameters<MethodMap[M]>[0],
  Output = Awaited<ReturnType<MethodMap[M]>>,
>(method: M) {
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
    (params: Input) =>
      new Promise<Output>((resolve, reject) => {
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

        Meteor.call(method, params, callbackHandler);
      }),
    [method],
  );

  return [call, { isLoading, data, error }] as const;
}
