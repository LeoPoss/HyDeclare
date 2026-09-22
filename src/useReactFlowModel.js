import { useMemo, useCallback } from "react";
import { kindOf, useStore } from "./store";
import { sigHeight } from "./geometry";
import { NODE_H, SIG_W, ACT_W, JUNC_R } from "./constants";

export function useReactFlowModel() {
  const model = useStore((s) => s.model);
  const setModel = useStore((s) => s.setModel);
  const sel = useStore((s) => s.sel);
  const setSel = useStore((s) => s.setSel);

  const nodes = useMemo(() => {
    const out = [];

    for (const s of model.signals) {
      const ports = model.ports.filter((p) => p.signal === s.id);
      out.push({
        id: s.id,
        type: "signal",
        position: { x: s.x, y: s.y },
        data: { name: s.name, ports, signalId: s.id },
        style: { width: SIG_W, height: sigHeight(ports.length) },
      });
    }

    for (const a of model.activities) {
      out.push({
        id: a.id,
        type: "activity",
        position: { x: a.x, y: a.y },
        data: { name: a.name, activityId: a.id },
        style: { width: ACT_W, height: NODE_H },
      });
    }

    for (const j of model.junctions) {
      out.push({
        id: j.id,
        type: "junction",
        position: { x: j.x - JUNC_R, y: j.y - JUNC_R },
        data: { op: j.op, delta: j.delta, junctionId: j.id },
        style: { width: JUNC_R * 2, height: JUNC_R * 2 },
      });
    }

    return out;
  }, [model]);

  const resolveEndpoint = useCallback((id) => {
    const port = model.ports.find((p) => p.id === id);
    if (port) return { nodeId: port.signal, handleId: id };
    if (model.activities.some((a) => a.id === id)) return { nodeId: id };
    if (model.junctions.some((j) => j.id === id)) return { nodeId: id };
    return null;
  }, [model]);

  const edges = useMemo(() => {
    const out = [];

    for (const j of model.junctions) {
      for (const mid of j.members) {
        const ep = resolveEndpoint(mid);
        if (!ep) continue;
        out.push({
          id: `${j.id}-${mid}`,
          source: ep.nodeId,
          sourceHandle: ep.handleId,
          target: j.id,
          style: { stroke: "#0369a1", strokeWidth: 1.6, opacity: 0.45 },
        });
      }
    }

    for (const g of model.constraints) {
      if (!g.theta1 || !g.theta2) continue;
      const src = resolveEndpoint(g.theta1);
      const tgt = resolveEndpoint(g.theta2);
      if (!src || !tgt) continue;
      const selEdge = sel?.kind === "constraints" && sel.id === g.id;

      out.push({
        id: g.id,
        source: src.nodeId,
        sourceHandle: src.handleId,
        target: tgt.nodeId,
        targetHandle: tgt.handleId,
        type: "constraint",
        data: { constraint: g, selected: selEdge },
      });
    }

    return out;
  }, [model, sel, resolveEndpoint]);

  const onNodesChange = useCallback((changes) => {
    for (const ch of changes) {
      if (ch.type === "position" && ch.position) {
        const kind = kindOf(model, ch.id);
        if (!kind) continue;
        setModel((m) => ({
          ...m,
          [kind]: m[kind].map((n) =>
            n.id === ch.id
              ? { ...n, x: ch.position.x, y: ch.position.y }
              : n
          ),
        }));
      }
      if (ch.type === "select" && ch.selected) {
        const kind = kindOf(model, ch.id);
        if (kind) setSel({ kind, id: ch.id });
      }
    }
  }, [model, setModel, setSel]);

  const onEdgeClick = useCallback((_, edge) => {
    if (edge.type === "constraint") {
      setSel({ kind: "constraints", id: edge.id });
    }
  }, [setSel]);

  const clickCond = useStore((s) => s.clickCondition);
  const addConstraint = useStore((s) => s.addConstraint);
  const addJunctionMember = useStore((s) => s.addJunctionMember);
  const setConnecting = useStore((s) => s.setConnecting);

  const onNodeClick = useCallback((e, node) => {
    clickCond(e, node.id);
  }, [clickCond]);

  const onConnect = useCallback((connection) => {
    const { source, sourceHandle, target, targetHandle } = connection;
    const from = sourceHandle || source;
    const to = targetHandle || target;
    if (from && to && from !== to) {
      const isJunc = model.junctions.some((j) => j.id === to);
      if (isJunc) {
        addJunctionMember(to, from);
      } else {
        addConstraint(from, to);
      }
    }
  }, [model.junctions, addConstraint, addJunctionMember]);

  const onConnectStart = useCallback(() => {
    setConnecting(true);
  }, [setConnecting]);

  const onConnectEnd = useCallback(() => {
    setConnecting(false);
  }, [setConnecting]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgeClick,
    onNodeClick,
    onConnect,
    onConnectStart,
    onConnectEnd,
  };
}
