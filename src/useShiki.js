import { useState, useEffect } from "react";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import sql from "shiki/langs/sql.mjs";
import githubDark from "shiki/themes/github-dark.mjs";

let highlighter = null;
let initPromise = null;

/* The fine-grained core with one grammar and one theme: the default shiki
   entry point bundles every language it ships. */
function getHighlighter() {
  if (highlighter) return Promise.resolve(highlighter);
  if (!initPromise) {
    initPromise = createHighlighterCore({
      themes: [githubDark],
      langs: [sql],
      engine: createJavaScriptRegexEngine(),
    }).then((h) => { highlighter = h; return h; });
  }
  return initPromise;
}

export function useShiki(src) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    getHighlighter().then((h) => {
      if (cancelled) return;
      setHtml(h.codeToHtml(src, { lang: "sql", theme: "github-dark" }));
    });
    return () => { cancelled = true; };
  }, [src]);

  if (!src) return "";
  return html;
}
