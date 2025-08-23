import fs from 'fs';
import { parser } from 'reascriptluaparser';
import { traverseFields } from './utils/traverseFields.js';
import { categorizeAst } from './utils/categorizeAst.js';
import { getTypes } from './utils/getTypes.js';
import { createHaxeFunction } from './utils/createHaxeFunction.js';

const input = fs.readFileSync("reascripthelp.html", "utf8");
const ast = parser(input);
const categorized = categorizeAst(ast);

const { reaper, gfx, other, imgui } = categorized;


const types = getTypes(categorized)

const reaperFunctions = [];
traverseFields(reaper, (field) => {
  if (field.name.includes('ImGui')) {
    return
  }
  reaperFunctions.push(createHaxeFunction(field, types));
});

const gfxFunctions = [];
traverseFields(gfx, (field) => {
  if (field.name.includes('ImGui')) {
    return
  }
  gfxFunctions.push(createHaxeFunction(field, types));
});

const imguiFunctions = [];
traverseFields(imgui, (field) => {
  imguiFunctions.push(createHaxeFunction(field, types));
});


const reaperTypes = [];

for (let [key, value] of types) {
  if (key === 'reaper_array') {
    // we skip reaper_array because reaper.array already exists as a type
    continue
  }
  reaperTypes.push(`extern class ${value} {}`);
}


const reaperClass = 'package;\n\n @:native("reaper")\n' + 'extern class Reaper {\n' + reaperFunctions.join('\n') + '\n}';
const graphicsClass = 'package;\n\n @:native("gfx")\n' + 'extern class Graphics {\n' + gfxFunctions.join('\n') + '\n}';
const imguiClass = 'package;\n\n @:native("reaper")\n' + 'extern class ImGui {\n' + imguiFunctions.join('\n') + '\n}';
const typesClass = reaperTypes.join('\n');

// write to file
fs.writeFileSync('dist/Reaper.hx', reaperClass);
fs.writeFileSync('dist/Graphics.hx', graphicsClass);
fs.writeFileSync('dist/ImGui.hx', imguiClass);
fs.writeFileSync('dist/Types.hx', typesClass);
