import { Meteor } from "meteor/meteor";
import { useCallback, useReducer } from "react";

export default function useMethod(method, { transform } = {}) {
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
    { isLoading: false, data: null, error: null },
  );

  const call = useCallback(
    (...args) =>
      new Promise((resolve, reject) => {
        dispatch({ type: "loading" });
        const callbackHandler = (err, result) => {
          if (err) {
            dispatch({ type: "failure", payload: err });
            reject(err);
          } else {
            dispatch({ payload: transform ? transform(result) : result });
            resolve(result);
          }
        };

        typeof method === "function"
          ? method.call(args, callbackHandler)
          : Meteor.call(method, ...args, callbackHandler);
      }),
    [method, transform],
  );

  return [call, { isLoading, data, error }];
}
mongodump --uri='mongodb+srv://wip:wipBarMongo@cluster0-mnvmd.mongodb.net/test?authSource=admin'  --out=./dumps/a && mongorestore --drop -h 127.0.0.1 --port 3001 -d meteor ./dumps/a/test && rm -rf ./dumps