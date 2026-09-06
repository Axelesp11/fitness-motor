import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export default function RuntimeGuard({ children }) {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [updateReady, setUpdateReady] = useState(false);
  const controllerSeen = useRef(Boolean(navigator.serviceWorker?.controller));

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;

    const onControllerChange = () => {
      if (controllerSeen.current) setUpdateReady(true);
      controllerSeen.current = true;
    };

    const checkForUpdate = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
      } catch {
        // Offline or browser throttling: the offline banner handles this state.
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    window.addEventListener("focus", checkForUpdate);
    document.addEventListener("visibilitychange", onVisibility);
    checkForUpdate();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("focus", checkForUpdate);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <>
      {children}
      <AnimatePresence>
        {!online ? (
          <motion.div className="runtime-banner offline" role="status" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <div><strong>Modo offline</strong><span>La sesión y tus registros siguen funcionando en este dispositivo.</span></div>
          </motion.div>
        ) : null}
        {online && updateReady ? (
          <motion.div className="runtime-banner update" role="status" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <div><strong>Nueva versión lista</strong><span>Tu sesión activa está guardada; puedes actualizar sin perderla.</span></div>
            <button type="button" onClick={() => window.location.reload()}>Actualizar</button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
