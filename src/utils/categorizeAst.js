function categorizeAst (ast) {
  const length = ast.length;
  const categorizedAst = {
    reaper: [],
    gfx: [],
    imgui: [],
    other: [],
  };

  for (let i = length - 1; i >= 0; i--) {
    const field = ast[i];

    switch (field.namespace) {
      case "{reaper.array}":
        // do nothing
        break;
      case "reaper":
        if (field.name.includes('ImGui')) {
          categorizedAst.imgui.push(field);
        }
        categorizedAst.reaper.push(field);
        break;
      case "gfx":
        categorizedAst.gfx.push(field);
        break;
      default:
        categorizedAst.other.push(field);
        break;
    }
  }

  return categorizedAst;
}
exports.categorizeAst = categorizeAst;
