import { useEffect, useMemo, useState } from "react";

const NAV_ITEMS = [
  { id: "home", label: "Inicio", target: null, icon: "home" },
  { id: "routine", label: "Entreno", target: "RUTINA ADAPTATIVA", icon: "dumbbell" },
  { id: "progress", label: "Progreso", target: "HISTORIAL RECIENTE", icon: "chart" },
  { id: "settings", label: "Ajustes", target: null, icon: "settings" },
];

function Icon({ name }) {
  if (name === "home") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.5 12 3l8.5 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6H10v6H5a1.5 1.5 0 0 1-1.5-1.5z" /></svg>;
  }
  if (name === "dumbbell") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8v8m3-10v12m10-12v12m3-10v8M7 12h10" /></svg>;
  }
  if (name === "chart") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5m0 14h16M7 15l3-4 3 2 4-6" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Zm8 3.5-1.8-1 .1-2-2-2-.1 2-1.8 1a7 7 0 0 0-2.8-1.6L11 6H9l-.6 2.4A7 7 0 0 0 5.6 10l-1.8-1-2 2 .1 2-1.8 1v2l1.8 1-.1 2 2 2 1.8-1a7 7 0 0 0 2.8 1.6L9 24h2l.6-2.4a7 7 0 0 0 2.8-1.6l1.8 1 2-2-.1-2 1.8-1Z" transform="scale(.78) translate(3.4 -3.1)" /></svg>;
}

function findSection(title) {
  const heading = [...document.querySelectorAll(".section-title")]
    .find((node) => node.textContent?.trim() === title);
  return heading?.closest("section.card, .card") ?? null;
}

function findObjectiveSelect() {
  const fields = [...document.querySelectorAll(".sidebar .field")];
  const field = fields.find((node) => node.querySelector("label")?.textContent?.trim() === "OBJETIVO");
  return field?.querySelector("select") ?? null;
}

function syncGoalTheme() {
  const objective = findObjectiveSelect()?.value || "hipertrofia";
  document.documentElement.dataset.goal = objective;
}

export default function UixLayer({ children }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [active, setActive] = useState("home");
  const navItems = useMemo(() => NAV_ITEMS, []);

  useEffect(() => {
    document.body.classList.add("uix-ready");
    document.documentElement.dataset.uixAnimate = "true";

    const raf = requestAnimationFrame(() => {
      syncGoalTheme();
      const eyebrow = document.querySelector(".eyebrow");
      if (eyebrow) eyebrow.textContent = "MOTOR FITNESS 4.0 · UIX";

      const targets = [...document.querySelectorAll(".card, .exercise")];
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("uix-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });

      targets.forEach((node, index) => {
        node.classList.add("uix-observed");
        node.style.setProperty("--uix-delay", `${Math.min(index * 18, 160)}ms`);
        observer.observe(node);
      });

      window.__fitnessUixObserver = observer;
    });

    const onChange = (event) => {
      if (event.target instanceof HTMLSelectElement && event.target.closest(".sidebar")) syncGoalTheme();
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
      window.__fitnessUixObserver?.disconnect?.();
      delete window.__fitnessUixObserver;
      document.body.classList.remove("uix-ready", "uix-settings-open");
      delete document.documentElement.dataset.uixAnimate;
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
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    findSection(item.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div className="uix-ambient" aria-hidden="true"><i /><i /><i /></div>
      {children}

      <button
        className={`uix-backdrop ${settingsOpen ? "show" : ""}`}
        type="button"
        aria-label="Cerrar ajustes"
        tabIndex={settingsOpen ? 0 : -1}
        onClick={() => setSettingsOpen(false)}
      />
      <button
        className={`uix-settings-close ${settingsOpen ? "show" : ""}`}
        type="button"
        aria-label="Cerrar ajustes"
        tabIndex={settingsOpen ? 0 : -1}
        onClick={() => setSettingsOpen(false)}
      >
        <span>Listo</span><b>×</b>
      </button>

      <nav className="uix-bottom-nav" aria-label="Navegación principal">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={active === item.id ? "active" : ""}
            aria-current={active === item.id ? "page" : undefined}
            onClick={() => goTo(item)}
          >
            <span className="uix-nav-icon"><Icon name={item.icon} /></span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
