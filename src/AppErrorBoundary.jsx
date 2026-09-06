import { Component } from "react";

const STORAGE_KEY = "fitness-motor-v3";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Motor Fitness render failure", error, info);
  }

  exportRecovery = () => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fitness-motor-recovery-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="runtime-fallback">
        <section>
          <span>MOTOR FITNESS · RECOVERY</span>
          <h1>La interfaz se detuvo.</h1>
          <p>Tus datos locales no se borraron. Puedes exportarlos antes de recargar la aplicación.</p>
          <div>
            <button type="button" onClick={this.exportRecovery}>Exportar recuperación</button>
            <button type="button" onClick={() => window.location.reload()}>Recargar app</button>
          </div>
        </section>
      </main>
    );
  }
}
