import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import "./uix.css";

const NAV_ITEMS = [
  { id: "home", label: "Inicio", target: null, icon: "home" },
  { id: "routine", label: "Entreno", target: "RUTINA ADAPTATIVA", icon: "dumbbell" },
  { id: "progress", label: "Progreso", target: "HISTORIAL RECIENTE", icon: "chart" },
  { id: "settings", label: "Ajustes", target: null, icon: "settings" },
];

const GOAL_GRADIENTS = {
  hipertrofia: ["#ff4f87", "#ff9850"],
  fuerza: ["#6478ff", "#a46bff"],
  pr: ["#8b5cff", "#ff4fd1"],
  potencia: ["#ffd447", "#39d9ff"],
  resistencia: ["#22d7c1", "#5c8cff"],
  perdida: ["#71df61", "#23d8bd"],
};

function Icon({ name }) {
  if (name === "home") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.5 12 3l8.5 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6H10v6H5a1.5 1.5 0 0 1-1.5-1.5z" /></svg>;
  if (name === "dumbbell") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8v8m3-10v12m10-12v12m3-10v8M7 12h10" /></svg>;
  if (name === "chart") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5m0 14h16M7 15l3-4 3 2 4-6" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Zm7.2 3.5-1.6-.9.1-1.8-2-2-1.8.1-.9-1.6h-2l-.9 1.6-1.8-.1-2 2 .1 1.8-1.6.9v2l1.6.9-.1 1.8 2 2 1.8-.1.9 1.6h2l.9-1.6 1.8.1 2-2-.1-1.8 1.6-.9Z" /></svg>;
}

function findSection(title) {
  const heading = [...document.querySelectorAll(".section-title")].find((node) => node.textContent?.trim() === title);
  return heading?.closest("section.card, .card") ?? null;
}

function objectiveValue() {
  const fields = [...document.querySelectorAll(".sidebar .field")];
  const field = fields.find((node) => node.querySelector("label")?.textContent?.trim() === "OBJETIVO");
  return field?.querySelector("select")?.value || "hipertrofia";
}

export default function UixLayer({ children }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [goal, setGoal] = useState("hipertrofia");
  const reduceMotion = useReducedMotion();
  const navItems = useMemo(() => NAV_ITEMS, []);
  const colors = GOAL_GRADIENTS[goal] || GOAL_GRADIENTS.hipertrofia;

  useEffect(() => {
    document.body.classList.add("uix-ready");
    const raf = requestAnimationFrame(() => {
      const nextGoal = objectiveValue();
      setGoal(nextGoal);
      document.documentElement.dataset.goal = nextGoal;
      const eyebrow = document.querySelector(".eyebrow");
      if (eyebrow) eyebrow.textContent = "MOTOR FITNESS 4.0 · UIX";
    });

    const onChange = (event) => {
      if (!(event.target instanceof HTMLSelectElement) || !event.target.closest(".sidebar")) return;
      const nextGoal = objectiveValue();
      setGoal(nextGoal);
      document.documentElement.dataset.goal = nextGoal;
    };
    const onKey = (event) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };

    document.addEventListener("change", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("change", onChange);
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("uix-ready", "uix-settings-open");
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("uix-settings-open", settingsOpen);
  }, [settingsOpen]);

  const goTo = (item) => {
    if (item.id === "settings") {
      setSettingsOpen(true);
      setActive("settings");
      return;
    }
    setSettingsOpen(false);
    setActive(item.id);
    if (!item.target) {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      return;
    }
    findSection(item.target)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <motion.div
      className="uix-app-scope"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .42, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="uix-ambient" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <motion.i
            key={index}
            style={{ background: index === 1 ? colors[1] : colors[0] }}
            animate={reduceMotion ? undefined : index === 0
              ? { x: [0, 90, 20], y: [0, -30, 20], scale: [1, 1.12, .96] }
              : index === 1
                ? { x: [0, -80, -15], y: [0, 65, 10], scale: [1, .9, 1.08] }
                : { x: [-20, 60, 0], y: [0, -70, -10], scale: [.9, 1.12, 1] }}
            transition={{ duration: 12 + index * 2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          />
        ))}
      </div>

      {children}

      <AnimatePresence>
        {settingsOpen ? (
          <motion.button
            className="uix-backdrop"
            type="button"
            aria-label="Cerrar ajustes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: .22 }}
            onClick={() => setSettingsOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen ? (
          <motion.button
            className="uix-settings-close"
            type="button"
            aria-label="Cerrar ajustes"
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: .94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: .95 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            onClick={() => setSettingsOpen(false)}
          >
            <span>Listo</span><b>×</b>
          </motion.button>
        ) : null}
      </AnimatePresence>

      <motion.nav
        className="uix-bottom-nav"
        aria-label="Navegación principal"
        initial={reduceMotion ? false : { y: 28, opacity: 0 }}
        animate={{ y: settingsOpen ? 120 : 0, opacity: settingsOpen ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 32, delay: .08 }}
      >
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            type="button"
            className={active === item.id ? "active" : ""}
            aria-current={active === item.id ? "page" : undefined}
            whileTap={reduceMotion ? undefined : { scale: .9 }}
            onClick={() => goTo(item)}
          >
            {active === item.id ? (
              <motion.span
                className="uix-active-pill"
                layoutId="uix-nav-active"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            ) : null}
            <motion.span
              className="uix-nav-icon"
              animate={active === item.id && !reduceMotion ? { y: -2, scale: 1.08 } : { y: 0, scale: 1 }}
            >
              <Icon name={item.icon} />
            </motion.span>
            <span>{item.label}</span>
          </motion.button>
        ))}
      </motion.nav>
    </motion.div>
  );
}
