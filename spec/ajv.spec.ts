'use strict';

import * as fs from "fs";
import * as Ajv from "ajv";

const ajv = new Ajv();
ajv.addMetaSchema(require('../node_modules/ajv/lib/refs/json-schema-draft-04.json'));

const schema = JSON.parse(fs.readFileSync('./spec/schema1.json', 'utf8'));

const data = {
  "aaa": "aaa",
  "bbb": "abc",
  "ccc": 0,
  "ddd": 1,
  "eee": [
    "F",
    "X"
  ],
  "fff": [
    1,
    2
  ],
  "ggg": [
    "a"
  ],
  "hhh": [
    1
  ],
  "iii": [
    {
      "name": "a",
      "x": 0
    },
    {
      "name": "b",
      "x": 1
    },
    {
      "name": "a",
      "x": 1
    }
  ]
};

test('validation', () => {
  // const validate = ajv.compile(schema);
  ajv.addSchema(schema, 'mySchema');
  var valid = ajv.validate('mySchema', data);
  if (!valid) {
    console.log(ajv.errorsText());
  }
  // console.log(validate);
});
