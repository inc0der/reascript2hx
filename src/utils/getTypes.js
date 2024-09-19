import { traverseFields } from './traverseFields.js';

import camelcase from 'camelcase';

export function getTypes (ast) {
  const { reaper, gfx, imgui, other } = ast;

  let types = new Map();

  const commonTypesToExclude = ['integer', 'number', 'string', 'boolean'];

  traverseFields(reaper, (field) => {

    if (field.params) {
      for (const param of field.params) {
        if (!param.type || commonTypesToExclude.includes(param.type)) continue
        types.set(param.type, param.type)
      }
    }

    if (field.returns) {
      for (const ret of field.returns) {
        if (!ret.type || commonTypesToExclude.includes(ret.type)) continue
        types.set(ret.type, ret.type)
      }
    }
  });

  traverseFields(gfx, (field) => {
    if (field.params) {
      for (const param of field.params) {
        if (!param.type || commonTypesToExclude.includes(param.type)) continue
        types.set(param.type, param.type)
      }
    }

    if (field.returns) {
      for (const ret of field.returns) {
        if (!ret.type || commonTypesToExclude.includes(ret.type)) continue
        types.set(ret.type, ret.type)
      }
    }
  });

  for (const [key, value] of types) {
    types.set(key, camelcase(value, { pascalCase: true }));
  }


  return types
}
