import { determineType } from  "./determineType.js";
import { enhancedCamelCase } from "./enhancedCamelCase.js";

export function createHaxeVariable(field, allTypes, reportUnknownType = () => {}) {
    const type = field.type;
    const typeName = determineType(
        allTypes,
        type,
        field.name,
        unknownType => reportUnknownType(unknownType, "variable")
    ) || type;
    const description = field.description ? `\n\t/** ${field.description} */` : "";
    
    // Create the Haxe variable definition
    return `${description}\npublic static var ${enhancedCamelCase(field.name)}: ${typeName};`;
}
