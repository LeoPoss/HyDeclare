export function coerceModel(o) {
  if (!o || typeof o !== "object") throw new Error("not an object");
  const need = ["signals", "ports", "junctions", "activities", "constraints"];
  const out = {};
  for (const k of need) {
    if (!Array.isArray(o[k])) throw new Error(`missing array: ${k}`);
    out[k] = o[k];
  }
  return out;
}

export function resolveCondition(m, id) {
  const a = m.activities.find((x) => x.id === id);
  if (a) return { kind: "activity", id: a.id, name: a.name, delta: a.delta };
  const p = m.ports.find((x) => x.id === id);
  if (p) {
    const s = m.signals.find((x) => x.id === p.signal);
    if (!s) return null;
    return {
      kind: "port",
      id: p.id,
      signal: s.name,
      op: p.op,
      k: p.k,
      delta: p.delta,
    };
  }
  const j = m.junctions.find((x) => x.id === id);
  if (j)
    return {
      kind: "junction",
      id: j.id,
      op: j.op,
      members: j.members,
      delta: j.delta,
    };
  return null;
}

export function condLabel(m, id) {
  const c = resolveCondition(m, id);
  if (!c) return "?";
  if (c.kind === "activity") return c.name;
  if (c.kind === "port") return `${c.signal} ${c.op} ${c.k}`;
  return `(${c.members.length} × ${c.op === "AND" ? "∧" : "∨"})`;
}

export const iv = (I) => `[${I[0]},${I[1]}]`;


export function conditionSTL(m, id, seen = new Set()) {
  const c = resolveCondition(m, id);
  if (!c || seen.has(id)) return "?";
  let base;
  if (c.kind === "activity") base = `dis(${c.name}[t])`;
  else if (c.kind === "port") base = `${c.signal}[t] ${c.op} ${c.k}`;
  else {
    if (!c.members.length) return "?";
    const next = new Set(seen).add(id);
    const sep = c.op === "AND" ? " ∧ " : " ∨ ";
    base = "(" + c.members.map((x) => conditionSTL(m, x, next)).join(sep) + ")";
  }
  return c.delta ? `H[0,${c.delta}](${base})` : base;
}

const onset = (s) => `on(${s})`;

export function cardinality(g) {
  const n = g.n ?? 1;
  const m = g.m ?? "*";
  return n === 1 && m === "*" ? null : { n, m };
}

export function constraintSTL(m, g) {
  if (g.type === "NotExistence")
    return `¬F${iv(g.I)}(${conditionSTL(m, g.theta)})`;
  if (g.type === "Existence") {
    /* Only 1..* is a formula of the fragment; a higher count counts episodes. */
    const card = cardinality(g);
    return card
      ? `#episodes${iv(g.I)}(${conditionSTL(m, g.theta)}) ∈ ${card.n}..${card.m}`
      : `F${iv(g.I)}(${conditionSTL(m, g.theta)})`;
  }
  const s1 = conditionSTL(m, g.theta1);
  const s2 = conditionSTL(m, g.theta2);
  const corr = g.corr ? `  ∧  ${g.corr}` : "";
  const resp = `G${iv(g.Ia)}(${onset(s1)} → F${iv(g.Ir)}(${s2}))`;
  const prec = `G${iv(g.Ir)}(${onset(s2)} → O${iv(g.Ia)}(${s1}))`;
  switch (g.type) {
    case "Response":
      return `${resp}${corr}`;
    case "Precedence":
      return `${prec}${corr}`;
    case "Succession":
      return `${resp}
  ∧ ${prec}${corr}`;
    case "RespondedExistence":
      return `F${iv(g.Ia)}(${s1}) → F[0,m](${s2})${corr}`;
    default:
      return "?";
  }
}

const negOp = (o) =>
  ({ ">": "<=", ">=": "<", "<": ">=", "<=": ">", "=": "!=" }[o]);

export function signalsOf(m, id, seen = new Set()) {
  const c = resolveCondition(m, id);
  if (!c || seen.has(id)) return [];
  if (c.kind === "port") return [c.signal];
  if (c.kind === "junction") {
    const next = new Set(seen).add(id);
    return c.members.flatMap((x) => signalsOf(m, x, next));
  }
  return [];
}

function statePred(m, id, seen = new Set()) {
  const c = resolveCondition(m, id);
  if (!c || seen.has(id)) return "true";
  if (c.kind === "activity") return `eventType='${c.name}'`;
  if (c.kind === "port")
    return `cast(payload('${c.signal}'),double) ${c.op} ${c.k}`;
  const next = new Set(seen).add(id);
  const sep = c.op === "AND" ? " AND " : " OR ";
  return "(" + c.members.map((x) => statePred(m, x, next)).join(sep) + ")";
}

export function eplDetect(m, id, cid, role) {
  const c = resolveCondition(m, id);
  if (!c) return "";

  if (c.kind === "activity") {
    if (!c.delta)
      return `INSERT INTO constraintStatus
              SELECT id, '${cid}' AS name, '${role}' AS type, timestamp
              FROM GenericEvent(eventType='${c.name}');`;
    return `INSERT INTO constraintStatus
            SELECT t1.id AS id, '${cid}' AS name, '${role}' AS type, t1.timestamp
            FROM pattern [every t1=GenericEvent(eventType='${c.name}')
  -> (timer:interval(${c.delta} sec) and not GenericEvent(eventType!='${c.name}'))];`;
  }

  if (c.kind === "port") {
    const pred = `eventType='${c.signal}', cast(payload('${c.signal}'),double) ${c.op} ${c.k}`;
    if (!c.delta)
      return `INSERT INTO constraintStatus
              SELECT id, '${cid}' AS name, '${role}' AS type, timestamp
              FROM GenericEvent(${pred});`;
    const hold = `GenericEvent(eventType='${c.signal}', cast(payload('${c.signal}'),double) ${negOp(c.op)} ${c.k})`;
    return `INSERT INTO constraintStatus
            SELECT t1.id AS id, '${cid}' AS name, '${role}' AS type, t1.timestamp
            FROM pattern [every t1=GenericEvent(${pred})
                -
               > (timer: interval (${c.delta} sec) and not ${hold})];`;
  }

  const sigs = [...new Set(signalsOf(m, id))];
  const pred = statePred(m, id);
  const head = `-- composite ${c.op} over [${sigs.join(", ")}]
-- prerequisite (declare once):
--   create window SignalState#unique(eventType) as GenericEvent;
--   insert into SignalState select * from GenericEvent;`;
  if (!c.delta)
    return `${head}
    INSERT INTO constraintStatus
    SELECT '${cid}' AS name, '${role}' AS type, current_timestamp AS timestamp
    FROM SignalState
    WHERE ${pred};`;
  return `${head}
  INSERT INTO constraintStatus
  SELECT '${cid}' AS name, '${role}' AS type, t1.timestamp
  FROM pattern [every t1=SignalState(${pred})
      -
     > (timer: interval (${c.delta} sec) and not SignalState(NOT (${pred})))];`;
}

const sec = (v) => (v === "m" || v == null ? null : Number(v));

export function eplConstraint(m, g) {
  const out = [];
  const key = g.corr?.split(".")[1]?.split(/[\s=]/)[0] || "id";
  const corrWhere = g.corr
    ? `\n  AND cast(b.payload('${key}'),String) = cast(a.payload('${key}'),String)`
    : "";

  if (g.type === "NotExistence" || g.type === "Existence") {
    if (!resolveCondition(m, g.theta)) return out;
    out.push(eplDetect(m, g.theta, g.id, "TARGET"));
    const verdict =
      g.type === "NotExistence" ? "PERMANENT_VIOLATION" : "FULFILLMENT";
    out.push(`INSERT INTO constraintStatus
              SELECT '${g.id}' AS name, '${verdict}' AS type, a.timestamp
              FROM pattern [every a=constraintStatus(type='TARGET', name='${g.id}')];`);
    return out;
  }

  if (!resolveCondition(m, g.theta1) || !resolveCondition(m, g.theta2))
    return out;
  out.push(eplDetect(m, g.theta1, g.id, "ACTIVATION"));
  out.push(eplDetect(m, g.theta2, g.id, "TARGET"));

  /* Order-free and deadline-free: the target may precede the activation, and
     an unmet obligation stays pending for L3 rather than expiring. */
  if (g.type === "RespondedExistence") {
    const where = corrWhere ? `
WHERE 1=1${corrWhere}` : "";
    out.push(`INSERT INTO constraintStatus
              SELECT b.id, '${g.id}' AS name, 'FULFILLMENT' AS type, b.timestamp
              FROM pattern [every a=constraintStatus(type='ACTIVATION', name='${g.id}')
  -> b=constraintStatus(type='TARGET', name='${g.id}')]${where};`);
    out.push(`-- order-free: a target seen earlier discharges the obligation too
INSERT INTO constraintStatus
SELECT a.id, '${g.id}' AS name, 'FULFILLMENT' AS type, a.timestamp
FROM pattern [every b=constraintStatus(type='TARGET', name='${g.id}')
  -> a=constraintStatus(type='ACTIVATION', name='${g.id}')]${where};`);
    return out;
  }

  const fwd = ["Response", "Succession"].includes(g.type);
  const bwd = ["Precedence", "Succession"].includes(g.type);

  if (fwd) {
    const w = sec(g.Ir[1]);
    out.push(`INSERT INTO constraintStatus
              SELECT b.id, '${g.id}' AS name, 'FULFILLMENT' AS type, b.timestamp
              FROM pattern [every a=constraintStatus(type='ACTIVATION', name='${g.id}')
  -> b=constraintStatus(type='TARGET', name='${g.id}')]${
                      w
                              ? `\nWHERE b.timestamp - a.timestamp <= ${w * 1000}${corrWhere}`
                              : corrWhere
                                      ? `\nWHERE 1=1${corrWhere}`
                                      : ""
              };`);
    if (w)
      out.push(`INSERT INTO constraintStatus
                SELECT '${g.id}' AS name, 'PERMANENT_VIOLATION' AS type, a.timestamp
                FROM pattern [every a=constraintStatus(type='ACTIVATION', name='${g.id}')
  -> (timer:interval(${w} sec) and not constraintStatus(type ='TARGET'
                   , name ='${g.id}'))];`);
  }

  if (bwd) {
    const look = sec(g.Ia[1]);
    out.push(`-- backward: target requires a prior activation
INSERT INTO constraintStatus
SELECT '${g.id}' AS name, 'PERMANENT_VIOLATION' AS type, b.timestamp
FROM pattern [every b=constraintStatus(type='TARGET', name='${g.id}')
  and not constraintStatus(type='ACTIVATION', name='${g.id}')${
      look ? `\n  where timer:within(${look} sec)` : ""
    }];`);
  }
  return out;
}

export function compile(m) {
  return {
    stl: m.constraints.map((g) => ({
      id: g.id,
      type: g.type,
      formula: constraintSTL(m, g),
      outside: outsideCore(g),
    })),
    epl: m.constraints.map((g) => ({
      id: g.id,
      type: g.type,
      outside: outsideCore(g),
      stmts: outsideCore(g) ? [] : eplConstraint(m, g),
    })),
  };
}

/* ---- well-formedness ----
   WF1-WF5 as defined in the paper. These are properties of the *language*:
   a model that breaks one of them denotes nothing. */

export function validate(m) {
  const e = [];

  /* WF1: every port observes a signal, every endpoint resolves to a condition. */
  for (const p of m.ports)
    if (!m.signals.some((s) => s.id === p.signal))
      e.push({ id: p.id, rule: "WF1", msg: "Port observes no signal." });

  for (const g of m.constraints)
    for (const end of (g.theta ? [g.theta] : [g.theta1, g.theta2]).filter(
      Boolean,
    )) {
      if (m.signals.some((s) => s.id === end))
        e.push({
          id: g.id,
          rule: "WF1",
          msg: "Edge attaches to a signal. Attach it to a port.",
        });
      else if (!resolveCondition(m, end))
        e.push({
          id: g.id,
          rule: "WF1",
          msg: "Endpoint does not resolve to a condition.",
        });
    }

  /* WF2: junctions take at least two members and nest acyclically. */
  for (const j of m.junctions) {
    if (j.members.length < 2)
      e.push({
        id: j.id,
        rule: "WF2",
        msg: "A junction needs at least two members.",
      });
    const walk = (id, seen) => {
      if (seen.has(id)) return true;
      const c = resolveCondition(m, id);
      if (c?.kind !== "junction") return false;
      const next = new Set(seen).add(id);
      return c.members.some((x) => walk(x, next));
    };
    if (walk(j.id, new Set()))
      e.push({ id: j.id, rule: "WF2", msg: "Junction is cyclic." });
  }

  /* WF3: sustain durations are positive, windows are ordered and finite. */
  for (const c of [...m.ports, ...m.junctions, ...m.activities])
    if (c.delta != null && !(c.delta > 0))
      e.push({
        id: c.id,
        rule: "WF3",
        msg: "Sustain duration must be positive.",
      });

  for (const g of m.constraints)
    for (const w of [g.I, g.Ia, g.Ir].filter(Boolean))
      if (w[1] !== "m" && Number(w[0]) > Number(w[1]))
        e.push({ id: g.id, rule: "WF3", msg: `Window ${iv(w)} is inverted.` });

  /* WF4: a correlation reads event payloads, so both ends must be discrete. */
  for (const g of m.constraints) {
    if (!g.corr) continue;
    const continuous = [g.theta1, g.theta2]
      .filter(Boolean)
      .some((end) => signalsOf(m, end).length > 0);
    if (continuous)
      e.push({
        id: g.id,
        rule: "WF4",
        msg: "Correlation reads payloads, so both endpoints must be discrete.",
      });
  }

  /* WF5: a condition carries at most one existence tag. */
  const tags = {};
  for (const g of m.constraints)
    if (g.type === "Existence" || g.type === "NotExistence")
      (tags[g.theta] ||= []).push(g);
  for (const list of Object.values(tags))
    if (list.length > 1) {
      const kinds = new Set(list.map((g) => g.type));
      e.push({
        id: list[list.length - 1].id,
        rule: "WF5",
        msg:
          kinds.size > 1
            ? "Existence and prohibition on the same condition."
            : "Condition carries more than one tag.",
      });
    }

  return e;
}

/* ---- executable core ----
   Well-formedness is a property of the language; coverage is a property of
   *this* compiler. Reported separately, never conflated. */

export const CORE_TEMPLATES = [
  "Existence",
  "NotExistence",
  "Response",
  "Precedence",
  "Succession",
  "RespondedExistence",
];

export function outsideCore(g) {
  if (!CORE_TEMPLATES.includes(g.type))
    return `Template ${g.type} is outside the executable core.`;
  if (g.strength && g.strength !== "none")
    return `The ${g.strength} strengthening is well-formed, but the compiler does not expand it.`;
  const card = g.type === "Existence" ? cardinality(g) : null;
  if (card)
    return `Cardinality ${card.n}..${card.m} counts episodes, which lies outside the STL fragment.`;
  return null;
}

export function coverage(m) {
  return m.constraints
    .map((g) => ({ id: g.id, type: g.type, reason: outsideCore(g) }))
    .filter((x) => x.reason);
}
