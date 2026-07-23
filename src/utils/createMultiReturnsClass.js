import { determineType } from "./determineType.js";
import { enhancedCamelCase, enhancedPascalCase } from "./enhancedCamelCase.js";

export function createMultiReturnsClass(field, allTypes) {
  const { name, returns } = field;
  const structName = `${enhancedPascalCase(name)}Returns`;
  const seen = {};
  
  const fields = returns.map((ret, i) => {
    const type = determineType(allTypes, ret.type);
    let baseName = ret.name ? enhancedCamelCase(ret.name) : `value${i}`;
    
    if (seen[baseName]) {
      seen[baseName]++;
      baseName = `${baseName}${seen[baseName]}`;
    } else {
      seen[baseName] = 1;
    }
    
    return `  var ${baseName}:${type};`;
  }).join("\n");
  

  const typedef = `@:multiReturn extern class ${structName} {\n${fields}\n}`;
  
  return typedef;
}
