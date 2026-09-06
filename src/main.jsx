import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppV42 from "./AppV42.jsx";
import PwaShell from "./PwaShell.jsx";
import "./appV42.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PwaShell>
      <AppV42 />
    </PwaShell>
  </StrictMode>,
);
