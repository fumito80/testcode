// import expect from "chai";
// import { assert } from 'assert';
import assert from "power-assert";

// import test from "ava";

import { fromJS, Map } from "immutable";

import {
  identity,
  copyJson,
  findPathsNode,
  getNodeJson,
  logger,
  setNodeJson,
  match,
  flatten,
  flat2to1,
} from "../MyUtils";

import { R as S } from "../MyUtils";

import { main } from '../Schema-1';

import * as _ from "lodash";
import * as R from "ramda";

import * as fs from "fs";
const log = logger(fs, "../trace.log");
// const log = new Logger(fs, './trace.log');

// const log4 = require('log4js');
// log4.configure({
//   appenders: { access: { type: 'file', filename: './console.log' }, console: { type: 'console' } },
//   categories: { default: { appenders: ['access', 'console'], level: 'info' } }
// });
// const log = log4.getLogger('access');

log.info("start!");

const testobj = {
  id: "0",
  aba: {
    id: "1",
    children: [1, 2, 3],
    test: {
      id: "s",
    },
  },
  abc: {
    id: "2",
    children: ["a", "b", "c"],
  },
  dd: {
    id: {
      id: {
        id: "3",
      },
    },
  },
};

const immutableObj = fromJS(testobj);

// console.log(immutableObj.find());

describe("testobj", () => {
  
  it('findPathsNode', () => {
    expect(
      findPathsNode(testobj, (key) => key === 'test')
    ).toEqual(
      [ [ 'aba', 'test' ] ]
    );
  });

  it('getNodeJson', () => {
      const paths = ['dd', 'id', 'id', 'id'];
      const test = getNodeJson(testobj, paths);
      expect(paths).toEqual(['dd', 'id', 'id', 'id']);
  });

  it('getNodeJson', () => {
    expect(
      getNodeJson(testobj, ['abc', 'children', 2])
    ).toBe('c');
  });

  it("copyJson", () => {
    const a = copyJson(testobj);
    expect(a).toEqual(testobj);
  });

  it("_.assign & copyJson", () => {
    const c = {a: "A", b: {c: "c"}};
    const a = _.assign(copyJson(c), testobj);
    expect(a).not.toEqual(c);
    expect(c).toEqual({a: "A", b: {c: "c"}});
  });

  it("_.assign & R.assign", () => {
    const c = {a: "A", b: {c: "c"}};
    const a = _.assign(R.clone(c), testobj);
    expect(a).not.toEqual(c);
    expect(c).toEqual({a: "A", b: {c: "c"}});
  });

  it("R.merge", () => {
    const c = {a: {x: "A"}, b: {c: "c"}};
    const a = R.merge(R.clone(c), testobj);
    expect(a).not.toEqual(c);
    a.a.x = 'X';
    expect(c).toEqual({a: {x: "A"}, b: {c: "c"}});
  });

  it("_.assign no destroy", () => {
    const c = {a: "A", b: {c: "c"}};
    const a = _.assign({}, c, testobj);
    expect(a).not.toEqual(c);
    expect(c).toEqual({a: "A", b: {c: "c"}});
  });

  it("_.assign destroy", () => {
    const c = {a: "A", b: {c: "c"}};
    const a = _.assign(c, testobj);
    expect(a).toEqual(c);
    expect(c).not.toEqual({a: "A", b: {c: "c"}});
  });

});


describe("testobj", () => {
  
  const testobj2 = {
    dd: {
      id: {
        id: {
          gx: {
            sx: {
              fw: "1",
            },
          },
        },
      },
    },
  };

  it("setNodeJson", () => {
    expect(
      setNodeJson(["dd", "id", "id", "gx", "sx", "fw"], "1")({}),
    ).toEqual(testobj2);
  });

  it("setNodeJson", () => {
    const newobj = setNodeJson(["dd", "id", "id", "gx", "sx", "fw"], "2")(testobj2);
    expect(newobj).not.toEqual(testobj2);
    expect(newobj).toEqual({dd:{id:{id:{gx:{sx:{fw:'2'}}}}}});
  });

  it("R.set", () => {
    expect(
      R.set(R.lensPath(["dd", "id", "id", "gx", "sx", "fw"]), "2", testobj2),
    ).not.toEqual(testobj2);
  });

  it("R.set", () => {
    const setter = R.set(R.lensPath(["dd", "id", "id", "gx", "sx", "fw"]), "1");
    expect(
      setter({}),
    ).toEqual(testobj2);
  });

});

describe('test', () => {
  describe('findPathsNode', () => {
    it('case1', () => {
      expect(
        findPathsNode(testobj, (key) => key === 'test')
      ).toEqual(
        [ [ 'aba', 'test' ] ]
      );
      // assert.deepEqual(findPathsNode(testobj, (key) => key === 'test'), [ [ 'aba', 'test', 'dd' ] ]);
    });
    it('case2', () => {
      expect(
        findPathsNode(testobj, (key) => key === 'id')
      ).toEqual(
        [ [ 'id' ],
          [ 'aba', 'id' ],
          [ 'aba', 'test', 'id' ],
          [ 'abc', 'id' ],
          [ 'dd', 'id' ],
          [ 'dd', 'id', 'id' ],
          [ 'dd', 'id', 'id', 'id' ] ]
      );
    });
  });
});

describe('spilt bind', () => {
  it('undefined', () => {
    const [a1, a2, a3, a4] = 'a,b'.split(',');
    expect(a1).toBe('a');
    expect(a4).toBeUndefined();
  });
});

describe('tuple', () => {
  it('tuple merges to flatten', () => {
    type single = [string];
    type pair = [string, string];
    type triple = [string, any, any];
    const t1: single = ['c'];
    const t2: triple = ['a', 'b', 'c'];
    const t3 = [...t2, 'd'];
    expect(t3).toEqual(['a', 'b', 'c', 'd']);
  });

  it('undefine', () => {
    const [a1, a2] = [, 'test'];
    expect(a1).toBe(undefined);
    expect(a2).toBe('test');
  })
  it('flatten', () => {
    const collection = [1, [2, 3], [4, 5], 6, [7, [8, 9], 10]];
    expect(collection.reduce(flatten)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(collection.reduce(flat2to1)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const collection2 = [1, [2, 3], [4, 5], 6, [7, [8, 9, [10, 11]], 12]];
    expect(collection2.reduce(flatten)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(collection2.reduce(flat2to1)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, [10, 11], 12]);
    // const collection2 = [1, [2, 3], [4, 5], 6, ...[7, [8, 9], 10]];
    // expect(collection2).toEqual([1, [2, 3], [4, 5], 6, 7, 8, 9, 10]);
    // const collection = [[1, 2], [3, 4], [5, 6], 7];
    // const flat = collection.reduce((memo, item) => (Array.isArray(memo) ? memo : []).concat(Array.isArray(item) ? ...(item || []) : item)); // [...collection[0], ...collection[1], ...collection[2]];
  });

  it('regExp', () => {
    const unmatchProxy = [...[undefined]];
    const [, , a1, a2, a3, a4] = /(^G.+?)-(\d{3})-(\[\d+\])/.exec('GBD003-001-[2]') || unmatchProxy;
    expect([a1, a2]).toEqual(['001', '[2]']);
  });
  it('regExp', () => {
    const unmatchProxy = [undefined];
    const [, a0, a1, a2, a3, a4] = /(^G.+?)-(\d{3})-(\[\d+\])/.exec('GBD003(2)-0010-[2]') || unmatchProxy;
    expect([a0, a2]).toEqual([undefined, undefined]);
  });
});

describe('object', () => {
  it('unmatched', () => {
    const fncs = (v) => {
      switch (v) {
        case 'a': return a => a - 2;
        case 'b': return a => a + 2;
        default: return a => a;
      }
    }
    const s = 'c';
    expect(
      fncs(s)(2)
    ).toEqual(2);
  });
});

describe('patteurn matching', () => {
  it('match1', () => {
    const fact = match(
      [0, () => 1],
      [, (n) => n * fact(n - 1)],
    );
    expect(
      fact(5)
    ).toEqual(120);
    expect(
      fact(4)
    ).toEqual(24);
  });
  it('match2', () => {
    const fact = match(
      ['identity', _ => identity],
      [, _ => n => n * 2],
    );
    expect(
      fact('other')(5)
    ).toEqual(10);
    expect(
      fact('identity')(7)
    ).toEqual(7);
  });
});

describe('Array', () => {
  it('Array', () => {
    const a = {a: {x: 9}, b: 2, c: 3};
    const c = R.merge(R.clone(a), {d: 4});
    const d = setNodeJson(['d'], 4)(a); // a.slice(0);
    a.a.x = 5;
    expect(a).toEqual({a: {x: 5}, b: 2, c: 3});
    expect(d).toEqual({a: {x: 9}, b: 2, c: 3, d: 4});
    expect(c).toEqual({a: {x: 9}, b: 2, c: 3, d: 4});
    // expect(a).toEqual([{a: 5}, {a: 2}, {a: 3}]);
    const b = S.range(1, 6);
    expect(b).toEqual([1, 2, 3, 4, 5]);
  });
  it('', () => {
    const [a = 3, b = a, c = a] = [];
    expect([a, b, c]
    ).toEqual([3, 3, 3]
    );
    const [x = 3, y = x, z = x] = [7];
    expect([x, y, z]
    ).toEqual([7, 7, 7]
    );
  });
});

describe('Object', () => {
  it('expand', () => {
    const obj = {a: 1, b: 2, c: 3};
    const {a, b, c} = obj;
    expect(b
    ).toEqual(2
    );
  });
  it('compute prop1', () => {
    const [key, value] = ['x', 'v'];
    const obj = { [((a) => a)(key)]: value };
    expect(obj
    ).toEqual(
      {x: 'v'}
    );
  });
  it('compute prop2', () => {
    const key = 'a';
    const obj = {
      [key]: 'z',
      a: 'x',
      b: 'y',
    };
    expect(obj[key]).toBe('x');
    let key2 = 'c';
    const obj2 = {
      [key2]: 'z',
      a: 'x',
      b: 'y',
    };
    expect(obj2[key2]).toBe('z');
    key2 = 'd';
    const obj3 = copyJson(obj2);
    expect(obj3[key2]).toBeDefined;
  });
});

describe('', () => {
  it('', () => {
    const [a, b, c] = /(\w)-(\w)-(\w)/.exec('!-!-!') || [...[null]];
    expect([a]
    ).toEqual([null]
    );
  });
});

describe('Schema-1.js', () => {
  it('main', () => {
    expect(main(1)).toBeFalsy();
    expect(main(7)).toBeFalsy();
    expect(main(16)).toBeFalsy();
    expect(main('2')).toBeTruthy();
  });
});

describe('Array.includes', () => {
  it('', () => {
    const result = ['ERRORS', 'WARNS'].includes('ERRORS');    
    expect(result).toBeTruthy();
  });
});

describe('R.defaultTo', () => {
  it('R.defaultTo', () => {
    const test = null;
    // console.log(S.defaultTo(42, test));
    expect(S.defaultTo(42, test)).toBe(42);
    expect(S.defaultTo(42)(test)).toBe(42);
  });
});

describe('R.curry', () => {
  it('R.curry', () => {
    expect(S.curry(S.range)(1)(5)).toEqual([1, 2, 3, 4]);
    expect(S.curry(S.range)(1, 5)).toEqual([1, 2, 3, 4]);
  });
  it('R.curry 2', () => {
    const test = (a, b, c) => {
      return a + b + c;
    }
    const test1 = S.curry(test)(1)(2);
    expect(S.curry(test)(1, 2, 3)).toBe(6);
    expect(test1(3)).toBe(6);
  });
});

describe('R.lpad', () => {
  it('R.lpad', () => {
    R.range()
    expect(S.lpad(5, 'A')('XX')).toBe('AAAXX');
    expect(S.lpad(5, 'A', 'XX')).toBe('AAAXX');
  });
});

/*
describe('', () => {
  it('', () => {
    expect(
    ).toEqual(
    );
  });
});
 */

log.info("done!");
