export function determineType(allTypes = [], type, name) {
  if (type.includes("|")) {
    const types = type.split("|").map(t => t.trim());
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

      return "Dynamic";
  }
}