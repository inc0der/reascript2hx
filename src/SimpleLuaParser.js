import fs from "fs";

const CLASS_REGEX = /---@class\s+(?:\([^)]+\))?\s*(\w+)(?:\s*:\s*(\w+))?/;
const FIELD_REGEX = /---@field\s+(\w+)\s+([^\s]+)(?:\s+(.+))?/;
const PARAM_REGEX = /---\s*@param\s+(.+)$/;
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

      if (CLASS_REGEX.test(line)) {
        const [, name] = line.match(CLASS_REGEX);
        currentClass = name;

        if (!result[currentClass]) {
          result[currentClass] = [];
        }
        return;
      }

      if (FIELD_REGEX.test(line) && currentClass) {
        const [, name, type, desc] = line.match(FIELD_REGEX);
        result[currentClass].push({
          name,
          fieldType: "variable",
          type: type,
          description: desc || null,
          line: lineNo
        });
        return;
      }

      if (PARAM_REGEX.test(line)) {
        const match = line.match(PARAM_REGEX);
        if (match) {
          const paramText = match[1].trim();
          
          const spaceIndex = paramText.indexOf(' ');
          if (spaceIndex === -1) return;
          
          const namepart = paramText.substring(0, spaceIndex);
          const typeAndDesc = paramText.substring(spaceIndex + 1);
          
          const isOptional = namepart.endsWith('?');
          const name = isOptional ? namepart.slice(0, -1) : namepart;
          
          const typeParts = typeAndDesc.trim().split(/\s+/);
          const type = typeParts[0];
          const description = typeParts.slice(1).join(' ') || null;
          
          state.params.push({ 
            name, 
            type, 
            isVarargs: name === '...',
            optional: isOptional,
            description 
          });
          return;
        }
      }

      if (RETURN_REGEX.test(line)) {
        const [, type, name, desc] = line.match(RETURN_REGEX);
        state.returns.push({
          type,
          name: name || null,
          description: desc || null
        });
        return;
      }

      if (DESC_REGEX.test(line)) {
        state.description = line.match(DESC_REGEX)[1].trim();
        return;
      }

      if (FUNC_REGEX.test(line)) {
        const [, fullName, rawParams] = line.match(FUNC_REGEX);

        const [className, ...rest] = fullName.split(".");
        const funcName = rest.join(".") || fullName;

        if (!result[className]) {
          result[className] = [];
        }

        result[className].push({
          fieldType: "function",
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

      if (!line.startsWith("---") && line !== "") {
        state.reset();
      }
    });

    return result;
  }
}
