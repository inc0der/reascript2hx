import camelcase from "camelcase";
import { determineType } from "./determineType.js"

export function createTypedefs (field, allTypes) {
  const { name, returns } = field;
  const structName = `Result${camelcase(name, { pascalCase: true })}`;

  const fields = returns.map(ret => {
    const type = determineType(allTypes, ret.type);
    const name = camelcase(ret.name) || `value${returns.indexOf(ret)}`;
    const optional = ret.type.includes("?") ? "?" : "";
    return `  ${optional}${name}:${type},`;
  }).join("\n");

  const typedef = `typedef ${structName} = {\n${fields}\n}`;
  return typedef;
}