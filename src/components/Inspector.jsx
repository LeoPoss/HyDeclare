import React, { useMemo } from "react";
import { OPS, TEMPLATES } from "../constants";
import { condLabel, conditionSTL, resolveCondition } from "../lib/compiler";
import { useStore } from "../store";
import { Card, H, Muted, Inp, Sel, Btn, Row, Field } from "./UI";

export default function Inspector() {
  const model    = useStore((s) => s.model);
  const sel      = useStore((s) => s.sel);
  const setModel = useStore((s) => s.setModel);
  const setSel   = useStore((s) => s.setSel);
  const tagCond  = useStore((s) => s.tagCondition);
  const upd      = useStore((s) => s.upd);
  const del      = useStore((s) => s.del);
  const addPort  = useStore((s) => s.addPort);

  const allConditions = useMemo(() =>
    [...model.ports.map((p) => p.id), ...model.junctions.map((j) => j.id), ...model.activities.map((a) => a.id)],
    [model]);

  const selObj = sel ? model[sel.kind]?.find((x) => x.id === sel.id) : null;

  if (!selObj)
    return <Card id="section-inspector" className="p-3 shrink-0"><H>Inspector</H><Muted>select a node, port, junction, or constraint</Muted></Card>;

  const wrap = (children) => <Card id="section-inspector" className="p-3 shrink-0"><H>Inspector</H>{children}</Card>;

  const membersList = (jid, members) => (
    <>
      <div className="text-[10.5px] font-medium text-zinc-500 mb-1">Members</div>
      <div className="flex flex-wrap gap-1 mb-2">
        {members.map((mid) => (
          <span key={mid} className="inline-flex items-center gap-1 bg-violet-50 border border-violet-200 rounded px-1.5 py-0.5 text-[10.5px] text-violet-600">
            {condLabel(model, mid)}
            <span onClick={() => upd("junctions", jid, { members: members.filter((x) => x !== mid) })}
              className="cursor-pointer text-zinc-400 font-bold">×</span>
          </span>
        ))}
        {members.length < 2 && <span className="text-red-600 text-[10px]">needs ≥ 2</span>}
      </div>
      <Row>
        <Field label="Add">
          <Sel value="" opts={["", ...allConditions.filter((id) =>
            id !== jid && !members.includes(id) && !wouldCycle(model, jid, id)
          )]} labels={(id) => id === "" ? "select…" : condLabel(model, id)}
            onChange={(v) => v && upd("junctions", jid, { members: [...members, v] })} />
        </Field>
      </Row>
    </>
  );

  if (sel.kind === "signals") return wrap(
    <Row><Field label="Name"><Inp value={selObj.name} onChange={(v) => upd("signals", sel.id, { name: v })} /></Field>
      <Btn onClick={() => addPort(sel.id)}>+ Port</Btn>
      <Btn danger onClick={() => (del("signals", sel.id), setSel(null))}>Delete</Btn></Row>
  );

  if (sel.kind === "activities") return wrap(<>
    <Row><Field label="Name"><Inp value={selObj.name} onChange={(v) => upd("activities", sel.id, { name: v })} /></Field>
      <Btn danger onClick={() => (del("activities", sel.id), setSel(null))}>Delete</Btn></Row>
    <Row><Btn onClick={() => tagCond(sel.id, "Existence")}>Existence 1..*</Btn>
      <Btn danger onClick={() => tagCond(sel.id, "NotExistence")}>Prohibit</Btn></Row>
  </>);

  if (sel.kind === "ports") return wrap(<>
    <Row>
      <Field label="Operator"><Sel value={selObj.op} opts={OPS} onChange={(v) => upd("ports", sel.id, { op: v })} /></Field>
      <Field label="Threshold k"><Inp value={selObj.k} onChange={(v) => upd("ports", sel.id, { k: Number(v) || 0 })} /></Field>
      <Field label="Sustain δ"><Inp value={selObj.delta ?? ""} placeholder="none"
        onChange={(v) => upd("ports", sel.id, { delta: v === "" ? null : Number(v) })} /></Field>
    </Row>
    <Row><Btn onClick={() => tagCond(sel.id, "Existence")}>Existence</Btn>
      <Btn danger onClick={() => tagCond(sel.id, "NotExistence")}>Prohibit</Btn>
      <Btn danger onClick={() => (del("ports", sel.id), setSel(null))}>Delete</Btn></Row>
  </>);

  if (sel.kind === "junctions") return wrap(<>
    <Row>
      <Field label="Operator"><Sel value={selObj.op} opts={["AND","OR"]} onChange={(v) => upd("junctions", sel.id, { op: v })} /></Field>
      <Field label="Sustain δ"><Inp value={selObj.delta ?? ""} placeholder="none"
        onChange={(v) => upd("junctions", sel.id, { delta: v === "" ? null : Number(v) })} /></Field>
      <Btn danger onClick={() => (del("junctions", sel.id), setSel(null))}>Delete</Btn>
    </Row>
    {membersList(sel.id, selObj.members)}
    <div className="text-[11px] font-mono text-zinc-500 bg-zinc-200 rounded px-2 py-1.5 break-words">{conditionSTL(model, sel.id)}</div>
  </>);

  if (sel.kind === "constraints" && selObj.theta1) return wrap(<>
    <Row>
      <Field label="Template"><Sel value={selObj.type} opts={TEMPLATES}
        onChange={(v) => upd("constraints", sel.id, { type: v })} /></Field>
      <Field label="Ia"><Inp value={selObj.Ia[1] ?? ""}
        onChange={(v) => upd("constraints", sel.id, { Ia: [0, v === "m" || v === "" ? v : isNaN(Number(v)) ? v : Number(v)] })} /></Field>
      <Field label="Ir"><Inp value={selObj.Ir[1] ?? ""}
        onChange={(v) => upd("constraints", sel.id, { Ir: [0, v === "m" || v === "" ? v : isNaN(Number(v)) ? v : Number(v)] })} /></Field>
    </Row>
    <Row>
      <Field label="Correlation"><Inp value={selObj.corr ?? ""} placeholder="x.a = y.a"
        onChange={(v) => upd("constraints", sel.id, { corr: v || undefined })} /></Field>
      <Btn danger onClick={() => { del("constraints", sel.id); setSel(null); }}>Delete</Btn>
    </Row>
  </>);

  if (sel.kind === "constraints") return wrap(<>
    <div className="text-zinc-500 text-[11px]">{selObj.type} on {condLabel(model, selObj.theta)}</div>
    <Row className="mt-1"><Btn danger onClick={() => { del("constraints", sel.id); setSel(null); }}>Delete</Btn></Row>
  </>);

  return null;
}

function wouldCycle(m, jid, cand) {
  const walk = (id, seen) => {
    if (id === jid) return true;
    if (seen.has(id)) return false;
    const c = resolveCondition(m, id);
    if (c?.kind !== "junction") return false;
    return c.members.some((x) => walk(x, new Set(seen).add(id)));
  };
  return walk(cand, new Set());
}
