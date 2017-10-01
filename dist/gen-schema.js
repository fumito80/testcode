'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const metaScheam = require('./node_modules/ajv/lib/refs/json-schema-draft-04.json');
const fs = require("fs");
const genSchema = require("generate-schema");
const Ajv = require("ajv");
const yaml = require("js-yaml");
// import * as R from 'ramda';
const libUtils_1 = require("./libUtils");
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
const pathsTypeObject = libUtils_1.findPathsJson((k, v) => k === 'type' && v === 'object')(baseSchema);
const modifiedSchema = pathsTypeObject.reduce((memo, path) => {
    const pathInit = libUtils_1.R.init(path);
    const required = Object.keys(libUtils_1.getNodeJson([...pathInit, 'properties'], memo));
    return libUtils_1.setNodeJson([[...pathInit, 'additionalProperties'], false], [[...pathInit, 'required'], required])(memo);
}, baseSchema);
const customSchema = JSON.parse(fs.readFileSync('./spec/customSchema.json', 'utf8'));
const mySchema = libUtils_1.R.mergeDeepRight(modifiedSchema, customSchema);
fs.writeFileSync('./schema2.json', JSON.stringify(mySchema, null, '  '));
const ajv = new Ajv();
ajv.addMetaSchema(metaScheam);
ajv.addSchema(mySchema, 'mySchema');
const valid = ajv.validate('mySchema', json);
if (!valid) {
    console.log(ajv.errorsText());
}
