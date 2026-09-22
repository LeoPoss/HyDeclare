import { create } from "zustand";
import { persist } from "zustand/middleware";
import { exCooling } from "./examples/index";
import { coerceModel } from "./lib/compiler";
import { LS_KEY } from "./constants";

export const kindOf = (m, id) =>
  m.ports.some((p) => p.id === id) ? "ports"
    : m.signals.some((s) => s.id === id) ? "signals"
      : m.junctions.some((j) => j.id === id) ? "junctions"
        : m.activities.some((a) => a.id === id) ? "activities"
          : null;

const uid = (p) => p + Math.random().toString(36).slice(2, 6);
const freeId = (cs, pre) => {
  const t = new Set(cs.map((g) => g.id));
  let i = 1; while (t.has(`${pre}${i}`)) i++;
  return `${pre}${i}`;
};

const blankModel = () => ({
  signals: [], ports: [], junctions: [], activities: [], constraints: [],
});

export const useStore = create(persist((set, get) => ({
  model: exCooling(),
  sel: null,
  tab: "stl",
  toast: null,

  setModel: (m) =>
    set((s) => ({ model: typeof m === "function" ? m(s.model) : m })),

  setSel: (sel) => set({ sel }),
  setTab: (tab) => set({ tab }),

  flash: (msg) => {
    set({ toast: msg });
    setTimeout(() => set({ toast: null }), 2200);
  },

  upd: (kind, id, patch) =>
    set((s) => ({ model: { ...s.model, [kind]: s.model[kind].map((x) => x.id === id ? { ...x, ...patch } : x) } })),

  addSignal: () =>
    set((s) => ({ model: { ...s.model, signals: [...s.model.signals, { id: uid("s"), name: "Sensor", x: 80, y: 380 }] } })),

  addActivity: () =>
    set((s) => ({ model: { ...s.model, activities: [...s.model.activities, { id: uid("a"), name: "Task", x: 540, y: 380 }] } })),

  addJunction: () =>
    set((s) => ({ model: { ...s.model, junctions: [...s.model.junctions, { id: uid("j"), op: "AND", delta: null, members: [], x: 310, y: 380 }] } })),

  addPort: (sigId) =>
    set((s) => ({ model: { ...s.model, ports: [...s.model.ports, { id: uid("p"), signal: sigId, op: ">", k: 0, delta: null }] } })),

  addJunctionMember: (jid, memberId) =>
    set((s) => {
      const m = s.model;
      const j = m.junctions.find((x) => x.id === jid);
      if (!j) return {};
      if (j.members.includes(memberId)) return {};
      return {
        model: {
          ...m,
          junctions: m.junctions.map((x) =>
            x.id === jid ? { ...x, members: [...x.members, memberId] } : x
          )
        }
      };
    }),

  tagCondition: (cid, type) =>
    set((s) => {
      const m = s.model;
      const ex = m.constraints.find((g) => g.theta === cid && (g.type === "Existence" || g.type === "NotExistence"));
      if (ex) return {
        model: ex.type === type
          ? { ...m, constraints: m.constraints.filter((g) => g.id !== ex.id) }
          : { ...m, constraints: m.constraints.map((g) => (g.id === ex.id ? { ...g, type } : g)) },
      };
      return { model: { ...m, constraints: [...m.constraints, { id: freeId(m.constraints, "C"), type, theta: cid, I: [0,"m"], n:1, m:"*" }] } };
    }),

  del: (kind, id) =>
    set((s) => {
      const m = s.model;
      const next = { ...m, [kind]: m[kind].filter((x) => x.id !== id) };
      const gone = new Set([id]);
      if (kind === "signals") {
        m.ports.filter((p) => p.signal === id).forEach((p) => gone.add(p.id));
        next.ports = next.ports.filter((p) => p.signal !== id);
      }
      next.junctions = next.junctions
        .map((j) => ({ ...j, members: j.members.filter((x) => !gone.has(x)) }))
        .filter((j) => !gone.has(j.id));
      next.constraints = next.constraints.filter((g) => !gone.has(g.theta) && !gone.has(g.theta1) && !gone.has(g.theta2));
      return { model: next };
    }),

  newModel: () => set({ model: blankModel(), sel: null }),
  loadExample: (fn) => set({ model: fn(), sel: null }),

  clickCondition: (e, id) => {
    e.stopPropagation();
    const kind = kindOf(get().model, id);
    if (kind) set({ sel: { kind, id } });
  },

  addConstraint: (from, to) => {
    const { model } = get();
    set({
      model: { ...model, constraints: [...model.constraints, {
        id: freeId(model.constraints, "Φ"), type: "Response",
        theta1: from, theta2: to, Ia: [0,"m"], Ir: [0,5],
      }]}
    });
  },

  isConnecting: false,
  setConnecting: (val) => set({ isConnecting: val }),

  tagOf: (id) => get().model.constraints.find((g) => g.theta === id && (g.type === "Existence" || g.type === "NotExistence")),
}), {
  /* Persist the model only, and on every action that touches it. */
  name: LS_KEY,
  partialize: (s) => ({ model: s.model }),
  merge: (persisted, current) => {
    try {
      return { ...current, model: coerceModel(persisted?.model) };
    } catch {
      return current;
    }
  },
}));
