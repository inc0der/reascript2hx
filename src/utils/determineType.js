export function determineType(allTypes = [], type, name, onUnknownType = null) {
  if (type.includes("|")) {
    const types = type.split("|").map(t => t.trim());
    const isNullable = types.includes("nil");
    const valueTypes = isNullable ? types.filter(t => t !== "nil") : types;
    const convertedTypes = valueTypes.map(t => determineType(allTypes, t, name, onUnknownType));

    let result = convertedTypes[0];
    for (let i = 1; i < convertedTypes.length; i++) {
      result = `haxe.extern.EitherType<${result}, ${convertedTypes[i]}>`;
    }

    return isNullable ? `Null<${result}>` : result;
  }

  const isOptional = type.match(/\?/);
  if (isOptional) {
    type = type.replace("?", "");
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
  
      if (name && name === "function") {
        return "() -> Void";
      }

      if (type === "any") {
        return "Dynamic";
      }

      if (onUnknownType) {
        onUnknownType(type);
      }
      return "Dynamic";
  }
}
