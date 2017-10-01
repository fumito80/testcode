// const Ajv = require("ajv");
import * as Ajv from "ajv";

import {
  setNodeJson,
  Maybe,
} from './MyUtils';

const ajv = new Ajv();

const s1 = {
  type: "object",
  oneOf: [
    {
      properties: {
        foo: { type: "string" },
      },
      required: [ "foo" ],
      additionalProperties: false,
    },
    {
      properties: {
        bar: { type: "integer" },
      },
      required: [ "bar" ],
      additionalProperties: false,
    },
  ],
};

const data = {
  foo: 2,
};

export const main = (value) => {
  const data2 = setNodeJson(['foo'], value)(data);
  const validate = ajv.compile(s1);

  return Maybe.of(data2)
    .map(validate)
    .getOrElse((() => {
      // Error handler
      // console.log(validate.errors);
      return false;
    })());
}
