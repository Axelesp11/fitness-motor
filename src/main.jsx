import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import PwaShell from "./PwaShell.jsx";
import UixLayer from "./UixLayer.jsx";
import "./uix-patch.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PwaShell>
      <UixLayer>
        <App />
      </UixLayer>
    </PwaShell>
  </StrictMode>,
);
