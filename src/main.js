const { parser } = require('reascriptluaparser')

const fs = require("fs");
const { createHaxeFunction } = require('./utils/createHaxeFunction');
const { traverseFields } = require('./utils/traverseFields');
const { categorizeAst } = require('./utils/categorizeAst');
const { getTypes } = require('./utils/getTypes');

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
  reaperTypes.push(`extern class ${value} {};`);
}


const reaperClass = '@:native("reaper")\n' + 'extern class Reaper {\n' + reaperFunctions.join('\n') + '\n}';
const graphicsClass = '@:native("gfx")\n' + 'extern class Graphics {\n' + gfxFunctions.join('\n') + '\n}';
const imguiClass = '@:native("reaper")\n' + 'extern class ImGui {\n' + imguiFunctions.join('\n') + '\n}';
// write to file
fs.writeFileSync('dist/Reaper.hx', reaperClass);
fs.writeFileSync('dist/Graphics.hx', graphicsClass);
fs.writeFileSync('dist/ImGui.hx', imguiClass);
fs.writeFileSync('dist/Types.hx', reaperTypes.join('\n'));
