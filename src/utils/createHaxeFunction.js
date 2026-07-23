import { formatAsMultilineComment } from "./formatAsMultilineComment.js";
import { enhancedCamelCase, enhancedPascalCase } from "./enhancedCamelCase.js";
import { haxeReservedKeywords } from "./haxeReserved.js";
import { determineType } from "./determineType.js";


export function createHaxeFunction (field, allTypes) {
  const { description, name, params, returns } = field;

  let functionSignature = enhancedCamelCase(name);

  if (params) {
    const paramStrings = [];
    for (const param of params) {
      const { isVarargs } = param;
      const haxeType = determineType(allTypes, param.type, param.name) || "Dynamic";
      const optionalString = param.optional ? "?" : "";

      if (haxeReservedKeywords[param.name]) {
        paramStrings.push(`${optionalString}${haxeReservedKeywords[param.name]}: ${haxeType}`);
      } else if (isVarargs) {
        paramStrings.push(`...args:Array<${haxeType}>`);
      } else {
        paramStrings.push(`${optionalString}${enhancedCamelCase(param.name)}: ${haxeType}`);
      }
    }
    functionSignature += "(" + paramStrings.join(", ") + ")";
  } else {
    functionSignature += "()";
  }

  if (!returns || returns.length <= 0) {
    functionSignature += ": Void";
  }

  if (returns.length === 1) {
    functionSignature += ": " + determineType(allTypes, returns[0].type);
 } else if (returns.length > 1) {
    const pascalName = enhancedPascalCase(name);
    const structName = `${pascalName}Returns`;
    functionSignature += `: ${structName}`;
 }

  const comment = formatAsMultilineComment(description)
  const functionDefinition = `${comment}\n@:native("${name}")\npublic static function ${functionSignature};`;

  return functionDefinition;
}
