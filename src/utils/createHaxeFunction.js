import { commonBoolTypes } from "./commonBoolTypes.js";
import { commonIntTypes } from "./commonIntTypes.js";
import { commonStringTypes } from "./commonStringTypes.js";
import { formatAsMultilineComment } from "./formatAsMultilineComment.js";
import camelcase from "camelcase";
import { enhancedCamelCase } from "./enhancedCamelCase.js";

function determineType (allTypes = [], type, name) {
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
        return allTypes.get(type);
      }
      if (name && commonIntTypes.includes(name)) {
        return "Float";
      }

      if (name && commonStringTypes.includes(name)) {
        return "String";
      }

      if (name && commonBoolTypes.includes(name)) {
        return "Bool";
      }

      if (name && name === "function") {
        return "() -> Void";
      }

      return "Dynamic";
  }
}

export function createHaxeFunction (field, allTypes) {
  const { description, name, namespace, params, returns } = field;

  let functionSignature = camelcase(name);

  if (params) {
    const paramStrings = [];
    for (const param of params) {
      const type = determineType(allTypes, param.type, param.name) || "Dynamic";
      const optionalString = param.optional ? "?" : "";
      paramStrings.push(`${optionalString}${enhancedCamelCase(param.name)}: ${type}`);
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

  const comment = formatAsMultilineComment(description)
  const functionDefinition = `${comment}\n@:native("${name}")\npublic static function ${functionSignature};`;

  return functionDefinition;
}
