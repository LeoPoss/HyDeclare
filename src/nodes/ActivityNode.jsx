import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useStore } from "../store";
import { ACT_W, NODE_H } from "../constants";
import Tag from "../components/Tag";

const MONO = "ui-monospace, 'SF Mono', 'JetBrains Mono', 'Roboto Mono', Menlo, monospace";

export default memo(function ActivityNode({ id, data }) {
  const sel       = useStore((s) => s.sel);
  const tagOf     = useStore((s) => s.tagOf);

  const on = sel?.kind === "activities" && sel.id === id;
  const tg = tagOf(id);

  const act = "#2563EB";
  const actSoft = "#EFF6FF";
  const actStroke = "#C3D7FC";

  return (
    <div style={{ width: ACT_W, height: NODE_H, position: "relative" }}>
      <svg width={ACT_W} height={NODE_H} style={{ display: "block", overflow: "visible" }}>
        <rect x={0} y={0} width={ACT_W} height={NODE_H} rx={8}
          fill={actSoft}
          stroke={on ? act : actStroke}
          strokeWidth={on ? 2 : 1.3} />
        <text x={ACT_W / 2} y={NODE_H / 2 + 5} fill={act} fontSize="12" fontWeight="600"
          fontFamily={MONO} textAnchor="middle" style={{ pointerEvents: "none" }}>{data.name}</text>
        {tg && <Tag x={ACT_W / 2} y={0} type={tg.type} />}
      </svg>
      <Handle type="target" position={Position.Left} style={{
        position: "absolute",
        top: NODE_H / 2,
        left: 0,
        transform: "translate(-50%, -50%)",
        width: 10,
        height: 10,
        background: "#FFFFFF",
        border: "2px solid #2563EB",
      }} />
      <Handle type="source" position={Position.Right} style={{
        position: "absolute",
        top: NODE_H / 2,
        left: ACT_W,
        transform: "translate(-50%, -50%)",
        width: 10,
        height: 10,
        background: "#FFFFFF",
        border: "2px solid #2563EB",
      }} />
    </div>
  );
});
