// strictモードに設定
'use strict';

import {
  lpad0,
  match,
  flatten,
  R,
  getNodeJson,
  findPathsJson,
  setNodeJson,
} from '../src/libUtils';

/**
 * libUtilFncs
 */
describe('Utility関数/クラス - libUtilFncs.js', () => {

  test('lpad0(789, 7) => \'0000789\' ', () => {
    expect(lpad0(789, 7)).toBe('0000789');
  });

  test('R.append, R.pipe', () => {
    const tester = ['A', 'B', 'C'];
    const result = R.pipe(R.append('D'), R.append('E'))(tester);
    expect(result).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(tester).toEqual(['A', 'B', 'C']);
  });

  describe('R.map, R.reduce', () => {
    const tester = ['A', 'B', 'C'];
    const fnMap = (el) => el.toLowerCase();
    const fnReduce = (memo, el, i) => memo + '.' + el + (i + 1);
    it(`R.reduce initial = ''`, () => {
      const result = R.pipe(R.map(fnMap), R.reduce(fnReduce, ''))(tester);
      expect(result).toBe('.a1.b2.c3');
    });
    it(`R.reduce no initial`, () => {
      const result2 = R.pipe(R.map(fnMap), R.reduce(fnReduce))(tester);
      expect(result2).toBe('a.b2.c3');
    });
    expect(tester).toEqual(['A', 'B', 'C']);
  });

  test('R.uniq', () => {
    const tester = ['A', 'B', 'C', 'D', 'B', 'X', 'B', 'A', 'Z'];
    expect(R.uniq(tester)).toEqual(['A', 'B', 'C', 'D', 'X', 'Z']);
  });

  describe('R.sum', () => {
    it('R.sum number only', () => {
      const tester = [6, 44, 0, 2, 8, 7];
      expect(R.sum(tester)).toBe(67);
    });
    test('R.sum include string', () => {
      const tester = [6, 44, 0, 2, 'B', 7];
      expect(R.sum(tester)).toBe('52B7');
    });
  });

  describe('R.filter', () => {
    it('R.filter', () => {
      const isEven = n => n % 2 === 0;
      const test1 = R.filter(isEven)([1, 2, 3, 4]); // => [2, 4]
      expect(test1).toEqual([2, 4]);
      const isEvenO = ([k, v]) => v % 2 === 0;
      const test2 = R.filter(isEvenO)(R.toPairs({ a: 1, b: 2, c: 3, d: 4 })); // => {b: 2, d: 4}
      expect(test2).toEqual([['b', 2], ['d', 4]]);
    });
  });

  describe('R.groupBy', () => {
    const fnGroupKey: { (el: any): string } = (el) => el[0];
    const list = [
      ['FILE_NAME_DATA_02', 'GBD002-002'],
      ['FILE_NAME_DATA_02', 'GBD002-003'],
      ['FILE_NAME_DATA_02', 'GBD002-004'],
      ['FILE_NAME_DATA_03', 'GBD003-007'],
      ['FILE_NAME_DATA_03', 'GBD003-008'],
    ];
    it('ノーマルケース', () => {
      const result = R.groupBy(fnGroupKey)(list);
      // console.log(JSON.stringify(result));
      expect(result).toEqual(
        // [
          {
            'FILE_NAME_DATA_02': [
              ['FILE_NAME_DATA_02', 'GBD002-002'],
              ['FILE_NAME_DATA_02', 'GBD002-003'],
              ['FILE_NAME_DATA_02', 'GBD002-004'],
            ],
            'FILE_NAME_DATA_03': [
              ['FILE_NAME_DATA_03', 'GBD003-007'],
              ['FILE_NAME_DATA_03', 'GBD003-008'],
            ]
          }
        // ]
      );
    });
    it('値の修正', () => {
      const fnModify: { (el: any[]): any } = ([key, values]) => values;
      const result = R.groupBy(fnGroupKey, fnModify)(list);
      // console.log(JSON.stringify(result));
      expect(result).toEqual(
        // [
          {
            'FILE_NAME_DATA_02': [
              'GBD002-002',
              'GBD002-003',
              'GBD002-004',
            ],
            'FILE_NAME_DATA_03': [
              'GBD003-007',
              'GBD003-008',
            ]
          }
        // ]
      );
    });
    it('キーがundefined', () => {
      const test: [string, string[]][] = [
        ['com_customer-[1]', ['a', 'b', 'c']],
        ['com_customer-[2]', ['a', 'b', 'd']],
        ['co_customer-[2]', ['a', 'b', 'e']],
      ];
      const fnGroupKry = ([key]) => (([, memberName]) => memberName)(/com_(\w+)-\[\d+\]/.exec(key) || [, ]);
      const result = R.groupBy(fnGroupKry)(test);
      expect(result).toEqual({
        customer: [
          ['com_customer-[1]', ['a', 'b', 'c']],
          ['com_customer-[2]', ['a', 'b', 'd']],
        ],
        undefined: [
          ['co_customer-[2]', ['a', 'b', 'e']],
        ]
      });
    });
  });

  describe('R.countBy', () => {
    const tester = [
      {
        SENARIO_IF_ID: '02-N-0101_02_JUIBD023_2',
        TYPE: 'RESPONSE'
      },
      {
        SENARIO_IF_ID: '02-N-0101_02_JUIBD023_1',
        TYPE: 'REQUEST'
      },
      {
        SENARIO_IF_ID: '02-N-0101_01_JUIBD002_2',
        TYPE: 'RESPONSE'
      },
      {
        SENARIO_IF_ID: '02-N-0101_01_JUIBD002_1',
        TYPE: 'REQUEST'
      },
      {
        SENARIO_IF_ID: '02-N-0102_03_JUIBD003_2',
        TYPE: 'RESPONSE'
      },
    ];
    it('from: 1 to 5 => [1, 2, 3, 4]', () => {
      const {
        response,
        request,
      } = R.countBy(el => el.TYPE.toLowerCase())(tester);
      const total = response + request;
      expect([response, request, total]).toEqual([3, 2, 5]);
    });
  });

  describe('R.range', () => {
    it('from: 1 to 5 => [1, 2, 3, 4]', () => {
      expect(R.range(1, 5)).toEqual([1, 2, 3, 4]);
    });
  });

  describe('R.last', () => {
    it('R.last', () => {
      expect(R.last([1, 2, 3])).toBe(3);
      expect(R.last([])).toBeUndefined();
    });
  });

  describe('R.init', () => {
    it('R.init', () => {
      expect(R.init([1, 2, 3])).toEqual([1, 2]);
      expect(R.init([1, 2])).toEqual([1]);
      expect(R.init([1])).toEqual([]);
      expect(R.init([])).toEqual([]);
    });
  });

  describe('R.isEmpty', () => {
    it('', () => {
      expect(R.isEmpty([1, 2, 3])).toBeFalsy(); // => false
      expect(R.isEmpty([])).toBeTruthy();       // => true;
      expect(R.isEmpty('')).toBeTruthy();       // => true
      expect(R.isEmpty('a')).toBeFalsy();         // => false
      expect(R.isEmpty(0)).toBeFalsy();         // => false
      expect(R.isEmpty(null)).toBeFalsy();      // => false
      expect(R.isEmpty({})).toBeTruthy();       // => true
      expect(R.isEmpty({length: 0})).toBeFalsy(); // => false
    });
  });

  describe('R.clone', () => {
    it('R.clone', () => {
      const expecter = {
        'SUMMARY': {
            'ERRORS': 11,
            'OUTPUT_PLANNED_QTY': 27,
            'SUCCESS': 16,
            'WARNS': 14,
            'REQUEST': 7,
            'RESPONSE': 7,
            'NOTIFY': 2,
        },
        'ERRORS': [
            {
                'MESSAGE': 'IF-IDのワークシートに要求MSGがありません',
                'COUNT': 1,
                'DETAILS': [
                    {
                        'COUNT': 3,
                        'IF_ID': 'JUIDV003',
                        'SENARIO_IF_ID_LIST': [
                            '02-N-0606_01_JUIDV003',
                            '02-N-0608_03_JUIDV003',
                            '02-N-0608_01_JUIDV003'
                        ]
                    }
                ],
            },
            {
                'MESSAGE': 'IF-IDのワークシートに応答MSGがありません',
                'COUNT': 1,
                'DETAILS': [
                    {
                        'COUNT': 2,
                        'IF_ID': 'JUIDV003',
                        'SENARIO_IF_ID_LIST': [
                            '02-N-0608_03_JUIDV003',
                            '02-N-0608_01_JUIDV003'
                        ]
                    }
                ],
            },
        ]
      };
      const result = R.clone(expecter);
      expect(result).not.toBe(expecter);
      expect(result).toEqual(expecter);
    });
  });

  describe('R.defaultTo', () => {
    const typeOf = (a) => Object.prototype.toString.call(a);
    const tester: [string, any, any][] = [
      ['value is null'     , null     , '[object Null]'],
      ['value is undefined', undefined, '[object Undefined]'],
      ['value is 0'        , 0        , 0],
      [`value is ''`       , ''       , ''],
      ['value != null'     , 'done'   , 'done'],
    ];
    tester.forEach(([desc, value, expecter]) => {
      it(desc, () => expect(R.defaultTo(typeOf(value), value)).toBe(expecter));
    });
  });

  describe('flatten', () => {
    it('flatten', () => {
      const test = [1, [2], [3, 4], 5, [[6]]];
      const result = test.reduce(flatten);
      expect(result).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('getNodeJson', () => {
    const obj = {
      result: {
        data: {
          reserve_info: {
            customer_info: [
              {
                uci: 'uci',
                payment_info: [
                  {
                    cabin_class: 'hoge'
                  }
                ]
              }
            ]
          }
        }
      }
    };
    // let val = obj['result']['data']['reserve_info']['customer_info'][0]['payment_info'][0]['cabin_class'];
    it('配列の検索値の一致', () => {
      const paths = ['result', 'data', 'reserve_info', 'customer_info'];
      expect(
        getNodeJson(paths, obj)
      ).toEqual(obj['result']['data']['reserve_info']['customer_info']);
    });
  });

  describe('findPathsJson', () => {
    it('findPathsJson オブジェクト値の検索', () => {
      const json = {
        a: 'aa1',
        b: 'bb1',
        c: 'ccc',
        d: 'dd1'
      };
      const result = findPathsJson((k, v) => /\w\w\d/.test(v))(json);
      expect(result).toEqual([
        ['a'], ['b'], ['d']
      ]);
    });
    it('配列値の検索', () => {
      const json = {
        'data': {
          'customer_list_count': 2,
          'customer_list': [
            {
              'linking_id': 'com_customer-[6]',
              'uci': 'com_customer-[1]',
              'st_tattoo_number': 'com_customer-[2]',
              'booking_reference': 'com_customer-[3]',
              'flight_date': '20170914'
            },
            {
              'linking_id': 'com_customer-[6]',
              'uci': 'com_customer-[1]',
              'st_tattoo_number': 'com_customer-[2]',
              'booking_reference': 'com_customer-[3]',
              'flight_date': '20170914',
            }
          ]
        }
      };
      const result = findPathsJson((k, v) => /com_\w+-\[\d+\]/.test(v))(json);
      expect(result).toEqual([
        ['data', 'customer_list', '0', 'linking_id'],
        ['data', 'customer_list', '0', 'uci'],
        ['data', 'customer_list', '0', 'st_tattoo_number'],
        ['data', 'customer_list', '0', 'booking_reference'],
        ['data', 'customer_list', '1', 'linking_id'],
        ['data', 'customer_list', '1', 'uci'],
        ['data', 'customer_list', '1', 'st_tattoo_number'],
        ['data', 'customer_list', '1', 'booking_reference'],
      ]);
    });
  });

  describe('setNodeJson', () => {
    it('配列を作成', () => {
      const json = {
        'body': {
          'data': {
            'customer_list_key': []
          }
        }
      };
      const paths = [ 'body', 'data', 'customer_list_key', '0' ];
      const result = setNodeJson([paths, 'aaa'])(json);
      expect(result).toEqual({
        'body': {
          'data': {
            'customer_list_key': [
              'aaa'
            ]
          }
        }
      });
    });
    it('オブジェクト配列を作成', () => {
      const json = {
        'body': {
          'data': {
            'customer_list_key': []
          }
        }
      };
      const paths = [ 'body', 'data', 'customer_list_key', '0' ];
      const result = setNodeJson([paths, { uci: 'test' }])(json);
      expect(result).toEqual({
        'body': {
          'data': {
            'customer_list_key': [
              {
                'uci': 'test'
              }
            ]
          }
        }
      });
      const paths2 = [ 'body', 'data', 'customer_list_key', '1', 'uci' ];
      const result2 = setNodeJson([R.init(paths2), {}], [paths2, 'test2'])(result);
      expect(result2).toEqual({
        'body': {
          'data': {
            'customer_list_key': [
              {
                'uci': 'test'
              },
              {
                'uci': 'test2'
              }
            ]
          }
        }
      });
    });
  });

  describe('match', () => {
    const matchers = [
      [/G\w{5}-\[\d+\]/, (gamenId) => '画面IDだよ'],
      ['test', (a) => a + ' is OK.'],
      [, () => 'The other case']
    ];
    it('Match equal', () => {
      const result = match(...matchers)('test');
      expect(result).toBe('test is OK.');
    });
    it('Match RegExp', () => {
      expect(match(...matchers)('GBD003-[3]')).toBe('画面IDだよ');
    });
    it('Match default', () => {
      expect(match(...matchers)('abc')).toBe('The other case');
    });
    it('multiply', () => {
      const fact = match(
        [0, () =>  1],
        [, (n) => n * fact(n - 1)]
      );
      expect(fact(4)).toBe(24);
    });
    const matchers2 = [
      [/G\w{5}-\[\d+\]/, (gamenId) => '画面IDだよ'],
      ['test', (a) => a + ' is OK.'],
    ];
    it('Match equal', () => {
      const result = match(...matchers2)('abc');
      expect(result).toBe('abc');
    });
  });

  describe('Tuple test', () => {
    it('tuple', () => {
      type T = [string, string, number];
      type U = [string, string];
      const data: U[] = [
        ['A', 'B'],
        ['C', 'D']
      ];
      // const t: T = ['A', 'B'].concat('C');
      expect(
        data.map(([t1, t2]): T => [t1, t2, 3])
      ).toEqual([
        ['A', 'B', 3],
        ['C', 'D', 3]
      ]);
    });
    it('tuple2', () => {
      const data = 'A,B';
      expect(
        (([d1, d2]) => [d1, d2, 3])(data.split(','))
      ).toEqual(['A', 'B', 3]);
    });
    it('tuple3 regular expression matched', () => {
      const [self, gamenId, data] = /(^G.+?),｛(.+)｝/.exec('GBD002,｛[2]:ALL｝') || [null, null, null];
      expect([self, gamenId, data]).toEqual(['GBD002,｛[2]:ALL｝', 'GBD002', '[2]:ALL']);
    });
    it('tuple3 regular expression unmatched', () => {
      const [self, gamenId, data] = /(^G.+?),｛(.+)｝/.exec('TEST') || [null, null, null];
      expect([self, gamenId, data]).toEqual([null, null, null]);
    });
  });

});

/* Template
describe('', () => {
  it('', () => {
    expect().to();
  });
});
*/
