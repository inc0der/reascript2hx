import fs from "fs";

const CLASS_REGEX = /---@class\s+(?:\([^)]+\))?\s*(\w+)(?:\s*:\s*(\w+))?/;
const FIELD_REGEX = /---@field\s+(\w+)\s+([^\s]+)(?:\s+(.+))?/;
const PARAM_REGEX = /---@param\s+(\w+)\s+([^\s]+)(?:\s+(.+))?/;
const RETURN_REGEX = /---\s*@return\s+([^\s]+)(?:\s+(.+))?/;
const DESC_REGEX = /^---([^@].*)$/;
const FUNC_REGEX = /^function\s+([\w.]+)\s*\(([^)]*)\)/;

class ParserState {
  constructor() { this.reset(); }
  reset() {
    this.params = [];
    this.returns = [];
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
    const result = { };
    let currentClass = null;

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();
      const lineNo = idx + 1;

      // Handle @class
      if (CLASS_REGEX.test(line)) {
        const [, name] = line.match(CLASS_REGEX);
        currentClass = name;

        if (!result[currentClass]) {
          result[currentClass] = [];
        }
        return;
      }

      // Handle @field
      if (FIELD_REGEX.test(line) && currentClass) {
        const [, name, type, desc] = line.match(FIELD_REGEX);
        result[currentClass].push({
          name,
          type: "variable",
          type: type,
          description: desc || null,
          line: lineNo
        });
        return;
      }

      // Handle @param
      if (PARAM_REGEX.test(line)) {
        const [, name, type, desc] = line.match(PARAM_REGEX);
        state.params.push({ name, type, description: desc || null });
        return;
      }

      // Handle @return
      if (RETURN_REGEX.test(line)) {
        const [, type, name, desc] = line.match(RETURN_REGEX);
        state.returns.push({
          type,
          name: name || null,
          description: desc || null
        });
        return;
      }

      // Handle description
      if (DESC_REGEX.test(line)) {
        state.description = line.match(DESC_REGEX)[1].trim();
        return;
      }

      // Handle functions
      if (FUNC_REGEX.test(line)) {
        const [, fullName, rawParams] = line.match(FUNC_REGEX);

        // Split into class + method
        const [className, ...rest] = fullName.split(".");
        const funcName = rest.join(".") || fullName;

        if (!result[className]) {
          result[className] = [];
        }

        result[className].push({
          type: "function",
          name: funcName,
          params: [...state.params],
          returns: [...state.returns],
          description: state.description,
          rawParams: rawParams.trim(),
          line: lineNo
        });

        state.reset();
        currentClass = null;
        return;
      }

      // Reset state on unrelated lines
      if (!line.startsWith("---") && line !== "") {
        state.reset();
      }
    });

    return result;
  }
}
