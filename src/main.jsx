import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppErrorBoundary from "./AppErrorBoundary.jsx";
import AppV44 from "./AppV44.jsx";
import PwaShell from "./PwaShell.jsx";
import RuntimeGuard from "./RuntimeGuard.jsx";
import "./appV42.css";
import "./appV44.css";
import "./runtime.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary>
      <RuntimeGuard>
        <PwaShell>
          <AppV44 />
        </PwaShell>
      </RuntimeGuard>
    </AppErrorBoundary>
  </StrictMode>,
);
