# Benchmark funcional — septiembre 2026

La v3 no intenta clonar otra app. Se compararon patrones de producto para detectar qué faltaba en el prototipo.

## Fitbod

Referencia: https://help.fitbod.me/

Fortalezas observadas:
- selección por equipo disponible;
- duración de sesión;
- progresión adaptativa;
- seguimiento de recuperación;
- variabilidad de ejercicios.

Aplicado en Motor Fitness:
- equipo y duración modifican la sesión;
- recuperación cambia series/RIR;
- ejercicios A/B rotan de forma determinista;
- enfoque muscular opcional.

## Hevy

Referencia: https://www.hevyapp.com/features/

Fortalezas observadas:
- registro por serie;
- valores de la sesión anterior;
- temporizador de descanso;
- RPE/RIR y PRs;
- métricas por grupo muscular.

Aplicado en Motor Fitness:
- registro por serie;
- e1RM y récord de volumen;
- sugerencia de próxima carga;
- temporizador;
- volumen semanal equivalente por músculo.

## RP Hypertrophy

Referencia: https://apps.rpstrength.com/hypertrophy

Fortalezas observadas:
- progresión semana a semana;
- feedback de fatiga/soreness;
- mesociclos y descarga.

Aplicado en Motor Fitness:
- mesociclo automático de seis semanas;
- RIR cambia por semana;
- semana 6 de descarga;
- recuperación puede adelantar una reducción de volumen.

## MacroFactor

Referencia: https://help.macrofactorapp.com/dashboard/expenditure

Fortaleza observada:
- recalcular gasto desde ingesta y tendencia de peso en vez de confiar indefinidamente en una fórmula inicial.

Aplicado en Motor Fitness:
- TDEE inicial por fórmula;
- después de suficiente cobertura de datos, estimación adaptativa y mezcla gradual;
- se expone la fuente y confianza para no presentar falsa precisión.

## Decisiones no implementadas todavía

- nube / autenticación / sincronización multi-dispositivo;
- biblioteca audiovisual de cientos de ejercicios;
- integración con wearables;
- coaching remoto y social;
- periodización avanzada por levantamiento;
- ajuste de calorías con modelos de composición corporal.

Estas funciones requieren backend, contenido, privacidad y más validación; no se añadieron solo para inflar la lista de características.
