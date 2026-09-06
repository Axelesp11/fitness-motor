# Mobile Luxury Direction

Target principal: Android premium / Honor Magic 7 Pro.

## Principios

- OLED-first: fondos profundos y superficies con contraste fino.
- Movimiento breve: 160–320 ms para interacción, 400–650 ms para entradas.
- Jerarquía clara: cards, métricas y sesión activa deben sentirse táctiles.
- Nada de animación continua innecesaria.
- `prefers-reduced-motion` desactiva transforms y animaciones no esenciales.
- Touch targets amplios y acciones principales cómodas para uso con una mano.

## Motion system

- Cards: fade + translateY al aparecer.
- Métricas: elevación y brillo sutil al actualizar.
- Tabs de sesión: indicador activo y transición de contenido.
- Botones: escala táctil breve al presionar.
- Timer: halo pulsante solo mientras corre.
- Toast: entrada/salida con slide y blur.
- PR/éxito: glow corto, no looping.

## Rendimiento

- Animar preferentemente `transform` y `opacity`.
- Evitar blur animado grande y sombras pesadas en bucle.
- Sin dependencias externas de animación en esta etapa.
