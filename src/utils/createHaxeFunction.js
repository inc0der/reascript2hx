import { commonBoolTypes } from "./commonBoolTypes.js";
import { commonIntTypes } from "./commonIntTypes.js";
import { commonStringTypes } from "./commonStringTypes.js";
import { formatAsMultilineComment } from "./formatAsMultilineComment.js";
import camelcase from "camelcase";
import { enhancedCamelCase } from "./enhancedCamelCase.js";
import { haxeReservedKeywords } from "./haxeReserved.js";

function determineType(allTypes = [], type, name) {
  if (type.includes('|')) {
    const types = type.split('|').map(t => t.trim());
    const convertedTypes = types.map(t => determineType(allTypes, t, name));
    
    if (convertedTypes.length === 2) {
      return `haxe.extern.EitherType<${convertedTypes[0]}, ${convertedTypes[1]}>`;
    }
    
    let result = convertedTypes[0];
    for (let i = 1; i < convertedTypes.length; i++) {
      result = `haxe.extern.EitherType<${result}, ${convertedTypes[i]}>`;
    }
    return result;
  }

  // NOTE: Handle special case ( ReaProject|nil|0 ) assuming 0 is an int?
  if (!isNaN(type)) {
    return "Int";
  }

  switch (type) {
    case "integer":
      return "Int";
    case "number":
      return "Float";
    case "boolean":
      return "Bool";
    case "string":
      return "String";
    case "nil":
      return "Void";

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
  const { description, name, params, returns } = field;

  let functionSignature = camelcase(name);

  if (params) {
    const paramStrings = [];
    for (const param of params) {
      const { type, optional } = param;
      const haxeType = determineType(allTypes, param.type, param.name) || "Dynamic";
      const optionalString = param.optional ? "?" : "";

      if (haxeReservedKeywords[param.name]) {
        paramStrings.push(`${optionalString}${haxeReservedKeywords[param.name]}: ${haxeType}`);
      } else {
        paramStrings.push(`${optionalString}${enhancedCamelCase(param.name)}: ${haxeType}`);
      }
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
