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

  if (params) {
    const paramStrings = [];
    for (const param of params) {
      const type = determineType(allTypes, param.type, param.name) || "Dynamic";
      const optionalString = param.optional ? "?" : "";
      paramStrings.push(`${optionalString}${param.name}: ${type}`);
    }
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

  const functionDefinition = `public static function ${functionSignature};`;

  return functionDefinition;
}

exports.createHaxeFunction = createHaxeFunction;
