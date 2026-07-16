import { useState, useEffect, useRef } from "react";
import { createHighlighter } from "shiki";

let highlighter = null;
let initPromise = null;

function getHighlighter() {
  if (highlighter) return Promise.resolve(highlighter);
  if (!initPromise) {
    initPromise = createHighlighter({
      themes: ["github-dark"],
      langs: ["sql"],
    }).then((h) => { highlighter = h; return h; });
  }
  return initPromise;
}

export function useShiki(src) {
  const [html, setHtml] = useState("");
  const lastSrc = useRef(src);

  useEffect(() => {
    if (!src) return;
    lastSrc.current = src;
    let cancelled = false;
    getHighlighter().then((h) => {
      if (cancelled || lastSrc.current !== src) return;
      setHtml(h.codeToHtml(src, { lang: "sql", theme: "github-dark" }));
    });
    return () => { cancelled = true; };
  }, [src]);

  if (!src) return "";
  return html;
}
