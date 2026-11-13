const assert = require("assert");
const path = require("path");
const babel = require("@babel/core");

class Component {
  constructor(props) { this.props = props; }
  setState(update) { Object.assign(this.state, update); }
}

function loadForm(name, redirects) {
  const { code } = babel.transformFileSync(path.join(__dirname, "../src/components", `${name}.js`), {
    babelrc: false,
    configFile: false,
    presets: [["@babel/preset-env", { targets: { node: "current" } }], "@babel/preset-react"],
    plugins: [() => ({ visitor: {
      ImportDeclaration(p) { p.remove(); },
      ExportDefaultDeclaration(p) { p.remove(); },
    } })],
  });
  const exports = {};
  Function("exports", "Component", "formatMessage", "formatMessageWithValues", "historyPush", code)(
    exports, Component, () => "Success", () => "Saved", (...args) => redirects.push(args),
  );
  return exports[name];
}

async function run() {
  for (const name of ["CatchmentForm", "MicroCatchmentForm"]) {
    for (const editing of [false, true]) {
      for (const outcome of [2, 1, 0, null, "error"]) {
        const redirects = [];
        const alerts = [];
        const journals = [];
        let complete;
        let reject;
        const pending = new Promise((resolve, fail) => { complete = resolve; reject = fail; });
        const Form = loadForm(name, redirects);
        const form = new Form({
          catchmentUuid: editing ? "existing" : null,
          microCatchmentUuid: editing ? "existing" : null,
          mutation: { id: "accepted", clientMutationId: "request-id" },
          submittingMutation: false,
          journalize: (mutation) => journals.push(mutation),
          waitForMutation: (id) => { assert.strictEqual(id, "request-id"); return pending; },
          coreAlert: (...args) => alerts.push(args),
        });
        const values = { name: "Keep my input", code: "C1", districts: [{ uuid: "district" }] };
        Object.assign(form.state, { catchment: values, microCatchment: values, saving: true });
        let confirmation;
        const confirmSave = form.confirmSave;
        form.confirmSave = (id) => { confirmation = confirmSave(id); };
        form.componentDidUpdate({ submittingMutation: true });
        assert.strictEqual(journals.length, 1);
        assert.strictEqual(alerts.length, 0, "Acceptance must not show success");
        assert.strictEqual(redirects.length, 0, "Acceptance must not redirect");
        if (outcome === "error") reject(new Error("Network failed"));
        else complete(outcome === null ? null : { status: outcome });
        await confirmation;
        assert.strictEqual(redirects.length, outcome === 2 ? 1 : 0);
        assert.strictEqual(alerts.length, outcome === 1 ? 0 : 1);
        assert.strictEqual(form.state.catchment, values);
        assert.strictEqual(form.state.microCatchment, values);
        assert.strictEqual(form.state.saving, false);
      }
    }
    const redirects = [];
    const Form = loadForm(name, redirects);
    let complete;
    const form = new Form({ waitForMutation: () => new Promise((resolve) => { complete = resolve; }) });
    const confirmation = form.confirmSave("request-id");
    form.unmounted = true;
    complete({ status: 2 });
    await confirmation;
    assert.strictEqual(redirects.length, 0, "Unmounted forms must not redirect");
  }
  console.log("Catchment and Micro-Catchment save result tests passed.");
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
