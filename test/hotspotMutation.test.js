const assert = require("assert");
const Module = require("module");
const path = require("path");
const babel = require("@babel/core");

const helperPath = path.resolve(__dirname, "../src/utils.js");
const { code } = babel.transformFileSync(helperPath, {
  presets: [["@babel/preset-env", { modules: "commonjs" }]],
  plugins: [],
  babelrc: false,
});
const helperModule = new Module(helperPath, module);
helperModule.filename = helperPath;
helperModule.paths = Module._nodeModulePaths(path.dirname(helperPath));
helperModule._compile(code, helperPath);

const { getHotspotMutationAction } = helperModule.exports;

assert.strictEqual(`${getHotspotMutationAction({ name: "New hotspot" })}Hotspot`, "createHotspot");
assert.strictEqual(
  `${getHotspotMutationAction({ uuid: "existing-hotspot-uuid", name: "Existing hotspot" })}Hotspot`,
  "updateHotspot",
);

console.log("Hotspot mutation action tests passed.");
