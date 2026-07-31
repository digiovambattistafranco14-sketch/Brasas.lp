# Brasas.lp — sitio web

Sitio estático, sin build ni dependencias. Se abre haciendo doble clic en `index.html`
y se sube tal cual a cualquier hosting (Netlify, Vercel, GitHub Pages, Hostinger…).

```
index.html
assets/
  css/style.css      ← todo el diseño
  js/main.js         ← carrusel, animaciones, nav
  favicon.svg
  img/               ← fotos optimizadas (avif + webp + jpg de respaldo)
img/                 ← originales en PNG (no se usan en la web, guardalos de backup)
```

## Qué es verificado y qué no

**Datos reales** (de la ficha de Google, confirmados):

- Nombre: Brasas.lp
- Dirección: 143 N.º 1910, e/ 59 y 60 — La Plata (B1900), Buenos Aires
- Teléfono: +54 9 11 4422-8555 (`011 15-4422-8555`)
- Rubro: restaurante / parrilla
- Horario: jueves, viernes y sábado de 12 a 16. Resto de la semana, cerrado
- Mesas al aire libre

**Escrito por mí a partir de las fotos** — revisalo y corregí lo que no sea así:

| Dónde | Qué revisar |
|---|---|
| Sección `03 / Lo que sale` | La carta es una propuesta. Sacá o agregá lo que realmente hacen. |
| Sección `01` | Las cuatro tandas (parrilla a la vista, picada, empanadas, mesas afuera) salen de las fotos y de la ficha, pero conviene que las lea alguien de la casa. |
| Textos del carrusel | Atributo `data-caption` de cada `<figure class="slide">`. |
| Hero | "El carbón se prende temprano", "cerramos a las cuatro". |

No hay precios en ningún lado: todo empuja al WhatsApp. Tampoco hay nada de catering
ni de servicio a domicilio, porque no está confirmado que lo hagan.

Si alguna vez confirmás que sí hacen eventos, agregarlo es una sección más.

## WhatsApp

El número se escribe en formato internacional en los enlaces: `https://wa.me/5491144228555`.
Si cambia, buscá y reemplazá `5491144228555` (aparece en el nav, el hero, la carta, el
bloque de datos, el pie, el botón flotante y el JSON-LD).
Los enlaces llevan un mensaje precargado con `?text=` — editalo si querés otro.

## Carrusel

- Tiene 4 fotos: picada, carne al disco, empanadas y sanguchito. La del parrillero no
  está para no repetir la del hero.
- Avanza solo cada 4,8 s con una transición suave (se cambia en `data-interval` del
  `<div class="carousel">`).
- Flechas, puntitos, teclado (← →) y arrastre con el dedo o el mouse.
- Se pausa al pasar el mouse por encima, al navegar con teclado, cuando la pestaña
  queda en segundo plano y cuando la sección no está en pantalla.
- El bucle es infinito de verdad: hay una diapositiva clonada al final, así que de la
  última foto pasa a la primera sin ningún salto visible.
- Respeta "reducir movimiento" del sistema operativo: si está activo, no se mueve solo.

## Fotos

Las cinco PNG originales pesaban **5,0 MB**. En `assets/img/` quedaron en AVIF y WebP
en dos o tres tamaños cada una: el navegador baja **entre 26 y 59 kB por foto**.
Mientras cargan se ve una miniatura borrosa incrustada en el HTML, así que no hay
saltos de maquetación.

Para regenerarlas si cambiás una foto, con Node instalado:

```bash
npm i sharp
# resize a 480 px + ancho original → .avif (q55) y .webp (q76) + un .jpg de respaldo
```

## SEO

En el `<head>` hay un bloque `application/ld+json` de tipo `Restaurant` con la
dirección, el teléfono, el horario y las mesas al aire libre. Es lo que lee Google para
armar la ficha. **Si cambia el horario, cambialo en dos lados**: ahí y en el bloque
visible `.datos` de la sección 04.

## Detalles técnicos

- CSS con `@layer`, variables, `clamp()` y `color-mix()`. Sin frameworks.
- JS vanilla (~5 kB), cargado con `defer`.
- Tipografías: **Bricolage Grotesque** para los titulares (grotesca contemporánea con
  quiebres deliberados en las terminaciones y tamaños ópticos variables), **Archivo**
  para el texto corrido y **JetBrains Mono** para rótulos, numeración y teléfono.
  Desde Google Fonts, con carga no bloqueante. Se cambian en un solo lugar: las
  variables `--f-display`, `--f-body` y `--f-mono` al principio de `style.css`,
  más el `<link>` del `<head>`.
- Bricolage Grotesque **no tiene itálica**. Por eso los acentos de los titulares (las
  palabras en naranja) se resuelven con color y no con cursiva: si le ponés
  `font-style: italic`, el navegador la inclina a la fuerza y queda mal.
- Accesibilidad: contraste AA, foco visible, textos alternativos reales en las fotos,
  enlace para saltar al contenido y áreas de toque de 44 px en móvil.
