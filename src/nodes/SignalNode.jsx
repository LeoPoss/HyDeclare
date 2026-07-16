import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useStore } from "../store";
import { PORT_R, SIG_W } from "../constants";
import Badge from "../components/Badge";
import Tag from "../components/Tag";
import { sigHeight } from "../geometry";

const C = {
  card: "#FFFFFF", faint: "#A1A1AA", blue: "#2563EB", blueSoft: "#EFF6FF",
  sig: "#0369a1", sigSoft: "#e0f2fe", sigStroke: "#bae6fd", sigStroke2: "#7dd3fc",
};
const MONO = "ui-monospace, 'SF Mono', 'JetBrains Mono', 'Roboto Mono', Menlo, monospace";

export default memo(function SignalNode({ id, data }) {
  const model     = useStore((s) => s.model);
  const sel       = useStore((s) => s.sel);
  const clickCond = useStore((s) => s.clickCondition);
  const tagOf     = useStore((s) => s.tagOf);
  const addPort   = useStore((s) => s.addPort);
  const isConnecting = useStore((s) => s.isConnecting);

  const ports = model.ports.filter((p) => p.signal === id);
  const h = sigHeight(ports.length);
  const on = sel?.kind === "signals" && sel.id === id;

  return (
    <div style={{ width: SIG_W, height: h, position: "relative" }}>
      <svg width={SIG_W} height={h} style={{ display: "block", overflow: "visible" }}>
        <rect x={0} y={0} width={SIG_W} height={h} rx={10} fill={C.sigSoft}
          stroke={on ? C.sig : C.sigStroke} strokeWidth={on ? 2 : 1.3} />
        <path d={`M 13 18 q 4.5 -6 9 0 t 9 0`} stroke={C.sig} strokeWidth="1.6" fill="none" />
        <text x={SIG_W / 2} y={h / 2 + 5} fill={C.sig} fontSize="13" fontWeight="600"
          fontFamily={MONO} textAnchor="middle">{data.name}</text>
        {/* + port button */}
        <g onClick={(e) => { e.stopPropagation(); addPort(id); }} style={{ cursor: "pointer" }}>
          <rect x={SIG_W - 48} y={6} width={38} height={16} rx={4} fill="none" stroke={C.sigStroke} strokeWidth={1} />
          <text x={SIG_W - 29} y={17} fill={C.sig} opacity={0.7} fontSize="9" fontWeight="500" fontFamily={MONO} textAnchor="middle" style={{ pointerEvents: "none" }}>+ port</text>
        </g>

        {ports.map((p) => {
          const s = model.signals.find((x) => x.id === p.signal);
          if (!s) return null;
          const mine = model.ports.filter((x) => x.signal === s.id);
          const i = mine.findIndex((x) => x.id === p.id);
          const sh = sigHeight(mine.length);
          const pos = { x: SIG_W, y: sh / 2 - ((mine.length - 1) * 46) / 2 + i * 46 };
          const psel = sel?.kind === "ports" && sel.id === p.id;
          const tg = tagOf(p.id);

          return (
            <g key={p.id}>
              <circle cx={pos.x} cy={pos.y} r={PORT_R}
                fill={C.card}
                stroke={psel ? C.sig : C.sigStroke2}
                strokeWidth={psel ? 2.2 : 1.5}
                onClick={(e) => clickCond(e, p.id)}
                style={{ cursor: "pointer" }} />
              <text x={pos.x} y={pos.y + 4} fill={C.sig} fontSize="10"
                fontFamily={MONO} textAnchor="middle" style={{ pointerEvents: "none" }}>{p.op}{p.k}</text>
              {p.delta != null && (
                <Badge x={pos.x + 28} y={pos.y - 32} d={p.delta}
                  from={{ x: pos.x + PORT_R - 2, y: pos.y - 12 }} />
              )}
              {tg && <Tag x={pos.x} y={pos.y - PORT_R} type={tg.type} />}
            </g>
          );
        })}
      </svg>

      {/* React Flow handles — right side, one source and target per port */}
      {ports.map((p, i) => {
        const mine = model.ports.filter((x) => x.signal === id);
        const sh = sigHeight(mine.length);
        const y = sh / 2 - ((mine.length - 1) * 46) / 2 + i * 46;
        return (
          <React.Fragment key={p.id}>
            <Handle
              type="source"
              id={p.id}
              position={Position.Right}
              style={{
                position: "absolute",
                top: y,
                left: SIG_W + PORT_R,
                transform: "translate(-50%, -50%)",
                background: "transparent",
                border: "none",
                width: 0,
                height: 0,
              }}
              className="port-handle"
            />
            <Handle
              type="target"
              id={p.id}
              position={Position.Right}
              style={{
                position: "absolute",
                top: y,
                left: SIG_W + PORT_R,
                transform: "translate(-50%, -50%)",
                background: "transparent",
                border: "none",
                width: 0,
                height: 0,
                pointerEvents: isConnecting ? "all" : "none",
              }}
              className="port-handle"
            />
          </React.Fragment>
        );
      })}
    </div>
  );
});
