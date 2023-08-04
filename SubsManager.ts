import { Meteor } from "meteor/meteor";
import { Tracker } from "meteor/tracker";

interface Sub {
  args: Parameters<typeof Meteor.subscribe>;
  hash: string;
  ready?: boolean;
  updated?: number;
  identifier?: any[];
}
class SubsManager {
  cacheLimit: number;
  expireIn: number;

  _ready: boolean;
  dep: Tracker.Dependency;
  _cacheList: Sub[];
  _cacheMap: Record<string, Sub>;
  computation: Tracker.Computation;
  constructor() {
    // maxiumum number of subscriptions are cached
    this.cacheLimit ||= 10;
    // maximum time, subscription stay in the cache
    this.expireIn ||= 50;

    this._cacheMap = {};
    this._cacheList = [];
    this._ready = false;
    this.dep = new Tracker.Dependency();

    this.computation = this._registerComputation();
  }
  subscribe(...args: Parameters<typeof Meteor.subscribe>) {
    if (Meteor.isClient) {
      this._addSub(args);

      return {
        ready: () => {
          this.dep.depend();
          return this._ready;
        },
        stop: () => {},
      };
    }
    return Meteor.subscribe(...args);
  }
  _addSub(args: Parameters<typeof Meteor.subscribe>) {
    const hash = JSON.stringify(args);

    if (!this._cacheMap[hash]) {
      const sub = { args, hash };

      this._handleError(sub);

      this._cacheMap[hash] = sub;
      this._cacheList.push(sub);

      this._ready = false;

      // to notify the global ready()
      this._notifyChanged();

      // no need to interfere with the current computation
      this._reRunSubs();
    }

    // add the current sub to the top of the list
    const sub = this._cacheMap[hash]!;
    sub.updated = new Date().getTime();

    this._cacheList.splice(this._cacheList.indexOf(sub), 1);
    this._cacheList.push(sub);
  }
  _reRunSubs() {
    if (Tracker.currentComputation) {
      Tracker.afterFlush(() => {
        this.computation.invalidate();
      });
    } else {
      this.computation.invalidate();
    }
  }
  _notifyChanged() {
    if (Tracker.currentComputation) {
      setTimeout(() => this.dep.changed(), 0);
    } else {
      this.dep.changed();
    }
  }
  _applyCacheLimit() {
    const overflow = this._cacheList.length - this.cacheLimit;
    if (overflow > 0) {
      this._cacheList
        .splice(0, overflow)
        .forEach((sub) => delete this._cacheMap[sub.hash]);
    }
  }
  _applyExpirations() {
    const newCacheList: (typeof this)["_cacheList"] = [];

    const expirationTime = new Date().getTime() - this.expireIn * 60 * 1000;
    this._cacheList.forEach((sub) => {
      if (sub.updated && sub.updated >= expirationTime) {
        newCacheList.push(sub);
      } else {
        delete this._cacheMap[sub.hash];
      }
    });

    this._cacheList = newCacheList;
  }
  _registerComputation() {
    return Tracker.autorun(() => {
      this._applyExpirations();
      this._applyCacheLimit();

      let ready = true;
      this._cacheList.forEach((sub) => {
        sub.ready = Meteor.subscribe(...sub.args).ready();
        ready = ready && sub.ready;
      });

      if (ready) {
        this._ready = true;
        this._notifyChanged();
      }
    });
  }
  _createIdentifier = (args: Sub["args"]) =>
    args.map((value) => (typeof value == "string" ? '"' + value + '"' : value));

  _handleError(sub: Sub) {
    const args = sub.args;
    const lastElement = args[args.length - 1];
    sub.identifier = this._createIdentifier(args);

    if (!lastElement) {
      args.push({ onError: errorHandlingLogic });
    } else if (typeof lastElement == "function") {
      args.pop();
      args.push({ onReady: lastElement, onError: errorHandlingLogic });
    } else if (typeof lastElement.onError == "function") {
      const originalOnError = lastElement.onError;
      lastElement.onError = (err: any) => {
        errorHandlingLogic(err);
        originalOnError(err);
      };
    } else if (typeof lastElement.onReady == "function") {
      lastElement.onError = errorHandlingLogic;
    } else {
      args.push({ onError: errorHandlingLogic });
    }

    function errorHandlingLogic(err: any) {
      console.log(
        "Error invoking SubsManager.subscribe(%s): ",
        sub.identifier,
        err.reason,
      );
      // expire this sub right away.
      // Then expiration machanism will take care of the sub removal
      sub.updated = new Date(1).getTime();
    }
  }
  reset() {
    const oldComputation = this.computation;
    this.computation = this._registerComputation();

    // invalidate the new compuation and it will fire new subscriptions
    this.computation.invalidate();

    // after above invalidation completed, fire stop the old computation
    // which then send unsub messages
    // mergeBox will correct send changed data and there'll be no flicker
    Tracker.afterFlush(() => {
      oldComputation.stop();
    });
  }
  clear() {
    this._cacheList = [];
    this._cacheMap = {};
    this._reRunSubs();
  }
  ready() {
    this.dep.depend();

    // if there are no items in the cacheList we are not ready yet.
    if (this._cacheList.length === 0) return false;

    return this._ready;
  }
}

export default new SubsManager();
