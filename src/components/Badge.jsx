import React from "react";

export default function Badge({ x, y, d, from }) {
  const sus = "#B45309";
  const fill = "#FEF3E2";

  return (
    <g>
      <path
        d={`M ${from.x} ${from.y} L ${x + 14} ${y + 18}`}
        stroke={sus}
        strokeWidth="1.3"
        strokeDasharray="3 2"
        fill="none"
      />
      <rect
        x={x} y={y} width={62} height={26} rx={7}
        fill={fill} stroke={sus} strokeWidth="1.4"
      />
      <path d={`M ${x + 11} ${y + 13} h 9`} stroke={sus} strokeWidth="2.2" />
      <text
        x={x + 28} y={y + 18}
        fill={sus}
        fontSize="12"
        fontFamily="ui-monospace, 'SF Mono', 'JetBrains Mono', 'Roboto Mono', Menlo, monospace"
        fontWeight="600"
        style={{ userSelect: "none" }}
      >
        {d}s
      </text>
    </g>
  );
}
