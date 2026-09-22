import React from "react";
import { cardinality } from "../lib/compiler";

const OK = "#15803d";
const OK_SOFT = "#dcfce7";
const BAN = "#b91c1c";
const BAN_SOFT = "#fee2e2";
const MONO = "ui-monospace, 'SF Mono', 'JetBrains Mono', 'Roboto Mono', Menlo, monospace";

export default function Tag({ x, y, tag }) {
  if (!tag) return null;

  if (tag.type === "Existence") {
    const card = cardinality(tag);
    const label = card ? `${card.n}..${card.m}` : "1..*";
    /* Dashed once the count leaves the executable core. */
    const w = Math.max(44, label.length * 8 + 16);
    return (
      <g>
        <line x1={x} y1={y + 6} x2={x} y2={y - 24} stroke={OK} strokeWidth="1.4" strokeDasharray="3 2" />
        <rect x={x - w / 2} y={y - 42} width={w} height={20} rx={6} fill={OK_SOFT} stroke={OK}
          strokeWidth="1.3" strokeDasharray={card ? "4 2" : "none"} />
        <text x={x} y={y - 29} fill={OK} fontSize="11" fontFamily={MONO} fontWeight="600" textAnchor="middle">
          {label}
        </text>
      </g>
    );
  }

  return (
    <g>
      <line x1={x} y1={y + 6} x2={x} y2={y - 24} stroke={BAN} strokeWidth="1.4" strokeDasharray="3 2" />
      <rect x={x - 22} y={y - 42} width={44} height={20} rx={6} fill={BAN_SOFT} stroke={BAN} strokeWidth="1.3" />
      <circle cx={x - 5} cy={y - 32} r={5} stroke={BAN} strokeWidth="1.3" fill="none" />
      <line x1={x - 8.5} y1={y - 35.5} x2={x - 1.5} y2={y - 28.5} stroke={BAN} strokeWidth="1.4" />
    </g>
  );
}
