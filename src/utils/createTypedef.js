import * as changeCase from 'change-case';
import { determineType } from './determineType.js'

export function createTypedefs (field, allTypes) {
  const { name, fieldType, returns } = field;
  const structName = `Result${changeCase.pascalCase(name)}`;

  const fields = returns.map(ret => {
    const type = determineType(allTypes, ret.type);
    const name = ret.name || `value${func.returns.indexOf(ret)}`;
    const optional = ret.type.includes('?') ? '?' : '';
    return `  ${optional}${name}:${type};`;
  }).join('\n');

  const typedef = `typedef ${structName} = {\n${fields}\n}`;
  return typedef;
}