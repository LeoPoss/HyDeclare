import { BaseEdge, getBezierPath, EdgeLabelRenderer } from "@xyflow/react";
import { iv } from "../lib/compiler";

const MONO = "ui-monospace, 'SF Mono', 'JetBrains Mono', 'Roboto Mono', Menlo, monospace";

/* Alternate is a double line, chain a banded one: underlays beneath the base
   edge, which supplies the white gap. */
function strengthLayers(strength, path, col) {
  if (strength === "alternate")
    return { under: [[col, 4.6]], baseColor: "#FFF", baseWidth: 1.9 };
  if (strength === "chain")
    return { under: [[col, 6], ["#FFF", 3.6]], baseColor: col, baseWidth: 1.1 };
  return { under: [], baseColor: null, baseWidth: null };
}

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
  const win =
    g.type === "RespondedExistence" ? null
      : g.type === "Precedence" ? iv(g.Ia)
        : iv(g.Ir);
  const dx = labelX - targetX;
  const dy = labelY - targetY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = 26;
  const winX = dist > offset ? targetX + (dx / dist) * offset : labelX;
  const winY = dist > offset ? targetY + (dy / dist) * offset : labelY;
  const ang = targetPosition === "left" ? 0 : targetPosition === "right" ? 180 : (Math.atan2(targetY - sourceY, targetX - sourceX) * 180) / Math.PI;
  const tipX = bwd ? -10 : 0;
  const polyPoints = `${tipX},0 ${tipX - 11},-6 ${tipX - 11},6`;

  const strength = g.strength && g.strength !== "none" ? g.strength : null;
  const { under, baseColor, baseWidth } = strengthLayers(strength, path, col);

  return (
    <>
      {under.map(([stroke, width], i) => (
        <path key={i} d={path} fill="none" stroke={stroke} strokeWidth={width} />
      ))}

      <BaseEdge id={id} path={path} interactionWidth={18}
        style={{
          stroke: baseColor ?? col,
          strokeWidth: baseWidth ?? (sel ? 2.2 : 1.6),
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
          {strength && (
            <div style={{
              color: "#b45309",
              fontSize: 9,
              marginTop: 1,
            }}>
              {strength}
            </div>
          )}
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
