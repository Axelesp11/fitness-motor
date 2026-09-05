# Motor Fitness 3.0

Motor local-first de entrenamiento y nutrición orientativa para adultos sanos.

## Qué hace

- Calcula BMR, gasto energético inicial, calorías objetivo y macros.
- Separa actividad diaria del coste estimado del entrenamiento.
- Con suficientes check-ins de peso + calorías, pasa gradualmente a un gasto **adaptativo**.
- Genera Full Body, Upper/Lower o PPL según frecuencia.
- Ajusta ejercicios por equipo, tiempo, objetivo y grupo prioritario.
- Trabaja con series reales: carga, repeticiones y RIR por set.
- Usa doble progresión por mayoría de series para subir, mantener o bajar carga.
- Estima e1RM y detecta récords de fuerza/volumen.
- Sugiere calentamientos para movimientos con carga externa.
- Incluye temporizador de descanso.
- Ajusta volumen por recuperación diaria.
- Lleva un mesociclo automático de seis semanas con descarga.
- Calcula volumen semanal equivalente por grupo muscular.
- Guarda todo en el navegador y permite exportar/importar un respaldo JSON.

## Arquitectura

- React 19
- Vite 8
- Vitest 5
- Sin backend ni cuentas en esta etapa.
- Estado persistente versionado en `localStorage` (`fitness-motor-v3`).

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
- [`docs/BENCHMARK.md`](docs/BENCHMARK.md)

## Alcance y seguridad

Las calorías, el gasto y el e1RM son estimaciones. El motor no sustituye valoración médica, nutricional ni de rehabilitación. Está calibrado para adultos sanos; dolor agudo, lesión, mareo, dolor torácico o síntomas inusuales deben prevalecer sobre cualquier recomendación automática.
