import { useEffect, useState } from "react";
import "./pwa.css";

function buzz(pattern) {
  if (document.visibilityState !== "visible") return;
  if (typeof navigator.vibrate === "function") navigator.vibrate(pattern);
}

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches
    || window.matchMedia?.("(display-mode: fullscreen)").matches
    || window.navigator.standalone === true;
}

export default function PwaShell({ children }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setInstalled(true);
      buzz([20, 35, 30]);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return undefined;
    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    const onClick = (event) => {
      const button = event.target.closest?.("button");
      if (!button || button.disabled) return;

      if (button.classList.contains("save-btn") || button.classList.contains("primary-btn")) {
        buzz(18);
        return;
      }
      if (
        button.classList.contains("tab")
        || button.classList.contains("timer-btn")
        || button.classList.contains("secondary-btn")
        || button.closest(".rest-actions")
      ) {
        buzz(8);
      }
    };

    document.addEventListener("click", onClick, { passive: true });
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    let lastText = "";
    let lastAt = 0;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          const toast = node.matches?.(".toast") ? node : node.querySelector?.(".toast");
          if (!toast) return;
          const text = toast.textContent?.trim() || "";
          const now = Date.now();
          if (!text || (text === lastText && now - lastAt < 1200)) return;
          lastText = text;
          lastAt = now;
          if (/PR|récord/i.test(text)) buzz([24, 40, 34]);
          else if (/Descanso terminado/i.test(text)) buzz([18, 35, 18]);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    buzz(12);
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice?.outcome === "accepted") setInstallPrompt(null);
  };

  return (
    <>
      {children}
      {!installed && installPrompt ? (
        <button className="pwa-install" type="button" onClick={install}>
          <span className="pwa-install-icon" aria-hidden="true">↓</span>
          <span>
            <strong>Instalar Motor Fitness</strong>
            <small>Abrir como app en tu teléfono</small>
          </span>
        </button>
      ) : null}
    </>
  );
}
