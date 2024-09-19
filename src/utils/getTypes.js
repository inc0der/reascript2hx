const { traverseFields } = require('./traverseFields');

function getTypes (ast) {
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
    const capitalizedFirstLetter = key[0].toUpperCase();
    let sanitizedValue = capitalizedFirstLetter + key.slice(1).replace(/\s+/g, '');
    types.set(key, sanitizedValue);
  }


  return types
}


exports.getTypes = getTypes