const { commonIntTypes } = require("./commonIntTypes");
const { commonStringTypes } = require("./commonStringTypes");

function determineType(allTypes = [], type, name) {
  switch (type) {
    case "integer":
      return "Int";
    case "number":
      return "Float";
    case "boolean":
      return "Bool";
    case "string":
      return "String";
    default:
      if (allTypes.has(type)) {
        return type;
      }
      if (name && commonIntTypes.includes(name)) {
        return "Float";
      }

      if (name && commonStringTypes.includes(name)) {
        return "String";
      }

      if (name && name === "function") {
        return "() -> Void";
      }

      return "Dynamic";
  }
}

function createHaxeFunction(field, allTypes) {
  const { description, name, namespace, params, returns } = field;

  let functionSignature = name;

  if (name === 'GetCursorContext') {
    console.log('here')
  }

  if (params) {
    const paramStrings = params.map(
      (param) =>
        `${param.name}: ${
          determineType(allTypes, param.type, param.name) || "Dynamic"
        }`
    );
    functionSignature += "(" + paramStrings.join(", ") + ")";
  } else {
    functionSignature += "()";
  }

  if (returns) {
    if (returns.length > 0) {
      functionSignature += ": " + determineType(allTypes, returns[0].type); // Assuming only one return type
    }
  } else {
    functionSignature += ": Void";
  }

  const functionDefinition = `public static function ${functionSignature}`;

  return functionDefinition;
}

exports.createHaxeFunction = createHaxeFunction;
