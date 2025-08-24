import fs from 'fs';

import { SimpleLuaParser } from './SimpleLuaParser.js';
import { getTypes } from './utils/getTypes.js';
import { traverseFields } from './utils/traverseFields.js';
import { createHaxeFunction } from './utils/createHaxeFunction.js';


const gfxFunctions = [];
const reaperFunctions = [];
const imguiFunctions = [];
const reaperTypes = [];

const parser = new SimpleLuaParser();
const reaperTree = parser.parseFile("resources/Sexan_reaper_defs.lua", "utf8");
const imguiTree = parser.parseFile("resources/imgui_defs_0.9.lua", "utf8");
const types = getTypes(reaperTree);

traverseFields(reaperTree.gfx, (field) => {
  if (field.type === 'function') {
    gfxFunctions.push(createHaxeFunction(field, types));
  } else if (field.type === 'variable') {
    // We need to create the haxe variable definition
    // gfxVariables.push(createHaxeVariable(field, types));
  }
});

traverseFields(reaperTree.reaper, (field) => {
  if (field.type === 'function') {
    reaperFunctions.push(createHaxeFunction(field, types));
  } else if (field.type === 'variable') {
    // We need to create the haxe variable definition
    // reaperVariables.push(createHaxeVariable(field, types));
  }
});


traverseFields(imguiTree.ImGui, (field) => {
  if (field.type === 'function') {
    imguiFunctions.push(createHaxeFunction(field, types));
  } else if (field.type === 'variable') {
    // We need to create the haxe variable definition
    // imguiVariables.push(createHaxeVariable(field, types));
  }
});


for (let [key, value] of types) {
  if (key === 'reaper_array') {
    // we skip reaper_array because reaper.array already exists as a type
    continue
  }
  reaperTypes.push(`extern class ${value} {}`);
}


function createExternClass(nativeName, className, functions) {
  return `package reaper;\n\nimport Types;\n\n@:native("${nativeName}")\nextern class ${className} {\n${functions.join('\n')}\n}`;
}

const reaperClass = createExternClass('reaper', 'Reaper', reaperFunctions);
const graphicsClass = createExternClass('gfx', 'Graphics', gfxFunctions);
const imguiClass = createExternClass('reaper', 'ImGui', imguiFunctions);
const typesClass = 'package reaper;\n\n' + reaperTypes.join('\n') + '\n';

// // write to file
fs.writeFileSync('dist/Reaper.hx', reaperClass);
fs.writeFileSync('dist/Graphics.hx', graphicsClass);
fs.writeFileSync('dist/ImGui.hx', imguiClass);
fs.writeFileSync('dist/Types.hx', typesClass);
