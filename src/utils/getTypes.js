const { traverseFields } = require('./traverseFields');

function getTypes(ast) {
  const { reaper, gfx, imgui, other } = ast;

  const types = new Map();

  traverseFields(reaper, (field) => {

    if (field.params) {
      for (const param of field.params) {
         if (!param.type) continue
        types.set(param.type, param.type)
      }
    }

    if (field.returns) {
      for (const ret of field.returns) {
         if (!ret.type) continue
        types.set(ret.type, ret.type)
      }
    }
  });

  traverseFields(gfx, (field) => {
    if (field.params) {
      for (const param of field.params) {
        if (!param.type) continue
        types.set(param.type, param.type)
      }
    }

    if (field.returns) {
      for (const ret of field.returns) {
        if (!ret.type) continue
        types.set(ret.type, ret.type)
      }
    }
  });

  return types
}


exports.getTypes = getTypes