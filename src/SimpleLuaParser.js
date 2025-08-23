import fs from "fs";

const CLASS_REGEX = /---@class\s+(?:\([^)]+\))?\s*(\w+)(?:\s*:\s*(\w+))?/;
const PARAM_REGEX = /---@param\s+(\w+)\s+([^\s]+)(?:\s+(.+))?/;
const RETURN_REGEX = /---@return\s+([^\s]+)(?:\s+(\w+))?(?:\s+(.+))?/;
const DESC_REGEX = /^---([^@].*)$/;
const FUNC_REGEX = /^function\s+([\w.]+)\s*\(([^)]*)\)/;

class ParserState {
  constructor() { this.reset(); }
  reset() {
    this.params = [];
    this.returns = null;
    this.description = null;
  }
}

export class SimpleLuaParser {
  parseFile(filePath) {
    return this.parse(fs.readFileSync(filePath, "utf8"));
  }

  parse(content) {
    const lines = content.split("\n");
    const state = new ParserState();
    const result = { classes: new Map(), functions: [] };

    lines.forEach((lineRaw, idx) => {
      const line = lineRaw.trim();
      const lineNo = idx + 1;

      if (CLASS_REGEX.test(line)) {
        const [, name, parent] = line.match(CLASS_REGEX);
        result.classes.set(name, { name, parent: parent || null, line: lineNo });
        return;
      }

      if (PARAM_REGEX.test(line)) {
        const [, name, type, desc] = line.match(PARAM_REGEX);
        state.params.push({ name, type, description: desc || null });
        return;
      }

      if (RETURN_REGEX.test(line)) {
        const [, type, name, desc] = line.match(RETURN_REGEX);
        state.returns = { type, name: name || null, description: desc || null };
        return;
      }

      if (DESC_REGEX.test(line)) {
        state.description = line.match(DESC_REGEX)[1].trim();
        return;
      }

      if (FUNC_REGEX.test(line)) {
        const [, name, rawParams] = line.match(FUNC_REGEX);
        result.functions.push({
          name,
          rawParams: rawParams.trim(),
          params: [...state.params],
          returns: state.returns,
          description: state.description,
          line: lineNo,
        });
        state.reset();
        return;
      }

      // reset annotations if it's a non-comment, non-function line
      if (!line.startsWith("---") && line !== "") state.reset();
    });

    return result;
  }
}
