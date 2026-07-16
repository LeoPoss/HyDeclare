import React from "react";
import { useStore } from "./store";
import Header from "./components/Header";
import Canvas from "./components/Canvas";
import Inspector from "./components/Inspector";
import CodePanel from "./components/CodePanel";

export default function App() {
  const toast      = useStore((s) => s.toast);

  return (
    <div className="font-sans text-[13px] text-zinc-900 flex flex-col h-screen bg-zinc-100 overflow-hidden">
      <Header />

      <div className="flex flex-1 gap-2 px-2 pb-2 min-h-0">
        <div className="flex-1 relative min-w-0 rounded border border-zinc-200 bg-white overflow-hidden">
          {toast && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 items-center
              bg-white border border-zinc-300 rounded shadow text-xs px-3 py-1.5">
              <span className="text-zinc-500">{toast}</span>
            </div>
          )}
          <Canvas />
        </div>

        <div className="w-[380px] flex flex-col gap-2 shrink-0">
          <Inspector />
          <CodePanel />
        </div>
      </div>
    </div>
  );
}
