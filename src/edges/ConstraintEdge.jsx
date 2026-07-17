import { BaseEdge, getBezierPath, EdgeLabelRenderer } from "@xyflow/react";
import { iv } from "../lib/compiler";

const MONO = "ui-monospace, 'SF Mono', 'JetBrains Mono', 'Roboto Mono', Menlo, monospace";

export default function ConstraintEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) {
  const g = data?.constraint;
  if (!g) return null;

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const sel = data?.selected;
  const col = sel ? "#2563EB" : "#9CA3AF";
  const bwd = g.type === "Precedence" || g.type === "Succession";
  const win = g.type === "Precedence" ? iv(g.Ia) : iv(g.Ir);
  const dx = labelX - targetX;
  const dy = labelY - targetY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = 26;
  const winX = dist > offset ? targetX + (dx / dist) * offset : labelX;
  const winY = dist > offset ? targetY + (dy / dist) * offset : labelY;
  const ang = targetPosition === "left" ? 0 : targetPosition === "right" ? 180 : (Math.atan2(targetY - sourceY, targetX - sourceX) * 180) / Math.PI;
  const tipX = bwd ? -10 : 0;
  const polyPoints = `${tipX},0 ${tipX - 11},-6 ${tipX - 11},6`;

  return (
    <>
      <BaseEdge id={id} path={path} interactionWidth={18}
        style={{
          stroke: col, strokeWidth: sel ? 2.2 : 1.6,
          strokeDasharray: g.type === "RespondedExistence" ? "6 4" : "none"
        }} />

      {g.type !== "Precedence" && <circle cx={sourceX} cy={sourceY} r={5} fill={col} />}

      <g transform={`translate(${targetX},${targetY}) rotate(${ang})`}>
        <polygon points={polyPoints} fill="#FFF" stroke={col} strokeWidth={1.5} />
        {bwd && <circle cx={-5} cy={0} r={5} fill={col} />}
      </g>

      <EdgeLabelRenderer>
        {win && (
          <div style={{
            position: "absolute", transform: `translate(-50%, -100%) translate(${winX}px,${winY - 6}px)`,
            pointerEvents: "all", fontFamily: MONO, fontSize: 10, textAlign: "center", lineHeight: 1.4,
            color: "#6d28d9",
          }}>
            {win}s
          </div>
        )}
        <div style={{
          position: "absolute", transform: `translate(-50%, 0) translate(${labelX}px,${labelY + 6}px)`,
          pointerEvents: "all", fontFamily: MONO, fontSize: 10, textAlign: "center", lineHeight: 1.4,
        }}>
          <div style={{ color: col, fontWeight: "600" }}>{g.id}</div>
          {g.corr && (
            <div style={{
              color: "#15803d",
              fontSize: 9,
              border: "1px dashed #15803d",
              backgroundColor: "#dcfce7",
              padding: "1px 4px",
              borderRadius: 3,
              marginTop: 2,
              display: "inline-block"
            }}>
              {g.corr}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
