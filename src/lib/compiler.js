export function emptyModel() {
  return {
    signals: [],
    ports: [],
    junctions: [],
    activities: [],
    constraints: [],
  };
}

/** Accept any object that has the five arrays. */
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

/** Resolve an id to a typed condition descriptor. */
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

/** Short human-readable label for a condition (used in junction member lists). */
export function condLabel(m, id) {
  const c = resolveCondition(m, id);
  if (!c) return "?";
  if (c.kind === "activity") return c.name;
  if (c.kind === "port") return `${c.signal} ${c.op} ${c.k}`;
  return `(${c.members.length} × ${c.op === "AND" ? "∧" : "∨"})`;
}

export const iv = (I) => `[${I[0]},${I[1]}]`;


/** Recursive STL denotation of a condition. */
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
  return c.delta ? `G[0,${c.delta}](${base})` : base;
}

/** STL formula for one constraint. */
export function constraintSTL(m, g) {
  if (g.type === "NotExistence")
    return `¬F${iv(g.I)}(${conditionSTL(m, g.theta)})`;
  if (g.type === "Existence")
    return `F${iv(g.I)}(${conditionSTL(m, g.theta)})`;
  const s1 = conditionSTL(m, g.theta1);
  const s2 = conditionSTL(m, g.theta2);
  const corr = g.corr ? `  ∧  ${g.corr}` : "";
  switch (g.type) {
    case "Response":
      return `G${iv(g.Ia)}(${s1} → F${iv(g.Ir)}(${s2}))${corr}`;
    case "Precedence":
      return `G${iv(g.Ir)}(${s2} → O${iv(g.Ia)}(${s1}))${corr}`;
    case "Succession":
      return `G${iv(g.Ia)}(${s1} → F${iv(g.Ir)}(${s2}))\n  ∧ G${iv(g.Ir)}(${s2} → O${iv(g.Ia)}(${s1}))${corr}`;
    case "RespondedExistence":
      return `G${iv(g.Ia)}(${s1} → F[0,m](${s2}))${corr}`;
    default:
      return "?";
  }
}

const negOp = (o) =>
  ({ ">": "<=", ">=": "<", "<": ">=", "<=": ">", "=": "!=" }[o]);

/** Collect signal names reachable from a condition (for junction compilation). */
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

/** EPL WHERE-clause predicate for a condition (composite over SignalState window). */
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

/** EPL detection rule for a condition. */
export function eplDetect(m, id, cid, role) {
  const c = resolveCondition(m, id);
  if (!c) return "";

  /* discrete activity */
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

  /* continuous port */
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

  /* junction: multi-signal, evaluates against SignalState named window */
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

/** EPL constraint patterns (L2: temporal matching). */
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

  const fwd = ["Response", "Succession", "RespondedExistence"].includes(g.type);
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

/** Full compile: STL formulas + EPL statements per constraint. */
export function compile(m) {
  return {
    stl: m.constraints.map((g) => ({
      id: g.id,
      type: g.type,
      formula: constraintSTL(m, g),
    })),
    epl: m.constraints.map((g) => ({
      id: g.id,
      type: g.type,
      stmts: eplConstraint(m, g),
    })),
  };
}

/* ---- well-formedness ---- */

export function validate(m) {
  const e = [];
  for (const g of m.constraints) {
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
    for (const w of [g.I, g.Ia, g.Ir].filter(Boolean))
      if (w[1] !== "m" && Number(w[0]) > Number(w[1]))
        e.push({ id: g.id, rule: "WF2", msg: `Window ${iv(w)} is inverted.` });
  }
  for (const p of m.ports)
    if (p.delta != null && !(p.delta > 0))
      e.push({ id: p.id, rule: "WF2", msg: "Sustain duration must be positive." });

  for (const j of m.junctions) {
    if (j.members.length < 2)
      e.push({
        id: j.id,
        rule: "WF6",
        msg: "A junction needs at least two members.",
      });
    if (j.delta != null && !(j.delta > 0))
      e.push({
        id: j.id,
        rule: "WF2",
        msg: "Sustain duration must be positive.",
      });
    const walk = (id, seen) => {
      if (seen.has(id)) return true;
      const c = resolveCondition(m, id);
      if (c?.kind !== "junction") return false;
      const next = new Set(seen).add(id);
      return c.members.some((x) => walk(x, next));
    };
    if (walk(j.id, new Set()))
      e.push({ id: j.id, rule: "WF6", msg: "Junction is cyclic." });
  }

  const tags = {};
  for (const g of m.constraints)
    if (g.type === "Existence" || g.type === "NotExistence")
      (tags[g.theta] ||= []).push(g);
  for (const list of Object.values(tags))
    if (list.length > 1) {
      const kinds = new Set(list.map((g) => g.type));
      e.push({
        id: list[list.length - 1].id,
        rule: kinds.size > 1 ? "WF5" : "WF4",
        msg:
          kinds.size > 1
            ? "Existence and prohibition on the same condition."
            : "Condition carries more than one tag.",
      });
    }
  return e;
}
