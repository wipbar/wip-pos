import { Meteor } from "meteor/meteor";
import { Deps } from "meteor/deps";

class SubsManager {
  constructor(options = {}) {
    this.options = options;
    // maxiumum number of subscriptions are cached
    this.options.cacheLimit ||= 10;
    // maximum time, subscription stay in the cache
    this.options.expireIn ||= 50;

    this._cacheMap = {};
    this._cacheList = [];
    this._ready = false;
    this.dep = new Deps.Dependency();

    this.computation = this._registerComputation();
  }
  subscribe(...args) {
    if (Meteor.isClient) {
      this._addSub(args);

      return {
        ready: () => {
          this.dep.depend();
          return this._ready;
        },
      };
    }
    return Meteor.subscribe?.apply(Meteor, arguments);
  }
  _addSub(args) {
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
    const sub = this._cacheMap[hash];
    sub.updated = new Date().getTime();

    this._cacheList.splice(this._cacheList.indexOf(sub), 1);
    this._cacheList.push(sub);
  }
  _reRunSubs() {
    if (Deps.currentComputation) {
      Deps.afterFlush(() => {
        this.computation.invalidate();
      });
    } else {
      this.computation.invalidate();
    }
  }
  _notifyChanged() {
    if (Deps.currentComputation) {
      setTimeout(() => this.dep.changed(), 0);
    } else {
      this.dep.changed();
    }
  }
  _applyCacheLimit() {
    var overflow = this._cacheList.length - this.options.cacheLimit;
    if (overflow > 0) {
      this._cacheList
        .splice(0, overflow)
        .forEach((sub) => delete this._cacheMap[sub.hash]);
    }
  }
  _applyExpirations() {
    var newCacheList = [];

    const expirationTime =
      new Date().getTime() - this.options.expireIn * 60 * 1000;
    this._cacheList.forEach((sub) => {
      if (sub.updated >= expirationTime) {
        newCacheList.push(sub);
      } else {
        delete this._cacheMap[sub.hash];
      }
    });

    this._cacheList = newCacheList;
  }
  _registerComputation() {
    return Deps.autorun(() => {
      this._applyExpirations();
      this._applyCacheLimit();

      var ready = true;
      this._cacheList.forEach((sub) => {
        sub.ready = Meteor.subscribe.apply(Meteor, sub.args).ready();
        ready = ready && sub.ready;
      });

      if (ready) {
        this._ready = true;
        this._notifyChanged();
      }
    });
  }
  _createIdentifier = (args) =>
    args.map((value) => (typeof value == "string" ? '"' + value + '"' : value));

  _handleError(sub) {
    var args = sub.args;
    var lastElement = args[args.length - 1];
    sub.identifier = this._createIdentifier(args);

    if (!lastElement) {
      args.push({ onError: errorHandlingLogic });
    } else if (typeof lastElement == "function") {
      args.pop();
      args.push({ onReady: lastElement, onError: errorHandlingLogic });
    } else if (typeof lastElement.onError == "function") {
      var originalOnError = lastElement.onError;
      lastElement.onError = (err) => {
        errorHandlingLogic(err);
        originalOnError(err);
      };
    } else if (typeof lastElement.onReady == "function") {
      lastElement.onError = errorHandlingLogic;
    } else {
      args.push({ onError: errorHandlingLogic });
    }

    function errorHandlingLogic(err) {
      console.log(
        "Error invoking SubsManager.subscribe(%s): ",
        sub.identifier,
        err.reason,
      );
      // expire this sub right away.
      // Then expiration machanism will take care of the sub removal
      sub.updated = new Date(1);
    }
  }
  reset() {
    var oldComputation = this.computation;
    this.computation = this._registerComputation();

    // invalidate the new compuation and it will fire new subscriptions
    this.computation.invalidate();

    // after above invalidation completed, fire stop the old computation
    // which then send unsub messages
    // mergeBox will correct send changed data and there'll be no flicker
    Deps.afterFlush(() => {
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
