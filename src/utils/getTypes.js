import { traverseFields } from './traverseFields.js';

import camelcase from 'camelcase';

export function getTypes (ast) {
  const allFields = Object.values(ast).reduce((acc, item) => {
    if (item) {
      return acc.concat(Object.values(item));
    }
    return acc;
  }, []);

  let types = new Map();

  const commonTypesToExclude = ['function', 'integer', 'number', 'string', 'boolean'];

  traverseFields(allFields, (field) => {

    const { params, returns } = field;

    if (params) {
      for (const param of params) {
        if (!param.type || commonTypesToExclude.includes(param.type)) continue
        types.set(param.type, param.type)
      }
    }

    if (returns) {
      if (!returns.type || commonTypesToExclude.includes(returns.type)) {
        return
      }
      types.set(returns.type, returns.type)
    }
  });

  for (const [key, value] of types) {
    types.set(key, camelcase(value, { pascalCase: true }));
  }


  return types
}
