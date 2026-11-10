const assert = require("assert");
const path = require("path");
const { transformFileSync } = require("@babel/core");
const interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
const slicedToArray = require("@babel/runtime/helpers/slicedToArray");

const source = path.resolve(__dirname, "../src/pickers/MicroCatchmentPicker.js");
const { code } = transformFileSync(source, {
  presets: [["@babel/preset-env", { modules: "commonjs" }], "@babel/preset-react"],
});

let searchString = "";
let capturedQuery;
let capturedVariables;

const react = {
  __esModule: true,
  default: { createElement: () => null },
  useState: () => [searchString, () => {}],
};
const core = {
  Autocomplete: () => null,
  useModulesManager: () => ({}),
  useTranslations: () => ({ formatMessage: (id) => id }),
  useGraphqlQuery: (query, variables) => {
    capturedQuery = query;
    capturedVariables = variables;
    return { data: null, isLoading: false, error: null };
  },
};
const localRequire = (moduleName) => {
  if (moduleName === "react") return react;
  if (moduleName === "@openimis/fe-core") return core;
  if (moduleName === "@babel/runtime/helpers/interopRequireDefault") {
    return interopRequireDefault;
  }
  if (moduleName === "@babel/runtime/helpers/slicedToArray") return slicedToArray;
  throw new Error(`Unexpected module: ${moduleName}`);
};

const moduleUnderTest = { exports: {} };
// eslint-disable-next-line no-new-func
Function("exports", "module", "require", code)(moduleUnderTest.exports, moduleUnderTest, localRequire);
const MicroCatchmentPicker = moduleUnderTest.exports.default;

MicroCatchmentPicker({
  district: { uuid: "district-uuid" },
  benefitPlanId: "benefit-plan-id",
  onChange: () => {},
});

assert.match(capturedQuery, /\$benefitPlanId: ID/);
assert.match(capturedQuery, /benefitPlanId: \$benefitPlanId/);
assert.deepStrictEqual(capturedVariables, {
  search: "",
  district: "district-uuid",
  benefitPlanId: "benefit-plan-id",
});

searchString = "alpha";
MicroCatchmentPicker({
  district: { uuid: "district-uuid" },
  benefitPlanId: "new-benefit-plan-id",
  onChange: () => {},
});
assert.deepStrictEqual(capturedVariables, {
  search: "alpha",
  district: "district-uuid",
  benefitPlanId: "new-benefit-plan-id",
});

MicroCatchmentPicker({
  district: { uuid: "district-uuid" },
  onChange: () => {},
});
assert.deepStrictEqual(capturedVariables, {
  search: "alpha",
  district: "district-uuid",
  benefitPlanId: undefined,
});

console.log("MicroCatchmentPicker tests passed");
