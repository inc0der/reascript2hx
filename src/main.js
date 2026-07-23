import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SimpleLuaParser } from "./SimpleLuaParser.js";
import { getTypes } from "./utils/getTypes.js";
import { traverseFields } from "./utils/traverseFields.js";
import { createHaxeFunction } from "./utils/createHaxeFunction.js";
import { createHaxeVariable } from "./utils/createHaxeVariable.js";
import { createMultiReturnsClass } from "./utils/createMultiReturnsClass.js";
import { enhancedCamelCase, enhancedPascalCase } from "./utils/enhancedCamelCase.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const defaultOptions = {
  reaperPath: path.join(projectRoot, "resources", "Sexan_reaper_defs.lua"),
  imguiPath: path.join(projectRoot, "resources", "imgui_defs_0.9.lua"),
  outputDir: path.resolve(process.cwd(), "dist"),
  packageName: "reaper"
};

function createExternClass(nativeName, className, functions, packageName) {
  return `package ${packageName};\n\nusing ${packageName}.Types;\n\n@:native("${nativeName}")\nextern class ${className} {\n${functions.join("\n")}\n}`;
}

function recordIdentifier(registry, generatedName, nativeName, context) {
  const previous = registry.get(generatedName);
  if (previous) {
    throw new Error(
      `Haxe identifier collision in ${context}: "${previous}" and "${nativeName}" both generate "${generatedName}"`
    );
  }
  registry.set(generatedName, nativeName);
}

function recordTypeDiagnostic(diagnostics, type, context, location) {
  const key = `${type}|${context}|${location}`;
  if (!diagnostics.some(diagnostic => diagnostic.key === key)) {
    diagnostics.push({ key, type, context, location });
  }
}

function addFields(fields, types, functions, typedefs, options = {}) {
  const { className, typeNames, diagnostics, skipDuplicate = false } = options;
  const memberNames = new Map();
  const reportUnknownType = (fieldName) => (type, location) => {
    recordTypeDiagnostic(diagnostics, type, `${className}.${fieldName}`, location);
  };

  traverseFields(fields || [], (field) => {
    if (field.fieldType === "function") {
      if (skipDuplicate && field.name === "GetMediaItem_Track") {
        // GetMediaItem_Track is the same as GetMediaItemTrack after name conversion.
        return;
      }
      recordIdentifier(memberNames, enhancedCamelCase(field.name), field.name, className);
      if (field.returns.length > 1) {
        recordIdentifier(typeNames, enhancedPascalCase(field.name) + "Returns", field.name, "Types");
        typedefs.push(createMultiReturnsClass(field, types, reportUnknownType(field.name)));
      }
      functions.push(createHaxeFunction(field, types, reportUnknownType(field.name)));
    } else if (field.fieldType === "variable") {
      recordIdentifier(memberNames, enhancedCamelCase(field.name), field.name, className);
      functions.push(createHaxeVariable(field, types, reportUnknownType(field.name)));
    }
  });
}

export function generateExterns(options = {}) {
  const settings = { ...defaultOptions, ...options };
  const parser = new SimpleLuaParser();
  const reaperTree = parser.parseFile(settings.reaperPath);
  const imguiTree = parser.parseFile(settings.imguiPath);
  const types = getTypes({ ...reaperTree, ...imguiTree });
  const gfxFunctions = [];
  const reaperFunctions = [];
  const imguiFunctions = [];
  const reaperTypes = [];
  const typedefs = [];
  const typeNames = new Map();
  const diagnostics = [];

  for (const [key, value] of types) {
    if (key !== "reaper_array") {
      recordIdentifier(typeNames, value, key, "Types");
    }
  }

  addFields(reaperTree.gfx, types, gfxFunctions, typedefs, {
    className: "Graphics",
    typeNames,
    diagnostics
  });
  addFields(reaperTree.reaper, types, reaperFunctions, typedefs, {
    className: "Reaper",
    typeNames,
    diagnostics,
    skipDuplicate: true
  });
  addFields(imguiTree.ImGui, types, imguiFunctions, typedefs, {
    className: "ImGui",
    typeNames,
    diagnostics
  });

  for (const [key, value] of types) {
    if (key === "reaper_array") {
      // reaper.array already exists as a runtime type.
      continue;
    }
    reaperTypes.push(`extern class ${value} {}`);
  }
  reaperTypes.push("typedef UserData = Dynamic;");

  const reaperClass = createExternClass("reaper", "Reaper", reaperFunctions, settings.packageName);
  const graphicsClass = createExternClass("gfx", "Graphics", gfxFunctions, settings.packageName);
  const imguiClass = createExternClass("reaper", "ImGui", imguiFunctions, settings.packageName);
  const typesClass = `package ${settings.packageName};\n\n${reaperTypes.concat(typedefs).join("\n")}\n`;
  const files = {
    Reaper: reaperClass,
    Graphics: graphicsClass,
    ImGui: imguiClass,
    Types: typesClass
  };

  fs.mkdirSync(settings.outputDir, { recursive: true });
  for (const [name, contents] of Object.entries(files)) {
    fs.writeFileSync(path.join(settings.outputDir, `${name}.hx`), contents, "utf8");
  }

  for (const diagnostic of diagnostics) {
    const message = `Unknown type "${diagnostic.type}" in ${diagnostic.context} ${diagnostic.location}; generated as Dynamic.`;
    if (settings.onDiagnostic) {
      settings.onDiagnostic({ ...diagnostic, message });
    } else {
      console.warn(`Warning: ${message}`);
    }
  }

  return files;
}

function requireValue(args, index, option) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${option} requires a value`);
  }
  return value;
}

export function parseCliArgs(args = process.argv.slice(2)) {
  const options = {};

  for (let index = 0; index < args.length; index++) {
    const option = args[index];
    if (option === "--help" || option === "-h") {
      return { help: true };
    }
    if (option === "--reaper") {
      options.reaperPath = path.resolve(requireValue(args, index, option));
      index++;
    } else if (option === "--imgui") {
      options.imguiPath = path.resolve(requireValue(args, index, option));
      index++;
    } else if (option === "--output") {
      options.outputDir = path.resolve(requireValue(args, index, option));
      index++;
    } else if (option === "--package") {
      options.packageName = requireValue(args, index, option);
      index++;
    } else {
      throw new Error(`Unknown option: ${option}`);
    }
  }

  return options;
}

export const cliHelp = `Usage: node src/main.js [options]

Options:
  --reaper <file>    ReaScript/Reaper Lua definitions
  --imgui <file>     ImGui Lua definitions
  --output <dir>     Generated Haxe output directory
  --package <name>   Haxe package name (default: reaper)
  -h, --help         Show this help
`;

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  try {
    const options = parseCliArgs();
    if (options.help) {
      console.log(cliHelp);
    } else {
      generateExterns(options);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(`\n${cliHelp}`);
    process.exitCode = 1;
  }
}
