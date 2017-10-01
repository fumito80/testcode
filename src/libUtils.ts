// strictモードに設定
'use strict';

// ================================
// ==    node_modulesインポート    =
// ================================

import * as fs from 'fs';

// ================================
// ==    ライブラリインポート    =
// ================================

// import { consts } from './constant';

// ================================
// ==    汎用型宣言    =
// ================================

declare global {
  // tuple/KeyValue pair variation
  type Pair<T> = [string, T];
  type KeyValues = Pair<any[]>;
}

// ================================
// ==    ヘルパー関数/クラス    =
// ================================

/**
 * 配列をユニークにする 配列のfilterメソッド用の汎用コールバック関数
 * @param value 配列の値
 * @param i     配列の現在のインデックス
 * @param self  元の配列
 */
export const uniq = (value: any, i: number, self: any[]): boolean => self.indexOf(value) === i;

/**
 * 多次元配列を1次元配列する 配列のreduceメソッド用の汎用コールバック関数
 */
export const flatten = (memo: never[], array: any) => {
  const newArray = Array.isArray(array) ? array.reduce(flatten) : [array];
  return [].concat(memo, newArray);
};

/**
 * 左側に0埋めした指定した桁数の値を返す
 * @param source 元の数値
 * @param digits 返す桁数
 */
export const lpad0 = (source: number, digits: number): string => String(source + Math.pow(10, digits)).substring(1);

/**
 * Array関連のメソッドを配列を引数に取る関数形式で呼び出すための関数集+α （引数はRamda互換）
 */
export class R {
  static map(fn) {
    return (array: any[]): any[] => array.map(fn);
  }
  static reduce(fn: { (memo: any, value: any, i?: number): any }, initial?) {
    return (array: any[]) => initial === undefined ? array.reduce(fn) : array.reduce(fn, initial);
  }
  static filter(fn) {
    return (array: any[]): any[] => array.filter(fn);
  }
  static uniq(array: any[]): any[] {
    return array.filter(uniq);
  }
  static last(array: any[]) {
    return array.slice(-1)[0];
  }
  static append(value, array?: any[]) {
    return array === undefined ? (array2: any[]) => R.append(value, array2) : array.concat(value);
  }
  static isEmpty(value) {
    const [, a, o] = /(Array|String)|(Object)/.exec(getClassName(value)) || [, null, null];
    return (a && value.length === 0) || (o && Object.keys(value).length === 0);
  }
  /**
   * 配列の末尾を除いた新しい配列を返す
   */
  static init(array: any[]): any[] {
    return R.defaultTo([], array.slice(0, -1));
  }
  /**
   * 自然数の配列を返す
   * @param start 開始自然数
   * @param end 終了自然数
   */
  static range(start: number, end: number): number[] {
    return Array.apply(null, Array(end - start)).map((_, i) => i + start);
  }
  /**
   * Collection（オブジェクトや配列の配列）をキー毎に配列にまとめる
   * @param fnGroupKey キーを抽出するユーザー関数
   * @param fnModify 値を加工するユーザー関数（オプション）
   * @param collection 対象のCollection
   * @return fnGroupKeyで抽出したキーの元データの配列のオブジェクト { [key: string]: any[] }
   */
  static groupBy(fnGroupKey: { (el: any): string }, fnModify: { (el: any): any } = R.identity) {
    return (collection: any[]): { [key: string]: any[] } => {
      const predata = collection.map(el => [fnGroupKey(el), el]);
      return predata
        .map(([key]): string => key).filter(uniq).map((key): [string, any[]] => {
          const values = predata.filter(([key2]) => key2 === key).map(([, el]) => fnModify(el));
          return [key, values];
        })
        .reduce((memo , [key, values]) => {
          return setNodeJson([[key], values])(memo);
        }, {});
    };
  }
  static countBy(fnGroupKey: { (el: any): string }) {
    return (collection: any[]): { [key: string]: number } => {
      return R.toPairs(R.groupBy(fnGroupKey)(collection)).reduce((memo, [key, items]) => {
        return setNodeJson([[key], items.length])(memo);
      }, {});
    };
  }
  static sum(array: any[]) {
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
  static toPairs(obj: { [key: string]: any }): [string, any][] {
    return Object.keys(obj).map((key): [string, any] => [key, obj[key]]);
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
    const digNode = (node, paths: string[] = []) => {
      const className = getClassName(node);
      if (className === 'Object' || className === 'Array') {
        const children = Object.keys(node).reduce((memo: string[], key: string) => {
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

export const getClassName = (object) => {
  const [, className] = /\[object (\w+)\]/.exec(Object.prototype.toString.call(object)) || ['', ''];
  return className;
};

/**
 * パターンマッチ関数
 * 等価マッチ、正規表現マッチ、デフォルト
 * @param patterns [matcher, function | value][]
 * @param pattern
 */
export const match = (...patterns) => {
  return (pattern) => {
    const [, f] = patterns.find(([matcher, fn]) => {
      if (matcher === undefined) {
        return true;
      } else if (matcher.constructor.name === 'RegExp' || matcher instanceof RegExp) {
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
export const findPosTable = (target: any) => {
  return (table: any[][]): [number, number] | null => {
    let col: number = -1;
    const row: number = table.findIndex((cols: any[]) => (col = cols.findIndex((value) => value === target)) !== -1);
    return row === -1 ? null : [row, col];
  };
};

/**
 * JSONから、PATHのオブジェクトを返す（参照データなので注意）
 * @param json 検索対象のJSON
 * @param paths オブジェクトのキーの階層の配列
 * @return パス位置のオブジェクト 参照データなので注意
 */
export const getNodeJson = (paths: any[], json) => {
  if (paths.length === 0) {
    return json;
  }
  const [head, ...tail] = paths;
  return getNodeJson(tail, json[head]);
};

/**
 * [path: any[], value: any][]
 */
export type PathValueSet = [any[], any];
/**
 * JSONのPATHのオブジェクトに値をセットして新しいJSONを返す
 * @param json 検索対象のJSON
 * @param paths オブジェクトのキーの階層の配列
 * @return パス位置に値をセットした新しいオブジェクト
 */
export function setNodeJson(...pathValueSet: PathValueSet[]) {
  const getOrCreateNode = (node, paths: any[]) => {
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
      const isObjectValue = /Object|Array/.test(getClassName(value));
      if (!isObjectValue || (isObjectValue && parent[R.last(path)] === undefined)) {
        parent[R.last(path)] = value;
      }
    });
    return clone;
  };
}

/**
 * JSONから、検索関数を渡して、一致するキーのオブジェクトのパスが配列で入った全検索パスの配列が返る
 * @param json 検索対象のJSON
 * @param comparator キー検索条件の関数（Key,Valueが引数に渡される）
 * @return [string[]] | [] 見つかったパスの配列の配列
 */
export const findPathsJson = (comparator: { (key, value): boolean }) => {
  const f = (node, paths: string[], currentKey) => {
    if (typeof node === 'object') {
      return Object.keys(node).reduce((memo: string[], key: string) => {
        return memo.concat(f(node[key], paths.concat(key), key));
      }, []);
    } else {
      if (comparator(currentKey, node)) {
        return [paths];
      }
      return [];
    }
  };
  return (json): string[][] => {
    return f(json, [], '');
  };
};

export const findNodeJson = (comparator: { (key: string, value): boolean }) => {
  return (json): any[] => {
    return findPathsJson(comparator)(json).map(path => getNodeJson(path, json));
  };
};

/**
 * Maybeモナド親クラス
 */
export class Maybe {
  static just = (a) => new Just(a);
  static nothing = () => new Nothing();
  static of = (a) => Maybe.just(a);
  static fromNullable = (a) => a !== null ? Maybe.just(a) : Maybe.nothing();
}
interface IMaybe {
  value,
  map(f),
  chain(f),
  filter(f),
  getOrElse(other)
}
// Maybeモナド - Just（処理継続）クラス
class Just extends Maybe implements IMaybe {
  constructor(private inValue) {
    super();
  }
  get value() {
    return this.inValue;
  }
  map = (f) => Maybe.fromNullable(f(this.value));
  chain = (f) => f(this.value);
  filter = (f) => Maybe.fromNullable(f(this.value) ? this.value : null);
  getOrElse = (_) => this.value;
}
// Maybeモナド - Nothing（非処理継続）クラス
class Nothing extends Maybe implements IMaybe {
  get value(): never {
    throw new TypeError(`Can't extract the value of a Nothing.`);
  }
  map = (f) => this;
  chain = (f) => this;
  filter = (f) => this;
  getOrElse = (other) => other;
}

/**
 * Eitherモナド親クラス
 */
export class Either {
  static left = (a) => new Left(a);
  static right = (a) => new Right(a);
  static of = (a) => Either.right(a);
  static fromNullable = (val) => (val !== null && val !== undefined) ? Either.right(val) : Either.left(val);
  constructor(protected inValue) {}
  get value() {
    return this.inValue;
  }
}
export interface IEither {
  value,
  map(f),
  chain(f),
  filter(f),
  orElse(f),
  getOrElseThrow(a),
  getOrElse(other),
}
// Eitherモナド - Left（エラー継続）クラス
class Left extends Either implements IEither {
  // Override value property
  get value(): never {
    throw new TypeError(`Can't extract the value of a Left(a).`);
  }
  map = (_) => this;
  chain = (_) => this;
  filter = (_) => this;
  orElse = (f) => f(this.value);
  getOrElseThrow(a): never {
    throw new Error(a);
  }
  getOrElse = (other) => other;
}
// Eitherモナド - Right（成功継続）クラス
class Right extends Either implements IEither {
  map = (f) => Either.of(f(this.value));
  chain = (f) => f(this.value);
  filter = (f) => Either.fromNullable(f(this.value) ? this.value : null);
  orElse = (_) => this;
  getOrElseThrow = (_) => this.value;
  getOrElse = (_) => this.value;
}
