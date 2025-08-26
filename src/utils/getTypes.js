import { traverseFields } from './traverseFields.js';

import camelcase from 'camelcase';

function normalizeType(type) {
  if (!type) return null
  return type
    .split("|")[0]
    .trim()
}

export function getTypes(ast) {
  const allFields = Object.values(ast).reduce((acc, item) => {
    if (item) {
      return acc.concat(Object.values(item));
    }
    return acc;
  }, []);

  let types = new Map();
  const commonTypesToExclude = ['function', 'integer', 'number', 'string',
    'boolean', 'nil', 'any'];

  traverseFields(allFields, (field) => {
    const { params, returns } = field;

    if (params) {
      for (const param of params) {
        const raw = normalizeType(param.type);
        if (!raw || commonTypesToExclude.includes(raw.toLowerCase())) continue;
        types.set(raw, raw);
      }
    }

    if (returns) {
      const raw = normalizeType(returns.type);
      if (!raw || commonTypesToExclude.includes(raw.toLowerCase())) return;
      types.set(raw, raw);
    }
  })

  for (const [key, value] of types) {
    types.set(key, camelcase(value, { pascalCase: true }));
  }

  return types
}
