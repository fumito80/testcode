// strictモードに設定
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// ================================
// ==    ヘルパー関数/クラス    =
// ================================
/**
 * 配列をユニークにする 配列のfilterメソッド用の汎用コールバック関数
 * @param value 配列の値
 * @param i     配列の現在のインデックス
 * @param self  元の配列
 */
exports.uniq = (value, i, self) => self.indexOf(value) === i;
/**
 * 多次元配列を1次元配列する 配列のreduceメソッド用の汎用コールバック関数
 */
exports.flatten = (memo, array) => {
    const newArray = Array.isArray(array) ? array.reduce(exports.flatten) : [array];
    return [].concat(memo, newArray);
};
/**
 * 左側に0埋めした指定した桁数の値を返す
 * @param source 元の数値
 * @param digits 返す桁数
 */
exports.lpad0 = (source, digits) => String(source + Math.pow(10, digits)).substring(1);
/**
 * Array関連のメソッドを配列を引数に取る関数形式で呼び出すための関数集+α （引数はRamda互換）
 */
class R {
    static map(fn) {
        return (array) => array.map(fn);
    }
    static reduce(fn, initial) {
        return (array) => initial === undefined ? array.reduce(fn) : array.reduce(fn, initial);
    }
    static filter(fn) {
        return (array) => array.filter(fn);
    }
    static uniq(array) {
        return array.filter(exports.uniq);
    }
    static last(array) {
        return array.slice(-1)[0];
    }
    static append(value, array) {
        return array === undefined ? (array2) => R.append(value, array2) : array.concat(value);
    }
    static isEmpty(value) {
        const [, a, o] = /(Array|String)|(Object)/.exec(exports.getClassName(value)) || [, null, null];
        return (a && value.length === 0) || (o && Object.keys(value).length === 0);
    }
    /**
     * 配列の末尾を除いた新しい配列を返す
     */
    static init(array) {
        return R.defaultTo([], array.slice(0, -1));
    }
    /**
     * 自然数の配列を返す
     * @param start 開始自然数
     * @param end 終了自然数
     */
    static range(start, end) {
        return Array.apply(null, Array(end - start)).map((_, i) => i + start);
    }
    /**
     * Collection（オブジェクトや配列の配列）をキー毎に配列にまとめる
     * @param fnGroupKey キーを抽出するユーザー関数
     * @param fnModify 値を加工するユーザー関数（オプション）
     * @param collection 対象のCollection
     * @return fnGroupKeyで抽出したキーの元データの配列のオブジェクト { [key: string]: any[] }
     */
    static groupBy(fnGroupKey, fnModify = R.identity) {
        return (collection) => {
            const predata = collection.map(el => [fnGroupKey(el), el]);
            return predata
                .map(([key]) => key).filter(exports.uniq).map((key) => {
                const values = predata.filter(([key2]) => key2 === key).map(([, el]) => fnModify(el));
                return [key, values];
            })
                .reduce((memo, [key, values]) => {
                return setNodeJson([[key], values])(memo);
            }, {});
        };
    }
    static countBy(fnGroupKey) {
        return (collection) => {
            return R.toPairs(R.groupBy(fnGroupKey)(collection)).reduce((memo, [key, items]) => {
                return setNodeJson([[key], items.length])(memo);
            }, {});
        };
    }
    static sum(array) {
        return array.reduce((memo, value) => memo + value, 0);
    }
    /**
     * 引数の関数を左から適用
     * 各関数の引数は必ず一つで、関数の結果が次の関数の引数になる
     * @param fn  最初の関数
     * @param fns 2番目以降の関数をいくつでも
     */
    static pipe(fn, ...fns) {
        return (arg) => fns.reduce((acc, fn2) => fn2(acc), fn(arg));
    }
    /**
     * 引数の関数を右から適用（pipeの逆）
     * @param fns 関数をいくつでも
     */
    // compose: (...fns) => this.pipe(fns.pop(), ...fns.reverse()),
    /** オブジェクトをキーバリューペアに変換
     * @param obj ソースオブジェクト
     * @return [string, any][] キーバリューペアの配列
     */
    static toPairs(obj) {
        return Object.keys(obj).map((key) => [key, obj[key]]);
    }
    /**
     * JSONオブジェクト限定オブジェクトのコピー関数
     * @param json
     */
    static clone(json) {
        return JSON.parse(JSON.stringify(json));
    }
    /**
     * 値がnull or undefinedのときに代替値を返す
     * @param value 検査する値
     * @param proxy NULLのときの代替値
     */
    static defaultTo(defaultValue, value) {
        return value == null ? defaultValue : value;
    }
    // Maybeモナドクラスを、compose/pipeで使用する為の関数
    static lift(f) {
        return (a) => Maybe.fromNullable(a).map(f);
    }
    static fmap(f) {
        return (container) => container.map(f);
    }
    static chain(f) {
        return (container) => container.chain(f);
    }
    // mapチェーンやcompose/pipeの関数合成で、処理をスキップさせたいときなどで使用する
    static identity(a) {
        return a;
    }
    // 関数を順に適用していって、最初にnullとundefinedを返さない関数の値を返す
    static alt(...fns) {
        return (a) => {
            if (!fns[0]) {
                return null;
            }
            const result = fns[0](a);
            if (result != null) {
                return result;
            }
            return R.alt(...fns.slice(1))(a);
        };
    }
    // mapチェーンやcompose/pipeの関数合成で、関数は実行するが前の値をそのままスルーできる関数
    static tap(f) {
        return (a) => {
            f(a);
            return a;
        };
    }
    static mergeDeepRight(left, right) {
        const digNode = (node, paths = []) => {
            const className = exports.getClassName(node);
            if (className === 'Object' || className === 'Array') {
                const children = Object.keys(node).reduce((memo, key) => {
                    return memo.concat(digNode(node[key], paths.concat(key)));
                }, []);
                if (R.isEmpty(paths)) {
                    return children;
                }
                return [[paths, className === 'Array' ? [] : {}], ...children];
            }
            return [[paths, node]];
        };
        return setNodeJson.apply(null, digNode(right))(left);
    }
}
exports.R = R;
exports.getClassName = (object) => {
    const [, className] = /\[object (\w+)\]/.exec(Object.prototype.toString.call(object)) || ['', ''];
    return className;
};
/**
 * パターンマッチ関数
 * 等価マッチ、正規表現マッチ、デフォルト
 * @param patterns [matcher, function | value][]
 * @param pattern
 */
exports.match = (...patterns) => {
    return (pattern) => {
        const [, f] = patterns.find(([matcher, fn]) => {
            if (matcher === undefined) {
                return true;
            }
            else if (matcher.constructor.name === 'RegExp' || matcher instanceof RegExp) {
                return matcher.test(pattern);
            }
            return matcher === pattern;
        }) || [, R.identity];
        return f(pattern);
    };
};
/**
 * テーブルデータなどの2次元配列から値を検索して、見つかった位置の配列[行番号, 列番号]を返す
 * 見つからなかった場合は、nullが返る
 * @param target any     検索値
 * @param table  any[][] 検索対象の2次元配列
 * @return [行位置, 列位置] セルの左上が[1, 1]から始まる数値Pair
 */
exports.findPosTable = (target) => {
    return (table) => {
        let col = -1;
        const row = table.findIndex((cols) => (col = cols.findIndex((value) => value === target)) !== -1);
        return row === -1 ? null : [row, col];
    };
};
/**
 * JSONから、PATHのオブジェクトを返す（参照データなので注意）
 * @param json 検索対象のJSON
 * @param paths オブジェクトのキーの階層の配列
 * @return パス位置のオブジェクト 参照データなので注意
 */
exports.getNodeJson = (paths, json) => {
    if (paths.length === 0) {
        return json;
    }
    const [head, ...tail] = paths;
    return exports.getNodeJson(tail, json[head]);
};
/**
 * JSONのPATHのオブジェクトに値をセットして新しいJSONを返す
 * @param json 検索対象のJSON
 * @param paths オブジェクトのキーの階層の配列
 * @return パス位置に値をセットした新しいオブジェクト
 */
function setNodeJson(...pathValueSet) {
    const getOrCreateNode = (node, paths) => {
        if (paths.length === 0) {
            return node;
        }
        const [head, ...tail] = paths;
        if (node[head] === undefined) {
            return undefined;
            // node[head] = {};
        }
        return getOrCreateNode(node[head], tail);
    };
    return (json) => {
        const clone = R.clone(json);
        pathValueSet.forEach(([path, value]) => {
            const parent = getOrCreateNode(clone, R.init(path));
            if (parent === undefined) {
                return;
            }
            const isObjectValue = /Object|Array/.test(exports.getClassName(value));
            if (!isObjectValue || (isObjectValue && parent[R.last(path)] === undefined)) {
                parent[R.last(path)] = value;
            }
        });
        return clone;
    };
}
exports.setNodeJson = setNodeJson;
/**
 * JSONから、検索関数を渡して、一致するキーのオブジェクトのパスが配列で入った全検索パスの配列が返る
 * @param json 検索対象のJSON
 * @param comparator キー検索条件の関数（Key,Valueが引数に渡される）
 * @return [string[]] | [] 見つかったパスの配列の配列
 */
exports.findPathsJson = (comparator) => {
    const f = (node, paths, currentKey) => {
        if (typeof node === 'object') {
            return Object.keys(node).reduce((memo, key) => {
                return memo.concat(f(node[key], paths.concat(key), key));
            }, []);
        }
        else {
            if (comparator(currentKey, node)) {
                return [paths];
            }
            return [];
        }
    };
    return (json) => {
        return f(json, [], '');
    };
};
exports.findNodeJson = (comparator) => {
    return (json) => {
        return exports.findPathsJson(comparator)(json).map(path => exports.getNodeJson(path, json));
    };
};
/**
 * Maybeモナド親クラス
 */
class Maybe {
}
Maybe.just = (a) => new Just(a);
Maybe.nothing = () => new Nothing();
Maybe.of = (a) => Maybe.just(a);
Maybe.fromNullable = (a) => a !== null ? Maybe.just(a) : Maybe.nothing();
exports.Maybe = Maybe;
// Maybeモナド - Just（処理継続）クラス
class Just extends Maybe {
    constructor(inValue) {
        super();
        this.inValue = inValue;
        this.map = (f) => Maybe.fromNullable(f(this.value));
        this.chain = (f) => f(this.value);
        this.filter = (f) => Maybe.fromNullable(f(this.value) ? this.value : null);
        this.getOrElse = (_) => this.value;
    }
    get value() {
        return this.inValue;
    }
}
// Maybeモナド - Nothing（非処理継続）クラス
class Nothing extends Maybe {
    constructor() {
        super(...arguments);
        this.map = (f) => this;
        this.chain = (f) => this;
        this.filter = (f) => this;
        this.getOrElse = (other) => other;
    }
    get value() {
        throw new TypeError(`Can't extract the value of a Nothing.`);
    }
}
/**
 * Eitherモナド親クラス
 */
class Either {
    constructor(inValue) {
        this.inValue = inValue;
    }
    get value() {
        return this.inValue;
    }
}
Either.left = (a) => new Left(a);
Either.right = (a) => new Right(a);
Either.of = (a) => Either.right(a);
Either.fromNullable = (val) => (val !== null && val !== undefined) ? Either.right(val) : Either.left(val);
exports.Either = Either;
// Eitherモナド - Left（エラー継続）クラス
class Left extends Either {
    constructor() {
        super(...arguments);
        this.map = (_) => this;
        this.chain = (_) => this;
        this.filter = (_) => this;
        this.orElse = (f) => f(this.value);
        this.getOrElse = (other) => other;
    }
    // Override value property
    get value() {
        throw new TypeError(`Can't extract the value of a Left(a).`);
    }
    getOrElseThrow(a) {
        throw new Error(a);
    }
}
// Eitherモナド - Right（成功継続）クラス
class Right extends Either {
    constructor() {
        super(...arguments);
        this.map = (f) => Either.of(f(this.value));
        this.chain = (f) => f(this.value);
        this.filter = (f) => Either.fromNullable(f(this.value) ? this.value : null);
        this.orElse = (_) => this;
        this.getOrElseThrow = (_) => this.value;
        this.getOrElse = (_) => this.value;
    }
}
