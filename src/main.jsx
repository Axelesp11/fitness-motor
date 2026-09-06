import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppErrorBoundary from "./AppErrorBoundary.jsx";
import AppV42 from "./AppV42.jsx";
import PwaShell from "./PwaShell.jsx";
import RuntimeGuard from "./RuntimeGuard.jsx";
import "./appV42.css";
import "./runtime.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary>
      <RuntimeGuard>
        <PwaShell>
          <AppV42 />
        </PwaShell>
      </RuntimeGuard>
    </AppErrorBoundary>
  </StrictMode>,
);
