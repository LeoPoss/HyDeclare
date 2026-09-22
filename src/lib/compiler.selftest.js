/* Pins the compiler to the formulas printed in the paper. Run: npm test */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compile, coverage, validate, outsideCore } from "./compiler.js";

const load = (name) =>
  JSON.parse(
    readFileSync(fileURLToPath(new URL(`../examples/${name}.json`, import.meta.url)), "utf8"),
  );

const formulas = (m) =>
  Object.fromEntries(compile(m).stl.map((s) => [s.id, s.formula]));

/* --- the cooling process, Sect. "Application Scenarios" --- */
const cooling = load("cooling");
assert.deepEqual(validate(cooling), [], "cooling model is well-formed");
assert.deepEqual(coverage(cooling), [], "cooling model is in the executable core");
assert.deepEqual(formulas(cooling), {
  "Φ₁": "¬F[0,m](H[0,10](temp[t] > 90))",
  "Φ₂": "G[0,m](on(H[0,10](temp[t] > 80)) → F[0,5](dis(StartCooling[t])))",
  "Φ₃": "G[0,m](on(dis(Restart[t])) → O[0,20](H[0,20](temp[t] < 50)))",
});

/* --- the reactor interlock; the shipped example is a larger model of its own --- */
assert.equal(
  formulas({
    signals: [
      { id: "s1", name: "temp" },
      { id: "s2", name: "press" },
    ],
    ports: [
      { id: "p1", signal: "s1", op: ">", k: 80, delta: null },
      { id: "p2", signal: "s2", op: ">", k: 20, delta: null },
    ],
    junctions: [{ id: "j1", op: "AND", members: ["p1", "p2"], delta: 5 }],
    activities: [{ id: "a1", name: "EmergencyStop" }],
    constraints: [
      { id: "Ξ₁", type: "Response", theta1: "j1", theta2: "a1", Ia: [0, "m"], Ir: [0, 3] },
    ],
  })["Ξ₁"],
  "G[0,m](on(H[0,5]((temp[t] > 80 ∧ press[t] > 20))) → F[0,3](dis(EmergencyStop[t])))",
);

/* --- every shipped example stays well-formed and executable --- */
for (const name of ["cooling", "reactor"]) {
  const m = load(name);
  assert.deepEqual(validate(m), [], `${name} example is well-formed`);
  assert.deepEqual(coverage(m), [], `${name} example is in the executable core`);
  for (const { id, stmts } of compile(m).epl)
    assert.ok(stmts.length > 0, `${name}/${id} emits EPL`);
}

/* --- a sustain badge is a past-time obligation, never a future one --- */
assert.ok(
  !JSON.stringify(formulas(cooling)).includes("G[0,10]"),
  "sustain must compile to H, not G",
);

/* --- well-formedness carries the numbering used in the paper --- */
const rules = (m) => validate(m).map((e) => e.rule);
const broken = {
  signals: [{ id: "s1", name: "temp" }],
  ports: [
    { id: "p1", signal: "nope", op: ">", k: 1, delta: 0 },
    { id: "p2", signal: "s1", op: ">", k: 1, delta: null },
  ],
  junctions: [{ id: "j1", op: "AND", members: ["p2"], delta: null }],
  activities: [{ id: "a1", name: "Act" }],
  constraints: [
    { id: "c1", type: "Response", theta1: "p2", theta2: "a1", Ia: [0, "m"], Ir: [9, 2] },
    { id: "c2", type: "Response", theta1: "p2", theta2: "a1", Ia: [0, "m"], Ir: [0, 5], corr: "x.a = y.a" },
    { id: "c3", type: "Existence", theta: "a1", I: [0, "m"] },
    { id: "c4", type: "NotExistence", theta: "a1", I: [0, "m"] },
  ],
};
for (const r of ["WF1", "WF2", "WF3", "WF4", "WF5"])
  assert.ok(rules(broken).includes(r), `${r} is reported`);

/* --- the language admits more than the compiler emits --- */
assert.equal(outsideCore({ type: "Response", strength: "none" }), null);
assert.match(
  outsideCore({ type: "Response", strength: "alternate" }),
  /alternate/,
  "an alternate strengthening is outside the core",
);
assert.match(
  outsideCore({ type: "Existence", n: 2, m: "*" }),
  /episodes/,
  "a cardinality above 1..* is outside the core",
);
/* ...but being outside the core is not a well-formedness error. */
const strengthened = {
  ...cooling,
  constraints: cooling.constraints.map((g) =>
    g.id === "Φ₂" ? { ...g, strength: "chain" } : g,
  ),
};
assert.deepEqual(validate(strengthened), [], "a strengthened constraint stays well-formed");
assert.deepEqual(coverage(strengthened).map((c) => c.id), ["Φ₂"]);
assert.deepEqual(
  compile(strengthened).epl.find((e) => e.id === "Φ₂").stmts,
  [],
  "no EPL is emitted outside the core",
);

/* --- each binary template compiles to behaviour of its own ---
   Bounding RespondedExistence forward would make it a Response. */
const binary = (type) => ({
  signals: [],
  ports: [],
  junctions: [],
  activities: [{ id: "a1", name: "A" }, { id: "a2", name: "B" }],
  constraints: [{ id: "X", type, theta1: "a1", theta2: "a2", Ia: [0, "m"], Ir: [0, 5] }],
});
const epl = (type) => compile(binary(type)).epl[0].stmts.join(" ");

const seen = new Map();
for (const type of ["Response", "Precedence", "Succession", "RespondedExistence"]) {
  const out = epl(type);
  assert.ok(out.length > 0, `${type} emits EPL`);
  const twin = seen.get(out);
  assert.equal(twin, undefined, `${type} must not compile the same as ${twin}`);
  seen.set(out, type);
}

const re = epl("RespondedExistence");
assert.ok(!/timer:interval/.test(re), "RespondedExistence sets no deadline");
assert.ok(!/PERMANENT_VIOLATION/.test(re), "RespondedExistence never expires");
assert.ok(!/<= 5000/.test(re), "RespondedExistence ignores Ir");
assert.equal(
  (re.match(/FULFILLMENT/g) || []).length,
  2,
  "RespondedExistence is discharged by a target on either side of the activation",
);
assert.equal(
  compile(binary("RespondedExistence")).stl[0].formula,
  "F[0,m](dis(A[t])) → F[0,m](dis(B[t]))",
);

console.log("compiler self-test: all checks passed");
