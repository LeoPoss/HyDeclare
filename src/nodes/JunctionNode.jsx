import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useStore } from "../store";
import { JUNC_R } from "../constants";
import Badge from "../components/Badge";
import Tag from "../components/Tag";

export default memo(function JunctionNode({ id, data }) {
  const sel       = useStore((s) => s.sel);
  const tagOf     = useStore((s) => s.tagOf);

  const on = sel?.kind === "junctions" && sel.id === id;
  const tg = tagOf(id);

  const sig = "#7C3AED";
  const sigSoft = "#F5F1FE";
  const sigStroke2 = "#C4B5FD";

  return (
    <div style={{ width: JUNC_R * 2, height: JUNC_R * 2, position: "relative" }}>
      <svg width={JUNC_R * 2} height={JUNC_R * 2} style={{ display: "block", overflow: "visible" }}>
        <circle cx={JUNC_R} cy={JUNC_R} r={JUNC_R}
          fill={sigSoft}
          stroke={on ? sig : sigStroke2}
          strokeWidth={on ? 2.2 : 1.6} />
        <text x={JUNC_R} y={JUNC_R + 5} fill={sig} fontSize="15" fontWeight="700"
          textAnchor="middle" style={{ pointerEvents: "none" }}>{data.op === "AND" ? "∧" : "∨"}</text>
        {data.delta != null && (
          <Badge x={JUNC_R + 16} y={JUNC_R - 36} d={data.delta}
            from={{ x: JUNC_R + 14, y: JUNC_R - 14 }} />
        )}
        {tg && <Tag x={JUNC_R} y={0} type={tg.type} />}
      </svg>
      <Handle type="target" position={Position.Left} style={{
        position: "absolute",
        top: JUNC_R,
        left: 0,
        transform: "translate(-50%, -50%)",
        width: 10,
        height: 10,
        background: "#FFFFFF",
        border: "2px solid #7C3AED",
      }} />
      <Handle type="source" position={Position.Right} style={{
        position: "absolute",
        top: JUNC_R,
        left: JUNC_R * 2,
        transform: "translate(-50%, -50%)",
        width: 10,
        height: 10,
        background: "#FFFFFF",
        border: "2px solid #7C3AED",
      }} />
    </div>
  );
});
