import { BaseEdge, getBezierPath } from "@xyflow/react";

export default function MemberEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  return <BaseEdge id={id} path={path} style={{ stroke: "#0369a1", strokeWidth: 1.6, opacity: 0.45 }} />;
}
