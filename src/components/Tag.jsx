import React from "react";

const OK = "#15803D";
const OK_SOFT = "#F0FDF4";
const BAN = "#DC2626";
const BAN_SOFT = "#FEF2F2";
const MONO = "ui-monospace, 'SF Mono', 'JetBrains Mono', 'Roboto Mono', Menlo, monospace";

export default function Tag({ x, y, type }) {
  if (type === "Existence") {
    return (
      <g>
        <line x1={x} y1={y + 6} x2={x} y2={y - 24} stroke={OK} strokeWidth="1.4" strokeDasharray="3 2" />
        <rect x={x - 22} y={y - 42} width={44} height={20} rx={6} fill={OK_SOFT} stroke={OK} strokeWidth="1.3" />
        <text x={x} y={y - 29} fill={OK} fontSize="11" fontFamily={MONO} fontWeight="600" textAnchor="middle">
          1..*
        </text>
      </g>
    );
  }

  /* prohibition */
  return (
    <g>
      <line x1={x} y1={y + 6} x2={x} y2={y - 24} stroke={BAN} strokeWidth="1.4" strokeDasharray="3 2" />
      <rect x={x - 22} y={y - 42} width={44} height={20} rx={6} fill={BAN_SOFT} stroke={BAN} strokeWidth="1.3" />
      <circle cx={x - 5} cy={y - 32} r={5} stroke={BAN} strokeWidth="1.3" fill="none" />
      <line x1={x - 8.5} y1={y - 35.5} x2={x - 1.5} y2={y - 28.5} stroke={BAN} strokeWidth="1.4" />
    </g>
  );
}
