/**
 * Generic Functions
 */
export class R {
  static range = (start, end) => Array.apply(null, Array(end - start)).map((_, i) => i + start);
  private static _lpad = (digits, filler, source) => {
    return (R.range(1, digits).reduce((acc) => acc + filler, "") + source).substr(-digits);
  }
  static lpad = R.curry(R._lpad);
  private static _defaultTo(defaultValue, value) {
    return value == null ? defaultValue : value;
  };
  static defaultTo = R.curry(R._defaultTo);
  static curry(fn) {
    let argsBuf: any[];
    const _curry = (fn, ...argsPart) => {
      argsBuf.push(...argsPart);
      if (argsBuf.length >= fn.length) {
        return fn(...argsBuf);
      }
      return (...args2) => _curry(fn, ...args2);
    }  
    return (...args) => {
      argsBuf = [];
      return _curry(fn, ...args);
    }
  }
}

export const logger = (fs, fileName: string) => {
  const fd = fs.openSync(fileName, "w");
  const eol = require("os").EOL;
  const log = (logType) => {
    return (arg, ...args) => {
      const now = new Date();
      const msg = `[${now.toLocaleString()}.${R.lpad(now.getMilliseconds(), 3)}] `
        + `[${logType}] ${JSON.stringify(arg)}${args.map(arg2 => ", " + arg2).join("")}`;
      // console.log(msg);
      fs.writeSync(fd, msg + eol);
      return arg;
    };
  };
  process.on("exit", _ => fs.closeSync(fd));
  return {
    debug: log("TRACE"),
    error: log("ERROR"),
    info:  log("INFO"),
    warn:  log("WARN"),
  };
};

export const findPathsNode = (node, comparator: (key: string) => boolean, path: string[] = []): string[][] => {
  if (typeof node === "object" && !Array.isArray(node)) {
    return Object.keys(node).reduce((memo: string[][], key: string) => {
      const currentPath = path.concat([key]);
      return memo.concat(comparator(key) ? [currentPath] : [], findPathsNode(node[key], comparator, currentPath));
    }, []);
  } else {
    return [];
  }
};

export const getNodeJson = (paths: any[]) => {
  return (json) => {
    if (paths.length === 0) {
      return json;
    }
    const [head, ...tail] = paths;
    return getNodeJson(tail)(json[head]);
  }
};

export const copyJson = (obj) => JSON.parse(JSON.stringify(obj));

export const setNodeJson = (paths: string[], value) => {
  return (json) => {
    const getOrCreateNodeJson = (node, paths2: string[]) => {
      if (paths2.length === 0) {
        return node;
      }
      if (node[paths2[0]] === undefined) {
        node[paths2[0]] = {};
      }
      return getOrCreateNodeJson(node[paths2[0]], paths2.slice(1));
    };
    const clone = copyJson(json);
    const parentPath = paths.slice(0, -1);
    const target = paths.slice(-1)[0];
    getOrCreateNodeJson(clone, parentPath)[target] = value;
    return clone;
  }
};

/**
 * Array's generic callbacks
 */
// Unique for filter
export const uniq = (value, i, self) => self.indexOf(value) === i;
// Flatten for reduce
export const flatten = (memo, listable) => {
  return [].concat(memo,
    Array.isArray(listable) ?
    listable.reduce((memo2, listable2) => flatten(memo2, listable2)) :
    listable);
};
export const flat2to1 = (memo, listable) => {
  return [].concat((memo || []), ...(Array.isArray(listable) ? listable : [listable]));
}

export const match = (...matchers: any[]) => {
  const isMatch = (comparator, value) => {
    if (comparator == null) {
      return true;
    }
    else if (comparator.constructor.name === "RegExp" || comparator instanceof RegExp) {
      return comparator.test(value);
    }
    return comparator === value;
  }
  return (value) => {
    const [, f] = matchers.find(([comparator]) => isMatch(comparator, value));
    // const [, f] = matched || [, null];
    return f(value);
  }
}

/**
 * Function Combinaters
 */
export const pipe = (fn, ...fns) => (a) => fns.reduce((memo, fn2) => fn2(memo), fn(a));
export const compose = (...fns) => pipe(fns.pop(), fns.reverse());
export const identity = (a) => a;
export const tap = (f) => (a) => {
  f(a);
  return a;
};
export const alt = (...fns) => (a) => {
  if (!fns[0]) {
    return null;
  }
  // case !0 && !'' && !false && !null && !undefined
  return fns[0](a) || alt(...fns.slice(1))(a);
  // case !false && !null && !undefined
  // const ret = fns[0](a);
  // return (ret !== false && ret !==null && ret !== undefined) ? ret : alt(...fns.slice(1))(a);
};
export const fork = (join, f1, f2) => (a) => join(f1(a), f2(a));
export const seq = (fn, ...fns) => (a) => {
  [fn].concat(...fns).forEach(f => f(a));
  return a;
};

/**
 * Maybe monad
 */
export class Maybe {
  public static just = (a) => new Just(a);
  public static nothing = () => new Nothing();
  public static fromNullable = (a): IMaybe => (a != null && a !== false) ? Maybe.just(a) : Maybe.nothing();
  public static of = (a) => Maybe.just(a);
}

export interface IMaybe {
  value;
  map(f);
  getOrElse(_);
  filter(f);
  chain(f);
}

class Just extends Maybe implements IMaybe {
  constructor(private valueIn) {
    super();
  }
  get value() {
    return this.valueIn;
  }
  public map = (f) => Maybe.fromNullable(f(this.value));
  public getOrElse = (_) => this.value;
  public filter = (f) => Maybe.fromNullable(f(this.value) ? this.value : null);
  public chain = (f) => f(this.value);
}

class Nothing extends Maybe implements IMaybe {
  get value() {
    throw new TypeError(`Can't extract the value of a Nothing.`);
  }
  public map = (_) => this;
  public getOrElse = (other) => other;
  public filter = (_) => this;
  public chain = (_) => this;
}

export const lift = (f) => (value) => Maybe.fromNullable(value).map(f);
export const map = (f) => (container) => container.map(f);
export const chain = (f) => (container) => container.chain(f);
export const filter = (f) => (container) => container.filter(f);

/**
 * Either monad
 */
export class Either {
  public static left = (a) => new Left(a);
  public static right = (a) => new Right(a);
  public static fromNullable = (val) => (val !== null && val !== undefined) ? Either.right(val) : Either.left(val);
  public static of = (a) => Either.right(a);
  constructor(protected valueIn) {}
  get value() {
    return this.valueIn;
  }
}

export interface IEither {
  value;
  map(f);
  getOrElse(_);
  orElse(f);
  chain(f);
  getOrElseThrow(a);
  filter(f);
}

class Right extends Either implements IEither {
  get value() {
    return this.value;
  }
  public map = (f) => Either.of(f(this.value));
  public getOrElse = (_) => this.value;
  public orElse = (_) => this;
  public chain = (f) => f(this.value);
  public getOrElseThrow = (a) => this.value;
  public filter = (f) => Either.fromNullable(f(this.value) ? this.value : null);
}

class Left extends Either implements IEither {
  get value() {
    throw new TypeError(`Can't extract the value of a Left(a).`);
  }
  public map = (_) => this;
  public getOrElse = (other) => other;
  public orElse = (f) => f(this.value);
  public chain = (f) => this;
  public getOrElseThrow = (a) => {throw new Error(a); };
  public filter = (f) => this;
}
