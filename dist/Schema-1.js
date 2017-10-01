"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// const Ajv = require("ajv");
const Ajv = require("ajv");
const MyUtils_1 = require("./MyUtils");
const ajv = new Ajv();
const s1 = {
    type: "object",
    oneOf: [
        {
            properties: {
                foo: { type: "string" },
            },
            required: ["foo"],
            additionalProperties: false,
        },
        {
            properties: {
                bar: { type: "integer" },
            },
            required: ["bar"],
            additionalProperties: false,
        },
    ],
};
const data = {
    foo: 2,
};
exports.main = (value) => {
    const data2 = MyUtils_1.setNodeJson(['foo'], value)(data);
    const validate = ajv.compile(s1);
    return MyUtils_1.Maybe.of(data2)
        .map(validate)
        .getOrElse((() => {
        // Error handler
        // console.log(validate.errors);
        return false;
    })());
};
