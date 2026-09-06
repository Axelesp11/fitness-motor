# Motor Fitness PWA

Objetivo: experiencia instalable y app-like en Android premium.

- Instalación desde navegador compatible mediante `beforeinstallprompt`.
- `display_override` intenta `fullscreen` y conserva `standalone` como fallback.
- Service worker local para shell y assets estáticos.
- Splash generado por Android desde `manifest.webmanifest`, iconos y colores de marca.
- Hápticos con `navigator.vibrate()` únicamente cuando el navegador/dispositivo lo permite.
- La app sigue siendo local-first: no se añade backend ni sincronización remota.

## Hápticos

- Toque corto: tabs y acciones secundarias.
- Confirmación media: guardar/check-in.
- PR/récord: patrón breve doble.
- Final de descanso: patrón breve de aviso.

Los hápticos son mejora progresiva: si la API no existe, no cambia el comportamiento funcional.

## Caché

El service worker usa red primero para navegación y caché para assets estáticos del mismo origen. Esto permite abrir el shell aun con conectividad pobre sin convertir los datos locales del usuario en datos remotos.
