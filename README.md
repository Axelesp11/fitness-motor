# Motor Fitness 3.1

Motor local-first de entrenamiento y nutrición orientativa para adultos sanos.

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
- Usa doble progresión por mayoría de series para subir, mantener o bajar carga.
- Estima e1RM y detecta récords de fuerza/volumen.
- Sugiere calentamientos para movimientos con carga externa.
- Incluye temporizador de descanso.
- Ajusta volumen por recuperación diaria.
- Lleva un mesociclo automático de seis semanas con descarga.
- Calcula volumen semanal equivalente por grupo muscular.
- Muestra dentro de la interfaz el fundamento de la programación activa.
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
- [`docs/PROGRAMMING.md`](docs/PROGRAMMING.md)
- [`docs/BENCHMARK.md`](docs/BENCHMARK.md)

## Alcance y seguridad

Las calorías, el gasto y el e1RM son estimaciones. El motor no sustituye valoración médica, nutricional ni de rehabilitación. Está calibrado para adultos sanos; dolor agudo, lesión, mareo, dolor torácico o síntomas inusuales deben prevalecer sobre cualquier recomendación automática. El modo PR prepara trabajo específico submáximo, pero no auto-prescribe un intento máximo.
