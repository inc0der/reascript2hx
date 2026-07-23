# reascript2hx

<img align="center"  src="reascript_haxe_logo.png">

A small library that extracts the ReaScript Lua documentation and generates Haxe externs. 

## Generate externs

The default build reads the bundled Lua definitions and writes the generated
classes to `dist`:

```bash
npm run generate
```

Inputs, output, and the Haxe package can be overridden for a downstream
bindings project:

```bash
npm run generate -- \
  --reaper path/to/reaper_defs.lua \
  --imgui path/to/imgui_defs.lua \
  --output path/to/generated \
  --package my.reaper
```

Run `node src/main.js --help` for the available options.

The generated `Reaper.hx`, `Graphics.hx`, `ImGui.hx`, and `Types.hx` files are
build artifacts. They may be overwritten on regeneration, so keep handwritten
facades and application code outside the generated output directory.

When installed as a dependency, the CLI is also available as:

```bash
npx reascript2hx --output path/to/generated --package my.reaper
```

The package includes the generator source and bundled Lua definitions. A
downstream bindings project should pin the generator version or Git commit and
commit its generated Haxe output separately.

The documentation snapshot is tracked in `resources/manifest.json`. It records
the source revision, commit date, fetch time, SHA-256 hash, and embedded API
version when available. Run `npm run updateLuaDocs` to fetch a new snapshot and
append the previous one to the manifest history.

Credits:
[Sexan](https://github.com/GoranKovac) for the Lua documentation provided by their awesome [Reaper Reascript](https://github.com/AntoineBalaine/vscode-reascript-extension) VSCode extension
