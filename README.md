# Motor Fitness 4.1

Motor local-first de entrenamiento y nutrición orientativa para adultos sanos, diseñado primero para móvil/PWA.

## Qué hace

- Calcula BMR, gasto energético inicial, calorías objetivo y macros.
- Separa actividad diaria del coste estimado del entrenamiento.
- Con suficientes check-ins de peso + calorías, pasa gradualmente a un gasto **adaptativo**.
- Separa **objetivo fisiológico** de **split semanal**.
- Programa modos específicos para hipertrofia, fuerza, PR/pico de fuerza, potencia, resistencia muscular y pérdida de grasa.
- Distribuye el trabajo como Full Body, Upper/Lower, PPL + Upper/Lower o PPL ×2 según frecuencia.
- En modo PR permite elegir press banca, sentadilla, peso muerto o press militar y busca dos exposiciones semanales compatibles.
- Ajusta ejercicios por equipo, tiempo, objetivo y grupo prioritario.
- Trabaja con series reales: carga, repeticiones y RIR por set.
- Usa **progresión específica por objetivo**, no una regla única para todos los modos.
- Analiza varias exposiciones antes de considerar una regresión y evita descargar por una sola sesión mala.
- Separa el PR principal de la exposición técnica secundaria.
- En potencia prioriza calidad/intención explosiva antes de añadir carga.
- En pérdida de grasa prioriza conservar rendimiento durante el déficit.
- Estima e1RM y detecta récords de fuerza/volumen.
- Sugiere calentamientos para movimientos con carga externa.
- Incluye temporizador de 1 a 5 minutos con progreso visual.
- Ajusta volumen por recuperación diaria.
- Lleva un mesociclo automático de seis semanas con descarga.
- Calcula volumen semanal equivalente por grupo muscular.
- Sigue el progreso real de la sesión por ejercicios registrados y no permite finalizar una sesión vacía.
- Guarda todo en el navegador y permite exportar/importar un respaldo JSON.

## UIX 4.1

- React + Motion for React.
- Interfaz training-first: sesión actual, progresión y recuperación antes que configuración.
- Dock inferior para navegación rápida en PWA.
- Paletas visuales, intensidad de movimiento y hápticos configurables.
- Configuración del **motor de entrenamiento** en un sheet independiente de los ajustes visuales.
- Gradientes dinámicos, glassmorphism y microinteracciones con soporte para `prefers-reduced-motion`.

## Arquitectura

- React 19
- Motion 13
- Vite 8
- Vitest 5
- Sin backend ni cuentas en esta etapa.
- Estado persistente versionado en `localStorage` (`fitness-motor-v3`).
- `AppV4.jsx`: experiencia principal de entrenamiento.
- `progression.js`: progresión/autoregulación por objetivo.
- `session.js`: ventana y progreso de sesión.
- `programming.js`: prescripción fisiológica y splits.
- `engine.js`: cálculos base, biblioteca, nutrición y métricas.

## Desarrollo

Requiere Node.js 22.12+.

```bash
npm install
npm run dev
```

## Calidad

```bash
npm test
npm run build
npm run check
```

CI ejecuta pruebas unitarias, build de producción y auditoría de dependencias runtime en cada PR a `main`.

## Evidencia y benchmark

- [`docs/EVIDENCE.md`](docs/EVIDENCE.md)
- [`docs/PROGRAMMING.md`](docs/PROGRAMMING.md)
- [`docs/BENCHMARK.md`](docs/BENCHMARK.md)

## Alcance y seguridad

Las calorías, el gasto y el e1RM son estimaciones. El motor no sustituye valoración médica, nutricional ni de rehabilitación. Está calibrado para adultos sanos; dolor agudo, lesión, mareo, dolor torácico o síntomas inusuales deben prevalecer sobre cualquier recomendación automática. El modo PR prepara trabajo específico submáximo, pero no auto-prescribe un intento máximo.
