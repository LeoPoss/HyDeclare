import React, { useMemo } from "react";
import { download } from "../download";
import { compile, coverage, validate } from "../lib/compiler";
import { useStore } from "../store";
import { Card, Muted, Btn } from "./UI";
import { useShiki } from "../useShiki";

function EplBlock({ src }) {
  const html = useShiki(src);
  return (
    <div
      className="m-0 p-2.5 rounded bg-[#111114] font-mono text-[10.5px] leading-[1.6] overflow-auto"
      style={{ background: "#111114" }}
    >
      <style>{".shiki pre, .shiki code { white-space: pre-wrap !important; word-break: break-word !important; background: transparent !important; } .shiki { background: transparent !important; }"}</style>
      <div dangerouslySetInnerHTML={{ __html: html || `<span style="color:#8b949e">${src}</span>` }} />
    </div>
  );
}

/* Outside the core is not an error: the model denotes a formula either way. */
function CoreNote({ reason }) {
  return (
    <div className="mt-1.5 p-1.5 rounded border border-amber-500/40 bg-amber-50 text-[10px] leading-[1.4] text-amber-800">
      <span className="font-semibold">outside the executable core · </span>{reason}
    </div>
  );
}

function StlCard({ s, on, onClick }) {
  return (
    <div onClick={onClick} className={["mb-1.5 p-2 rounded border cursor-pointer",
      on ? "border-blue-600 bg-blue-50" : "border-zinc-200 bg-white"].join(" ")}>
      <div className="flex justify-between items-center mb-1">
        <span className={["font-mono text-[10.5px] font-bold", on ? "text-blue-600" : "text-zinc-500"].join(" ")}>{s.id}</span>
        <span className={["text-[9.5px] font-semibold rounded px-1.5 py-px",
          on ? "text-blue-600" : "text-zinc-400 bg-zinc-200"].join(" ")}>{s.type}</span>
      </div>
      <div className="font-mono text-[11px] text-zinc-900 break-words leading-[1.5] whitespace-pre-wrap">{s.formula}</div>
      {s.outside && <CoreNote reason={s.outside} />}
    </div>
  );
}

function ErrorPill({ e }) {
  return (
    <div className="mb-1 p-1.5 rounded border border-red-600/30 bg-red-50 text-[10.5px] leading-[1.4]">
      <span className="font-mono font-bold text-red-600 mr-1">{e.rule}</span>
      <span className="text-red-600/50 mr-1">[{e.id}]</span>
      <span className="text-zinc-900">{e.msg}</span>
    </div>
  );
}

function CorePill({ c }) {
  return (
    <div className="mb-1 p-1.5 rounded border border-amber-500/40 bg-amber-50 text-[10.5px] leading-[1.4]">
      <span className="font-mono font-bold text-amber-700 mr-1">{c.type}</span>
      <span className="text-amber-700/60 mr-1">[{c.id}]</span>
      <span className="text-zinc-900">{c.reason}</span>
    </div>
  );
}

export default function CodePanel() {
  const model    = useStore((s) => s.model);
  const tab      = useStore((s) => s.tab);
  const setTab   = useStore((s) => s.setTab);
  const sel      = useStore((s) => s.sel);
  const setSel   = useStore((s) => s.setSel);

  const compiled = useMemo(() => compile(model), [model]);
  const errors   = useMemo(() => validate(model), [model]);
  const notices  = useMemo(() => coverage(model), [model]);
  const eplText  = useMemo(() =>
    compiled.epl.filter((e) => e.stmts.length)
      .map((e) => `-- ${e.id} : ${e.type}\n${e.stmts.join("\n\n")}`)
      .join("\n\n" + "=".repeat(50) + "\n\n"),
    [compiled]);

  return (
    <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-zinc-200 shrink-0">
        {["stl","epl","checks"].map((t) => (
          <div key={t} onClick={() => setTab(t)}
            className={["px-2.5 py-1 rounded cursor-pointer text-[11px] font-semibold",
              tab === t ? "bg-zinc-200 text-zinc-900" : "text-zinc-500 hover:text-zinc-900"].join(" ")}>
            {t.toUpperCase()}
            {t === "checks" && errors.length > 0 && <span className="text-red-600 ml-1">{errors.length}</span>}
            {t === "checks" && notices.length > 0 && <span className="text-amber-600 ml-1">{notices.length}</span>}
          </div>
        ))}
        <div className="flex-1" />
        {tab === "epl" && (
          <Btn small primary disabled={!eplText} onClick={() => download(eplText, "hydeclare.epl", "text/plain")}>
            Export .epl</Btn>
        )}
      </div>

      <div className="flex-1 overflow-auto p-2 min-h-0">
        {tab === "stl" && (compiled.stl.length === 0 ? <Muted>no constraints yet</Muted> :
          compiled.stl.map((s) => (
            <StlCard key={s.id} s={s} on={sel?.kind === "constraints" && sel.id === s.id}
              onClick={() => setSel({ kind: "constraints", id: s.id })} />
          ))
        )}

        {tab === "epl" && (compiled.epl.length === 0 ? <Muted>no constraints yet</Muted> :
          compiled.epl.map((e) => (
            <div key={e.id} className="mb-3">
              <div className="text-[10.5px] font-semibold text-zinc-500 mb-1 font-mono">{e.id} : {e.type}</div>
              {e.outside
                ? <CoreNote reason={e.outside} />
                : e.stmts.map((stmt, i) => <div key={i} className="mb-1.5"><EplBlock src={stmt} /></div>)}
            </div>
          ))
        )}

        {tab === "checks" && (
          <div>
            {errors.length === 0 ? (
              <div className="text-green-700 text-[11px] font-semibold mb-3">✓ Well-formed (WF1–WF5)</div>
            ) : (
              <div className="mb-3">
                <div className="text-red-600 text-[11px] font-bold mb-2">
                  {errors.length} well-formedness issue{errors.length > 1 ? "s" : ""}
                </div>
                {errors.map((e, i) => <ErrorPill key={i} e={e} />)}
              </div>
            )}

            {notices.length === 0 ? (
              <div className="text-green-700 text-[11px] font-semibold">✓ Fully inside the executable core</div>
            ) : (
              <div>
                <div className="text-amber-700 text-[11px] font-bold mb-1">
                  {notices.length} constraint{notices.length > 1 ? "s" : ""} outside the executable core
                </div>
                <div className="text-zinc-500 text-[10px] mb-2 leading-[1.4]">
                  The notation admits these and they are well-formed. This compiler emits no EPL for them.
                </div>
                {notices.map((c, i) => <CorePill key={i} c={c} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
