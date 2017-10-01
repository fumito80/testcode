"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Generic Functions
 */
class R {
    static _defaultTo(defaultValue, value) {
        return value == null ? defaultValue : value;
    }
    ;
    static curry(fn) {
        let argsBuf;
        const _curry = (fn, ...argsPart) => {
            argsBuf.push(...argsPart);
            if (argsBuf.length >= fn.length) {
                return fn(...argsBuf);
            }
            return (...args2) => _curry(fn, ...args2);
        };
        return (...args) => {
            argsBuf = [];
            return _curry(fn, ...args);
        };
    }
}
R.range = (start, end) => Array.apply(null, Array(end - start)).map((_, i) => i + start);
R._lpad = (digits, filler, source) => {
    return (R.range(1, digits).reduce((acc) => acc + filler, "") + source).substr(-digits);
};
R.lpad = R.curry(R._lpad);
R.defaultTo = R.curry(R._defaultTo);
exports.R = R;
exports.logger = (fs, fileName) => {
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
        info: log("INFO"),
        warn: log("WARN"),
    };
};
exports.findPathsNode = (node, comparator, path = []) => {
    if (typeof node === "object" && !Array.isArray(node)) {
        return Object.keys(node).reduce((memo, key) => {
            const currentPath = path.concat([key]);
            return memo.concat(comparator(key) ? [currentPath] : [], exports.findPathsNode(node[key], comparator, currentPath));
        }, []);
    }
    else {
        return [];
    }
};
exports.getNodeJson = (paths) => {
    return (json) => {
        if (paths.length === 0) {
            return json;
        }
        const [head, ...tail] = paths;
        return exports.getNodeJson(tail)(json[head]);
    };
};
exports.copyJson = (obj) => JSON.parse(JSON.stringify(obj));
exports.setNodeJson = (paths, value) => {
    return (json) => {
        const getOrCreateNodeJson = (node, paths2) => {
            if (paths2.length === 0) {
                return node;
            }
            if (node[paths2[0]] === undefined) {
                node[paths2[0]] = {};
            }
            return getOrCreateNodeJson(node[paths2[0]], paths2.slice(1));
        };
        const clone = exports.copyJson(json);
        const parentPath = paths.slice(0, -1);
        const target = paths.slice(-1)[0];
        getOrCreateNodeJson(clone, parentPath)[target] = value;
        return clone;
    };
};
/**
 * Array's generic callbacks
 */
// Unique for filter
exports.uniq = (value, i, self) => self.indexOf(value) === i;
// Flatten for reduce
exports.flatten = (memo, listable) => {
    return [].concat(memo, Array.isArray(listable) ?
        listable.reduce((memo2, listable2) => exports.flatten(memo2, listable2)) :
        listable);
};
exports.flat2to1 = (memo, listable) => {
    return [].concat((memo || []), ...(Array.isArray(listable) ? listable : [listable]));
};
exports.match = (...matchers) => {
    const isMatch = (comparator, value) => {
        if (comparator == null) {
            return true;
        }
        else if (comparator.constructor.name === "RegExp" || comparator instanceof RegExp) {
            return comparator.test(value);
        }
        return comparator === value;
    };
    return (value) => {
        const [, f] = matchers.find(([comparator]) => isMatch(comparator, value));
        // const [, f] = matched || [, null];
        return f(value);
    };
};
/**
 * Function Combinaters
 */
exports.pipe = (fn, ...fns) => (a) => fns.reduce((memo, fn2) => fn2(memo), fn(a));
exports.compose = (...fns) => exports.pipe(fns.pop(), fns.reverse());
exports.identity = (a) => a;
exports.tap = (f) => (a) => {
    f(a);
    return a;
};
exports.alt = (...fns) => (a) => {
    if (!fns[0]) {
        return null;
    }
    // case !0 && !'' && !false && !null && !undefined
    return fns[0](a) || exports.alt(...fns.slice(1))(a);
    // case !false && !null && !undefined
    // const ret = fns[0](a);
    // return (ret !== false && ret !==null && ret !== undefined) ? ret : alt(...fns.slice(1))(a);
};
exports.fork = (join, f1, f2) => (a) => join(f1(a), f2(a));
exports.seq = (fn, ...fns) => (a) => {
    [fn].concat(...fns).forEach(f => f(a));
    return a;
};
/**
 * Maybe monad
 */
class Maybe {
}
Maybe.just = (a) => new Just(a);
Maybe.nothing = () => new Nothing();
Maybe.fromNullable = (a) => (a != null && a !== false) ? Maybe.just(a) : Maybe.nothing();
Maybe.of = (a) => Maybe.just(a);
exports.Maybe = Maybe;
class Just extends Maybe {
    constructor(valueIn) {
        super();
        this.valueIn = valueIn;
        this.map = (f) => Maybe.fromNullable(f(this.value));
        this.getOrElse = (_) => this.value;
        this.filter = (f) => Maybe.fromNullable(f(this.value) ? this.value : null);
        this.chain = (f) => f(this.value);
    }
    get value() {
        return this.valueIn;
    }
}
class Nothing extends Maybe {
    constructor() {
        super(...arguments);
        this.map = (_) => this;
        this.getOrElse = (other) => other;
        this.filter = (_) => this;
        this.chain = (_) => this;
    }
    get value() {
        throw new TypeError(`Can't extract the value of a Nothing.`);
    }
}
exports.lift = (f) => (value) => Maybe.fromNullable(value).map(f);
exports.map = (f) => (container) => container.map(f);
exports.chain = (f) => (container) => container.chain(f);
exports.filter = (f) => (container) => container.filter(f);
/**
 * Either monad
 */
class Either {
    constructor(valueIn) {
        this.valueIn = valueIn;
    }
    get value() {
        return this.valueIn;
    }
}
Either.left = (a) => new Left(a);
Either.right = (a) => new Right(a);
Either.fromNullable = (val) => (val !== null && val !== undefined) ? Either.right(val) : Either.left(val);
Either.of = (a) => Either.right(a);
exports.Either = Either;
class Right extends Either {
    constructor() {
        super(...arguments);
        this.map = (f) => Either.of(f(this.value));
        this.getOrElse = (_) => this.value;
        this.orElse = (_) => this;
        this.chain = (f) => f(this.value);
        this.getOrElseThrow = (a) => this.value;
        this.filter = (f) => Either.fromNullable(f(this.value) ? this.value : null);
    }
    get value() {
        return this.value;
    }
}
class Left extends Either {
    constructor() {
        super(...arguments);
        this.map = (_) => this;
        this.getOrElse = (other) => other;
        this.orElse = (f) => f(this.value);
        this.chain = (f) => this;
        this.getOrElseThrow = (a) => { throw new Error(a); };
        this.filter = (f) => this;
    }
    get value() {
        throw new TypeError(`Can't extract the value of a Left(a).`);
    }
}
