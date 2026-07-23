import { traverseFields } from "./traverseFields.js";

import camelcase from "camelcase";

function normalizeTypes(type) {
  if (!type) return [];
  return type
    .split("|")
    .map(value => value.trim().replace(/\?$/, ""))
    .filter(value => /^[A-Za-z_][A-Za-z0-9_]*$/.test(value));
}

export function getTypes(ast) {
  const allFields = Object.values(ast).reduce((acc, item) => {
    if (item) {
      return acc.concat(Object.values(item));
    }
    return acc;
  }, []);

  let types = new Map();
  const commonTypesToExclude = ["function", "integer", "number", "string",
    "boolean", "nil", "any"];

  traverseFields(allFields, (field) => {
    const { params, returns } = field;

    if (params) {
      for (const param of params) {
        for (const raw of normalizeTypes(param.type)) {
          if (commonTypesToExclude.includes(raw.toLowerCase())) continue;
          types.set(raw, raw);
        }
      }
    }

    if (returns) {
      for (const returnValue of returns) {
        for (const raw of normalizeTypes(returnValue.type)) {
          if (commonTypesToExclude.includes(raw.toLowerCase())) continue;
          types.set(raw, raw);
        }
      }
    }
  })

  for (const [key, value] of types) {
    types.set(key, camelcase(value, { pascalCase: true }));
  }

  return types
}
