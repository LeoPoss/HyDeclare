import React, { useRef, useMemo } from "react";
import { useStore } from "../store";
import { exCooling, exReactor } from "../examples/index";
import { Btn } from "./UI";

export default function Header() {
  const model       = useStore((s) => s.model);
  const setModel    = useStore((s) => s.setModel);
  const setSel      = useStore((s) => s.setSel);
  const newModel    = useStore((s) => s.newModel);
  const loadExample = useStore((s) => s.loadExample);
  const addSignal   = useStore((s) => s.addSignal);
  const addActivity = useStore((s) => s.addActivity);
  const addJunction = useStore((s) => s.addJunction);
  const flash       = useStore((s) => s.flash);
  const fileRef     = useRef(null);

  const download = (text, name, type) => {
    const b = new Blob([text], { type }); const u = URL.createObjectURL(b);
    const a = document.createElement("a"); a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u);
  };

  const importModel = (file) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const raw = JSON.parse(String(r.result));
        for (const k of ["signals","ports","junctions","activities","constraints"])
          if (!Array.isArray(raw[k])) throw new Error(`missing array: ${k}`);
        setModel(raw); setSel(null);
        flash("Model imported");
      } catch (err) { flash(`Import failed: ${err.message}`); }
    };
    r.readAsText(file);
  };

  return (
    <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-2 shrink-0 border-b border-zinc-200 bg-white">
      <span className="text-[15px] font-bold tracking-tight mr-1">HyDeclare</span>
      <Btn onClick={() => { newModel(); }}>New</Btn>
      <Btn onClick={() => fileRef.current.click()}>Import</Btn>
      <Btn onClick={() => download(JSON.stringify(model, null, 2), "hydeclare-model.json", "application/json")}>Export</Btn>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) importModel(e.target.files[0]); e.target.value = ""; }} />
      <span className="w-px h-5 bg-zinc-300 mx-1" />
      <span className="text-[10px] text-zinc-400 uppercase tracking-wide mr-0.5">examples</span>
      <Btn sample onClick={() => loadExample(exCooling)}>Cooling</Btn>
      <Btn sample onClick={() => loadExample(exReactor)}>Reactor</Btn>
      <div className="flex-1" />
      <Btn onClick={addSignal}>+ Signal</Btn>
      <Btn onClick={addActivity}>+ Task</Btn>
      <Btn primary onClick={addJunction}>+ Gate</Btn>
    </div>
  );
}
