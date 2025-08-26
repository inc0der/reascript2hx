import fs from "fs";

import { SimpleLuaParser } from "./SimpleLuaParser.js";
import { getTypes } from "./utils/getTypes.js";
import { traverseFields } from "./utils/traverseFields.js";
import { createHaxeFunction } from "./utils/createHaxeFunction.js";
import { createHaxeVariable } from "./utils/createHaxeVariable.js";
import { createTypedefs } from "./utils/createTypedef.js";


const gfxFunctions = [];
const reaperFunctions = [];
const imguiFunctions = [];
const reaperTypes = [];
const typedefs = [];

const parser = new SimpleLuaParser();
const reaperTree = parser.parseFile("resources/Sexan_reaper_defs.lua", "utf8");
const imguiTree = parser.parseFile("resources/imgui_defs_0.9.lua", "utf8");
const types = getTypes({ ...reaperTree, ...imguiTree });

traverseFields(reaperTree.gfx, (field) => {
  if (field.fieldType === "function") {
    if (field.returns.length > 1) {
      typedefs.push(createTypedefs(field, types));
    }
    gfxFunctions.push(createHaxeFunction(field, types));
  } else if (field.fieldType === "variable") {
    gfxFunctions.push(createHaxeVariable(field, types));
  }
});

traverseFields(reaperTree.reaper, (field) => {
  if (field.fieldType === "function") {
    if (field.name === "GetMediaItem_Track") {
      // GetMediaItem_Track is the same as GetMediaItemTrack so we skip it
      // This is a workaround for duplicate externs since we convert to snakeCase.
      return;
    }
    if (field.returns.length > 1) {
      typedefs.push(createTypedefs(field, types));
    }
    reaperFunctions.push(createHaxeFunction(field, types));
  } else if (field.fieldType === "variable") {
    reaperFunctions.push(createHaxeVariable(field, types));
  }
});


traverseFields(imguiTree.ImGui, (field) => {
  if (field.fieldType === "function") {
    if (field.returns.length > 1) {
      typedefs.push(createTypedefs(field, types));
    }
    imguiFunctions.push(createHaxeFunction(field, types));
  } else if (field.fieldType === "variable") {
    imguiFunctions.push(createHaxeVariable(field, types));
  }
});


for (let [key, value] of types) {
  if (key === "reaper_array") {
    // we skip reaper_array because reaper.array already exists as a type
    continue
  }
  reaperTypes.push(`extern class ${value} {}`);
}

reaperTypes;


function createExternClass(nativeName, className, functions) {
  return `package reaper;\n\nimport reaper.Types;\n\n@:native("${nativeName}")\nextern class ${className} {\n${functions.join("\n")}\n}`;
}

const reaperClass = createExternClass("reaper", "Reaper", reaperFunctions);
const graphicsClass = createExternClass("gfx", "Graphics", gfxFunctions);
const imguiClass = createExternClass("reaper", "ImGui", imguiFunctions);
const typesClass = "package reaper;\n\n" + reaperTypes.concat(typedefs).join("\n") + "\n";

// // write to file
fs.writeFileSync("dist/Reaper.hx", reaperClass);
fs.writeFileSync("dist/Graphics.hx", graphicsClass);
fs.writeFileSync("dist/ImGui.hx", imguiClass);
fs.writeFileSync("dist/Types.hx", typesClass);
