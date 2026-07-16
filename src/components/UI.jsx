import React from "react";

export function Btn({
                      children,
                      onClick,
                      primary,
                      danger,
                      disabled,
                      small,
                      sample,
                      className = "",
                      ...rest
                    }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center rounded border font-medium cursor-pointer select-none",
        small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
        primary
          ? "bg-blue-600 text-white border-blue-600"
          : danger ? "bg-white text-red-600 border-red-600/30 hover:bg-red-50"
            : sample ? "bg-white text-zinc-500 border-dashed border-zinc-400/60 hover:border-zinc-300 hover:text-zinc-900 italic"
              : "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-200",
        disabled ? "opacity-40 cursor-default pointer-events-none" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "", ...rest }) {
  return (
    <div
      className={["bg-white rounded border border-zinc-200", className].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Inp({ value, onChange, placeholder, className = "", ...rest }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={[
        "font-mono text-[12px] px-2 py-1 rounded border border-zinc-300 bg-white text-zinc-900",
        "outline-none w-full min-w-0 focus:border-blue-600",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}

export function Sel({ value, opts, onChange, labels, inline, className = "", ...rest }) {
  const lab = labels || ((v) => v);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={[
        "font-mono text-[11px] px-2 py-1 rounded border border-zinc-300 bg-white text-zinc-900",
        "cursor-pointer outline-none focus:border-blue-600",
        className,
      ].join(" ")}
      {...rest}
    >
      {opts.map((o) => (
        <option key={o} value={o}>{lab(o)}</option>
      ))}
    </select>
  );
}

export function Row({ children, className = "" }) {
  return <div className={["flex gap-2 items-end mb-2", className].join(" ")}>{children}</div>;
}

export function Field({ label, children, className = "" }) {
  return (
    <div className={["flex flex-col gap-0.5", className].join(" ")}>
      <span className="text-[10.5px] font-medium text-zinc-500">{label}</span>
      {children}
    </div>
  );
}

export function H({ children, className = "" }) {
  return (
    <div className={["text-[12px] font-semibold text-zinc-900 mb-2", className].join(" ")}>
      {children}
    </div>
  );
}

export function Muted({ children }) {
  return <div className="text-zinc-400 text-[11px] italic">{children}</div>;
}
