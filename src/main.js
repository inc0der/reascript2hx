const { parser } = require('reascriptluaparser')

const fs = require("fs");
const { createHaxeFunction } = require('./utils/createHaxeFunction');
const { traverseFields } = require('./utils/traverseFields');
const { categorizeAst } = require('./utils/categorizeAst');
const { getTypes } = require('./utils/getTypes');

const input = fs.readFileSync("reascripthelp.html", "utf8");
const ast = parser(input);
const categorized = categorizeAst(ast);

const { reaper, gfx, other } = categorized;


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


// write to file
fs.writeFileSync('dist/Reaper.hx', reaperFunctions.join('\n'));
fs.writeFileSync('dist/Graphics.hx', gfxFunctions.join('\n'));
