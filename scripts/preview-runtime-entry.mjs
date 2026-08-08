// Entry bundled by scripts/build-preview-runtime.mjs into a single classic script that
// exposes React and react-dom/client as iframe globals. The generated-code preview runs
// inside a sandboxed, opaque-origin iframe (sandbox="allow-scripts"), so it cannot import
// bare module specifiers or reach the parent's React instance — it needs its own copy of
// the runtime loaded as a plain <script src>. React 19 ships no UMD build, so we vendor one
// from the installed package rather than pulling from a CDN (Findings Log, Research Finding 7).
import * as React from "react";
import { createRoot } from "react-dom/client";

window.React = React;
window.ReactDOM = { createRoot };

