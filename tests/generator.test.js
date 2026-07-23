import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { generateExterns, parseCliArgs } from "../src/main.js";
import { SimpleLuaParser } from "../src/SimpleLuaParser.js";
import { createHaxeFunction } from "../src/utils/createHaxeFunction.js";
import { createMultiReturnsClass } from "../src/utils/createMultiReturnsClass.js";
import { determineType } from "../src/utils/determineType.js";
import { enhancedCamelCase, enhancedPascalCase } from "../src/utils/enhancedCamelCase.js";
import { getTypes } from "../src/utils/getTypes.js";

const fixture = `
---@class API
---@field current Track Current track
---@param track Track The track to inspect
---@param function? boolean Optional flag
---@return FirstHandle first The first handle
---@return SecondHandle second The second handle
function API.getHandles(track, function)
`;

test("identifier normalization uses word boundaries instead of substring stems", () => {
  assert.equal(enhancedCamelCase("popup_max_height_in_items"), "popupMaxHeightInItems");
  assert.equal(enhancedCamelCase("resource_id"), "resourceId");
  assert.equal(enhancedCamelCase("CF_Preview"), "cfPreview");
  assert.equal(enhancedCamelCase("1"), "_1");
  assert.equal(enhancedPascalCase("get_media_item"), "GetMediaItem");
});

test("parser preserves parameters and multiple returns", () => {
  const api = new SimpleLuaParser().parse(fixture).API;
  const field = api.find(item => item.name === "getHandles");

  assert.equal(field.params[0].type, "Track");
  assert.equal(field.params[1].name, "function");
  assert.equal(field.params[1].optional, true);
  assert.deepEqual(field.returns.map(value => value.type), ["FirstHandle", "SecondHandle"]);
});

test("getTypes collects custom types from every return value", () => {
  const ast = new SimpleLuaParser().parse(fixture);
  const types = getTypes(ast);

  assert.equal(types.get("Track"), "Track");
  assert.equal(types.get("FirstHandle"), "FirstHandle");
  assert.equal(types.get("SecondHandle"), "SecondHandle");
  assert.equal(types.has("boolean"), false);

  const unionTypes = getTypes({
    API: [{
      fieldType: "function",
      params: [],
      returns: [{ type: "Track|Item|nil" }]
    }]
  });
  assert.equal(unionTypes.get("Item"), "Item");
});

test("determineType converts primitive, nullable, and custom types", () => {
  const types = new Map([["Track", "Track"], ["Item", "Item"]]);

  assert.equal(determineType(types, "integer"), "Int");
  assert.equal(determineType(types, "Track"), "Track");
  assert.equal(determineType(types, "Track|nil"), "Null<Track>");
  assert.equal(determineType(types, "Track|nil|0"), "Null<haxe.extern.EitherType<Track, Int>>");
  assert.equal(determineType(types, "Track|Item"), "haxe.extern.EitherType<Track, Item>");
});

test("function generation handles reserved and optional parameter names", () => {
  const output = createHaxeFunction({
    name: "get_value",
    params: [
      { name: "function", type: "boolean", optional: false },
      { name: "track", type: "Track", optional: true }
    ],
    returns: [{ type: "string" }]
  }, new Map([["Track", "Track"]]));

  assert.match(output, /public static function getValue\(_function: Bool, \?track: Track\): String;/);
  assert.match(output, /@:native\("get_value"\)/);
});

test("function documentation includes parameter and return descriptions", () => {
  const output = createHaxeFunction({
    name: "get_value",
    description: "Fetches a value from the current object.",
    params: [{ name: "track", type: "Track", description: "Track to inspect." }],
    returns: [{ type: "string", name: "value", description: "The current value." }]
  }, new Map([["Track", "Track"]]));

  assert.match(output, /Fetches a value from the current object\./);
  assert.match(output, /@param track Track to inspect\./);
  assert.match(output, /@return value The current value\./);
});

test("function generation uses Null for nullable returns", () => {
  const output = createHaxeFunction({
    name: "get_track",
    params: [],
    returns: [{ type: "Track|nil" }]
  }, new Map([["Track", "Track"]]));

  assert.match(output, /public static function getTrack\(\): Null<Track>;/);
});

test("multi-return generation creates named fields", () => {
  const output = createMultiReturnsClass({
    name: "get_handles",
    returns: [
      { name: "first", type: "Track", description: "First result." },
      { name: "second", type: "boolean" },
      { name: null, type: "string" }
    ]
  }, new Map([["Track", "Track"]]));

  assert.match(output, /@:multiReturn extern class GetHandlesReturns/);
  assert.match(output, /var first:Track;/);
  assert.match(output, /\* First result\.\s+\*\//);
  assert.match(output, /var second:Bool;/);
  assert.match(output, /var value2:String;/);
});

test("CLI parsing accepts generation options", () => {
  const options = parseCliArgs([
    "--reaper", "custom-reaper.lua",
    "--imgui", "custom-imgui.lua",
    "--output", "generated",
    "--package", "my.reaper"
  ]);

  assert.equal(options.reaperPath, path.resolve("custom-reaper.lua"));
  assert.equal(options.imguiPath, path.resolve("custom-imgui.lua"));
  assert.equal(options.outputDir, path.resolve("generated"));
  assert.equal(options.packageName, "my.reaper");
});

test("generation writes configurable package output", () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "reascript2hx-"));

  try {
    generateExterns({
      reaperPath: path.resolve("resources/Sexan_reaper_defs.lua"),
      imguiPath: path.resolve("resources/imgui_defs_0.9.lua"),
      outputDir,
      packageName: "my.reaper"
    });

    assert.match(fs.readFileSync(path.join(outputDir, "Reaper.hx"), "utf8"), /^package my\.reaper;/);
    assert.match(fs.readFileSync(path.join(outputDir, "Types.hx"), "utf8"), /^package my\.reaper;/);
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

test("generation rejects normalized member-name collisions", () => {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "reascript2hx-collision-"));
  const outputDir = path.join(fixtureDir, "generated");
  const reaperPath = path.join(fixtureDir, "reaper.lua");
  const imguiPath = path.join(fixtureDir, "imgui.lua");

  fs.writeFileSync(reaperPath, `
function reaper.get_value() end
function reaper.getValue() end
`);
  fs.writeFileSync(imguiPath, "");

  try {
    assert.throws(
      () => generateExterns({ reaperPath, imguiPath, outputDir }),
      /Haxe identifier collision in Reaper:.*generate "getValue"/
    );
  } finally {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test("generation rejects normalized multi-return type collisions", () => {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "reascript2hx-type-collision-"));
  const outputDir = path.join(fixtureDir, "generated");
  const reaperPath = path.join(fixtureDir, "reaper.lua");
  const imguiPath = path.join(fixtureDir, "imgui.lua");

  fs.writeFileSync(reaperPath, `
---@return string value
---@return string other
function gfx.get_value() end
---@return string value
---@return string other
function reaper.getValue() end
`);
  fs.writeFileSync(imguiPath, "");

  try {
    assert.throws(
      () => generateExterns({ reaperPath, imguiPath, outputDir }),
      /Haxe identifier collision in Types:.*generate "GetValueReturns"/
    );
  } finally {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  }
});

test("generation reports type fallbacks through the diagnostic hook", () => {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "reascript2hx-type-diagnostic-"));
  const outputDir = path.join(fixtureDir, "generated");
  const reaperPath = path.join(fixtureDir, "reaper.lua");
  const imguiPath = path.join(fixtureDir, "imgui.lua");
  const diagnostics = [];

  fs.writeFileSync(reaperPath, `
---@param callback function
function reaper.inspect(callback) end
`);
  fs.writeFileSync(imguiPath, "");

  try {
    generateExterns({
      reaperPath,
      imguiPath,
      outputDir,
      onDiagnostic: diagnostic => diagnostics.push(diagnostic)
    });

    assert.equal(diagnostics.length, 1);
    assert.equal(diagnostics[0].type, "function");
    assert.equal(diagnostics[0].context, "Reaper.inspect");
    assert.equal(diagnostics[0].location, "parameter \"callback\"");
    assert.match(diagnostics[0].message, /generated as Dynamic/);
    assert.match(fs.readFileSync(path.join(outputDir, "Reaper.hx"), "utf8"), /callback: Dynamic/);
  } finally {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  }
});
