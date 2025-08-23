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


function createExternClass(nativeName, className, functions) {
  return `package reaper;\n\nimport Types;\n\n@:${nativeName}("${className}")\nextern class ${className} {\n${functions.join('\n')}\n}`;
}



const reaperClass = createExternClass('reaper', 'Reaper', reaperFunctions);
const graphicsClass = createExternClass('gfx', 'Graphics', gfxFunctions);
const imguiClass = createExternClass('reaper', 'ImGui', imguiFunctions);
const typesClass = 'package reaper;\n\n' + reaperTypes.join('\n') + '\n';

// write to file
fs.writeFileSync('dist/Reaper.hx', reaperClass);
fs.writeFileSync('dist/Graphics.hx', graphicsClass);
fs.writeFileSync('dist/ImGui.hx', imguiClass);
fs.writeFileSync('dist/Types.hx', typesClass);
