import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import PwaShell from "./PwaShell.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PwaShell>
      <App />
    </PwaShell>
  </StrictMode>,
);
