import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import "./pwa.css";

const UI_KEY = "fitness-motor-uix-v1";

const PALETTES = [
  { id: "ember", label: "Ember", color: "#ff6638" },
  { id: "electric", label: "Volt", color: "#b8ff39" },
  { id: "aqua", label: "Aqua", color: "#43e6ff" },
  { id: "ultraviolet", label: "Ultra", color: "#aa79ff" },
];

function readUiPrefs() {
  try {
    const value = JSON.parse(localStorage.getItem(UI_KEY) || "{}");
    return {
      palette: PALETTES.some((item) => item.id === value.palette) ? value.palette : "ember",
      motion: ["full", "soft", "reduced"].includes(value.motion) ? value.motion : "full",
      haptics: value.haptics !== false,
    };
  } catch {
    return { palette: "ember", motion: "full", haptics: true };
  }
}

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches
    || window.matchMedia?.("(display-mode: fullscreen)").matches
    || window.navigator.standalone === true;
}

function Icon({ name }) {
  const paths = {
    home: <><path d="M3 10.8 12 3l9 7.8"/><path d="M5.4 9.7V21h13.2V9.7"/><path d="M9.2 21v-6.6h5.6V21"/></>,
    bolt: <path d="M13.2 2 5.5 13h5.3L9.9 22l8.6-12.2H13z"/>,
    chart: <><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 3-4 3 2 5-7"/></>,
    gear: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    close: <><path d="M6 6l12 12"/><path d="M18 6 6 18"/></>,
  };
  return <svg className="ux-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export default function PwaShell({ children }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefs, setPrefs] = useState(readUiPrefs);
  const motionLevel = prefs.motion;
  const motionOff = motionLevel === "reduced";

  const buzz = (pattern) => {
    if (!prefs.haptics || document.visibilityState !== "visible") return;
    if (typeof navigator.vibrate === "function") navigator.vibrate(pattern);
  };

  useEffect(() => {
    document.documentElement.dataset.palette = prefs.palette;
    document.documentElement.dataset.motion = prefs.motion;
    localStorage.setItem(UI_KEY, JSON.stringify(prefs));
  }, [prefs]);

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
  }, [prefs.haptics]);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return undefined;
    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    const onClick = (event) => {
      const button = event.target.closest?.("button");
      if (!button || button.disabled || button.closest(".ux-dock") || button.closest(".ux-settings-sheet")) return;
      if (button.classList.contains("save-btn") || button.classList.contains("primary-btn")) {
        buzz(18);
        return;
      }
      if (button.classList.contains("tab") || button.classList.contains("timer-btn") || button.classList.contains("secondary-btn") || button.closest(".rest-actions")) buzz(8);
    };
    document.addEventListener("click", onClick, { passive: true });
    return () => document.removeEventListener("click", onClick);
  }, [prefs.haptics]);

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
  }, [prefs.haptics]);

  const goTo = (selector) => {
    buzz(9);
    document.querySelector(selector)?.scrollIntoView({
      behavior: motionOff ? "auto" : "smooth",
      block: "start",
    });
  };

  const install = async () => {
    if (!installPrompt) return;
    buzz(12);
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice?.outcome === "accepted") setInstallPrompt(null);
  };

  const setPalette = (palette) => {
    buzz(10);
    setPrefs((current) => ({ ...current, palette }));
  };

  const setMotion = (nextMotion) => {
    buzz(8);
    setPrefs((current) => ({ ...current, motion: nextMotion }));
  };

  const spring = motionLevel === "full"
    ? { type: "spring", stiffness: 420, damping: 31, mass: .8 }
    : { duration: .24, ease: [0.22, 1, 0.36, 1] };

  return (
    <MotionConfig reducedMotion={motionOff ? "always" : "user"}>
      <div className="ux-root">
        <div className="ux-ambient" aria-hidden="true">
          <motion.i animate={motionOff ? undefined : { x: [0, 90, 18], y: [0, 55, 105], scale: [1, 1.15, .92] }} transition={{ duration: 15, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }} />
          <motion.i animate={motionOff ? undefined : { x: [0, -85, -22], y: [0, 75, 125], scale: [1, .88, 1.12] }} transition={{ duration: 19, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }} />
          <motion.i animate={motionOff ? undefined : { x: [0, 70, 120], y: [0, -45, -88], scale: [1, 1.2, .96] }} transition={{ duration: 22, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }} />
        </div>

        {children}

        <AnimatePresence>
          {!installed && installPrompt ? (
            <motion.button
              className="pwa-install"
              type="button"
              onClick={install}
              initial={{ opacity: 0, y: 18, x: "-50%", scale: .96 }}
              animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
              exit={{ opacity: 0, y: 14, x: "-50%", scale: .96 }}
              transition={spring}
              whileTap={{ scale: .97 }}
            >
              <span className="pwa-install-icon" aria-hidden="true">↓</span>
              <span><strong>Instalar Motor Fitness</strong><small>Abrir como app en tu teléfono</small></span>
            </motion.button>
          ) : null}
        </AnimatePresence>

        <motion.nav
          className="ux-dock"
          aria-label="Navegación rápida"
          initial={{ opacity: 0, y: 32, x: "-50%", scale: .92 }}
          animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
          transition={{ ...spring, delay: .08 }}
        >
          <motion.button type="button" whileTap={{ scale: .9 }} onClick={() => goTo(".header")}><Icon name="home"/><span>Inicio</span></motion.button>
          <motion.button className="ux-dock-main" type="button" whileTap={{ scale: .9 }} onClick={() => goTo(".routine-card")}><Icon name="bolt"/><span>Entreno</span></motion.button>
          <motion.button type="button" whileTap={{ scale: .9 }} onClick={() => goTo(".history")}><Icon name="chart"/><span>Progreso</span></motion.button>
          <motion.button type="button" whileTap={{ scale: .9 }} onClick={() => { buzz(9); setSettingsOpen(true); }}><Icon name="gear"/><span>Ajustes</span></motion.button>
        </motion.nav>

        <AnimatePresence>
          {settingsOpen ? (
            <motion.div
              className="ux-settings-layer"
              role="presentation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: .2 }}
              onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}
            >
              <motion.section
                className="ux-settings-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ux-settings-title"
                initial={{ opacity: 0, y: 48, scale: .955 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 34, scale: .97 }}
                transition={spring}
              >
                <div className="ux-sheet-handle" aria-hidden="true" />
                <div className="ux-sheet-head">
                  <div><span>UIX CONTROL</span><h2 id="ux-settings-title">Hazla tuya.</h2></div>
                  <motion.button className="ux-close" type="button" aria-label="Cerrar ajustes" whileTap={{ scale: .88, rotate: 4 }} onClick={() => setSettingsOpen(false)}><Icon name="close"/></motion.button>
                </div>

                <div className="ux-setting-block">
                  <div className="ux-setting-copy"><strong>Color de energía</strong><span>Cambia la identidad visual completa.</span></div>
                  <div className="ux-palettes">
                    {PALETTES.map((item) => (
                      <motion.button key={item.id} type="button" className={prefs.palette === item.id ? "active" : ""} whileTap={{ scale: .92 }} onClick={() => setPalette(item.id)}>
                        <motion.i layout style={{ "--swatch": item.color }} animate={prefs.palette === item.id ? { scale: [1, 1.16, 1], rotate: [0, 7, 0] } : { scale: 1 }} transition={{ duration: .34 }} />
                        <span>{item.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="ux-setting-block">
                  <div className="ux-setting-copy"><strong>Movimiento</strong><span>Cuánto vive y responde la interfaz.</span></div>
                  <div className="ux-segmented">
                    {[ ["full","Máximo"], ["soft","Suave"], ["reduced","Mínimo"] ].map(([value,label]) => (
                      <motion.button key={value} className={prefs.motion === value ? "active" : ""} type="button" whileTap={{ scale: .94 }} onClick={() => setMotion(value)}>{label}</motion.button>
                    ))}
                  </div>
                </div>

                <motion.button className="ux-toggle-row" type="button" whileTap={{ scale: .985 }} onClick={() => setPrefs((current) => ({ ...current, haptics: !current.haptics }))}>
                  <span><strong>Respuesta háptica</strong><small>Vibración ligera en acciones importantes.</small></span>
                  <i className={prefs.haptics ? "on" : ""}><b /></i>
                </motion.button>

                <div className="ux-sheet-note">Los ajustes visuales se guardan solo en este dispositivo.</div>
              </motion.section>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
