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
});

test("determineType converts primitive, nullable, and custom types", () => {
  const types = new Map([["Track", "Track"]]);

  assert.equal(determineType(types, "integer"), "Int");
  assert.equal(determineType(types, "Track"), "Track");
  assert.equal(determineType(types, "Track|nil"), "haxe.extern.EitherType<Track, Void>");
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

test("multi-return generation creates named fields", () => {
  const output = createMultiReturnsClass({
    name: "get_handles",
    returns: [
      { name: "first", type: "Track" },
      { name: "second", type: "boolean" }
    ]
  }, new Map([["Track", "Track"]]));

  assert.match(output, /@:multiReturn extern class GetHandlesReturns/);
  assert.match(output, /var first:Track;/);
  assert.match(output, /var second:Bool;/);
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
