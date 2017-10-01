'use strict';

const metaScheam = require('./node_modules/ajv/lib/refs/json-schema-draft-04.json');

import * as fs from 'fs';
import * as genSchema from 'generate-schema';
import * as Ajv from 'ajv';
import * as yaml from 'js-yaml';

// import * as R from 'ramda';

import {
  R,
  getNodeJson,
  findPathsJson,
  setNodeJson,
} from './libUtils';

const syaml = `
aaa: aaa
bbb: abc
ccc: 0
ddd: 1
eee:
  - F
  - J
fff:
  - 1
  - 2
ggg:
  - a
hhh:
  - 1
iii:
  - name: a
    val1: 1
  - name: b
    val1: 1
`;

const json = yaml.load(syaml);

const baseSchema = genSchema.json(json);

const pathsTypeObject = findPathsJson((k, v) => k === 'type' && v === 'object')(baseSchema);

const modifiedSchema = pathsTypeObject.reduce((memo, path) => {
  const pathInit = R.init(path);
  const required = Object.keys(getNodeJson([...pathInit, 'properties'], memo));
  return setNodeJson(
    [[...pathInit, 'additionalProperties'], false],
    [[...pathInit, 'required'], required],
  )(memo);
}, baseSchema);

const customSchema = JSON.parse(fs.readFileSync('./spec/customSchema.json', 'utf8'));

const mySchema = R.mergeDeepRight(modifiedSchema, customSchema);

fs.writeFileSync('./schema2.json', JSON.stringify(mySchema, null, '  '));

const ajv = new Ajv();
ajv.addMetaSchema(metaScheam);

ajv.addSchema(mySchema, 'mySchema');
const valid = ajv.validate('mySchema', json);
if (!valid) {
  console.log(ajv.errorsText());
}
