# Motor Fitness 4.3

Motor local-first de entrenamiento y nutrición orientativa para adultos sanos, diseñado primero para móvil/PWA.

## Qué hace

- Calcula BMR, gasto energético inicial, calorías objetivo y macros.
- Con suficientes check-ins de peso + calorías, pasa gradualmente a un gasto **adaptativo**.
- Separa **objetivo fisiológico** de **split semanal**.
- Programa hipertrofia, fuerza, PR/pico de fuerza, potencia, resistencia muscular y pérdida de grasa.
- Distribuye el trabajo como Full Body, Upper/Lower, PPL + Upper/Lower o PPL ×2 según frecuencia.
- En modo PR permite elegir press banca, sentadilla, peso muerto o press militar con exposición principal y técnica.
- Trabaja con series reales: carga, repeticiones y RIR por set.
- Usa **progresión específica por objetivo**, no una regla única.
- Analiza varias exposiciones antes de declarar regresión.
- Combina recuperación subjetiva con **fatiga objetiva a nivel de programa**: solo recorta volumen si varias regresiones repetidas apuntan a una caída sistémica.
- Estima e1RM y detecta récords de fuerza/volumen.
- Sugiere calentamientos para movimientos con carga externa.
- Incluye temporizador de 1 a 5 minutos con progreso visual.
- Lleva un mesociclo automático de seis semanas con descarga.
- Calcula volumen semanal equivalente por grupo muscular.
- Permite **sustituir ejercicios** por alternativas del mismo grupo y tipo disponibles en el plan y conserva la elección por día.
- Modela una sesión real con `sessionId`, inicio, duración, porcentaje completado y conteo de ejercicios.
- Exige al menos 50% de los ejercicios planificados para cerrar una sesión y evita cierres vacíos.
- Guarda todo en el navegador y permite exportar/importar un respaldo JSON.

## UIX + Reliability 4.3

- React + Motion for React.
- Interfaz training-first: sesión actual, progresión y recuperación antes que configuración.
- Dock inferior para navegación rápida en PWA.
- Paletas visuales, intensidad de movimiento y hápticos configurables.
- RIR mostrado desde la **prescripción real** del plan.
- Historial de sesiones con duración y porcentaje de cumplimiento.
- Estado offline visible sin bloquear los registros locales.
- Comprobación de actualización del Service Worker al abrir/volver a la app; una versión nueva se ofrece sin forzar una recarga durante el entrenamiento.
- Error Boundary de recuperación: ante un fallo de render evita una pantalla blanca y permite exportar el estado local antes de recargar.
- Gradientes dinámicos, glassmorphism y microinteracciones con soporte para `prefers-reduced-motion`.

## Arquitectura

- React 19
- Motion 13
- Vite 8
- Vitest 5
- Sin backend ni cuentas en esta etapa.
- Estado persistente en `localStorage` (`fitness-motor-v3`) con **schema 4** y migración compatible.
- `AppV42.jsx`: experiencia principal.
- `progression.js`: progresión por objetivo.
- `programFatigue.js`: detección de fatiga objetiva sistémica y ajuste conservador.
- `session.js`: sesión activa, progreso, duración y cierre.
- `substitution.js`: sustituciones persistentes compatibles con la estructura del plan.
- `RuntimeGuard.jsx`: conectividad y ciclo de actualización PWA.
- `AppErrorBoundary.jsx`: recuperación ante errores de render.
- `programming.js`: prescripción fisiológica y splits.
- `engine.js`: cálculos base, biblioteca, nutrición y métricas.

## Desarrollo

Requiere Node.js 22.12+.

```bash
npm install
npm run dev
```

Para servir exactamente el build de producción:

```bash
npm run build
npm run preview
```

## Calidad

```bash
npm test
npm run build
npm run check
```

CI ejecuta pruebas unitarias, build de producción, **smoke test HTTP** del sitio compilado (shell, manifest y service worker) y auditoría de dependencias runtime en cada PR a `main`. Los runs redundantes de la misma rama se cancelan para no validar commits obsoletos.

## Evidencia y benchmark

- [`docs/EVIDENCE.md`](docs/EVIDENCE.md)
- [`docs/PROGRAMMING.md`](docs/PROGRAMMING.md)
- [`docs/BENCHMARK.md`](docs/BENCHMARK.md)

## Alcance y seguridad

Las calorías, el gasto y el e1RM son estimaciones. El motor no sustituye valoración médica, nutricional ni de rehabilitación. Dolor agudo, lesión, mareo, dolor torácico o síntomas inusuales deben prevalecer sobre cualquier recomendación automática. El modo PR prepara trabajo específico submáximo, pero no auto-prescribe un intento máximo.
