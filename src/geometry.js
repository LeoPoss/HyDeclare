import { SIG_W, ACT_W, NODE_H, PORT_GAP, JUNC_R } from "./constants";

export function sigHeight(n) {
  return Math.max(NODE_H, (n - 1) * PORT_GAP + 58);
}

export function portPos(m, id) {
  const p = m.ports.find((x) => x.id === id);
  if (!p) return null;
  const s = m.signals.find((x) => x.id === p.signal);
  if (!s) return null;
  const mine = m.ports.filter((x) => x.signal === s.id);
  const i = mine.findIndex((x) => x.id === id);
  const h = sigHeight(mine.length);
  return { x: s.x + SIG_W, y: s.y + h / 2 - ((mine.length - 1) * PORT_GAP) / 2 + i * PORT_GAP };
}

export function anchor(m, id, side) {
  const a = m.activities.find((x) => x.id === id);
  if (a) return { x: side === "in" ? a.x : a.x + ACT_W, y: a.y + NODE_H / 2 };
  const j = m.junctions.find((x) => x.id === id);
  if (j) return { x: side === "in" ? j.x - JUNC_R : j.x + JUNC_R, y: j.y };
  return portPos(m, id);
}
