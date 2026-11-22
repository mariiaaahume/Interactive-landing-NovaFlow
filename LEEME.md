# NovaFlow v9

Abre `index.html` en Chrome, Safari o Firefox (necesita internet: fuentes y librerías GSAP + Lenis vienen de CDN).
Para trabajar cómodamente, sirve la carpeta con un servidor local: `npx serve .` o Live Server de VS Code.

## Vídeos de fondo (`assets/`)
- `hero.mp4` → fondo del hero
- `scalable.mp4` → tarjeta Scalable Solutions (zoom hacia el cursor al pasar el ratón)
- `support.mp4` → fondo completo de la tarjeta AI Customer Support (con los puntos de Figma encima: `support-dots.svg`)
- `cta.mp4` → tarjeta "Ready to save time and scale smarter?"
- Cada vídeo tiene su `-poster.jpg` (primer fotograma) que se ve mientras carga y si el sistema tiene "reducir movimiento".
- Los vídeos solo se reproducen mientras están en pantalla.

## Ajustes rápidos
- Desactivar el cambio de palabra del titular: en `main.js` comenta `startRotator();`
- Logos del hero: una fila en `index.html` (`.logos`); velocidad en `style.css` (`animation: marquee 38s`)
- Segundo texto del bloqueo de lectura: en `index.html`, dentro de `#leadB`
- Pausa antes de "A trusted AI-powered": altura de `.push-hold`; tiempo que el titular queda fijo: `padding-bottom` de `.partner__pin`
