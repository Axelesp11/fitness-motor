import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppV4 from "./AppV4.jsx";
import PwaShell from "./PwaShell.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PwaShell>
      <AppV4 />
    </PwaShell>
  </StrictMode>,
);
