function tokenize(value) {
  return String(value)
    .trim()
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map(token => token.toLowerCase());
}

function capitalize(token) {
  return token.charAt(0).toUpperCase() + token.slice(1);
}

export function enhancedCamelCase(str, _customStems = []) {
  const tokens = tokenize(str);
  if (tokens.length === 0) return "_";

  let result = tokens[0] + tokens.slice(1).map(capitalize).join("");
  if (/^\d/.test(result)) {
    result = `_${result}`;
  }
  return result;
}

export function enhancedPascalCase(str, customStems = []) {
  const result = enhancedCamelCase(str, customStems);
  return result.charAt(0).toUpperCase() + result.slice(1);
}
