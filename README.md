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

Credits:
[Sexan](https://github.com/GoranKovac) for the Lua documentation provided by their awesome [Reaper Reascript](https://github.com/AntoineBalaine/vscode-reascript-extension) VSCode extension
