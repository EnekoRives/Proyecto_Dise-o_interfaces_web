# Estrategias SEO implementadas en Mini N Games

Este documento resume las prácticas SEO visibles en el código actual del sitio y dónde consultarlas.

## 1. Idioma y adaptación a móviles

- Las páginas declaran el idioma español con `lang="es"`, lo que ayuda a los navegadores y buscadores a interpretar el idioma del contenido. Por ejemplo: [index.html](../index.html#L2) y [html/gameBrowser.html](../html/gameBrowser.html#L2).
- Las páginas incluyen la etiqueta `viewport` para adaptar su presentación a pantallas móviles. Por ejemplo: [index.html](../index.html#L5).

## 2. Títulos y descripciones por página

- Cada página HTML define un título y una descripción propios para resumir su contenido en los resultados de búsqueda. Por ejemplo, la portada usa “Inicio | Mini N Games” y describe el catálogo ([index.html](../index.html#L6-L11)); el catálogo tiene su propio título y descripción ([html/gameBrowser.html](../html/gameBrowser.html#L6-L10)).
- El mismo patrón aparece en las páginas informativas, como [html/contacto.html](../html/contacto.html#L6-L10), [html/privacidad.html](../html/privacidad.html#L6-L10) y [html/sobre-nosotros.html](../html/sobre-nosotros.html#L6-L10).
- En la ficha de juego, JavaScript sustituye el título y la descripción genéricos por el nombre y la descripción del juego seleccionado: [js/game-detail.js](./js/game-detail.js#L189-L196).

## 3. Contenido organizado con encabezados

- Las páginas presentan un encabezado principal `<h1>` relacionado con su contenido. Por ejemplo, la portada usa “Descubre juegos independientes” ([index.html](../index.html#L81-L85)) y el catálogo, “Explora juegos” ([html/gameBrowser.html](../html/gameBrowser.html#L77-L80)).
- Se utilizan elementos semánticos como `<main>` y `<section>` para organizar el contenido principal. Ejemplos: [index.html](../index.html#L81-L82) y [html/gameBrowser.html](../html/gameBrowser.html#L77-L78).

## 4. Contenido descriptivo de los juegos

- Los datos de los juegos incluyen títulos, descripciones y categorías, por ejemplo en [data/games.json](../data/games.json#L4-L12). Esos textos se muestran en las tarjetas del catálogo ([js/gameBrowser.js](../js/gameBrowser.js#L70-L87)) y en las fichas individuales ([js/game-detail.js](../js/game-detail.js#L189-L205)).
- Las páginas enlazan entre sí mediante la navegación principal y enlaces a otras secciones. Por ejemplo, la portada enlaza al catálogo y a páginas informativas ([index.html](../index.html#L33-L37), [index.html](../index.html#L149-L152)).

## 5. Textos alternativos en imágenes

- Las imágenes de los juegos tienen textos `alt` descriptivos guardados junto a sus datos, por ejemplo en [data/games.json](../data/games.json#L12-L24). La ficha asigna esos textos a las imágenes y activa la carga diferida (`loading="lazy"`) en [js/game-detail.js](../js/game-detail.js#L207-L213). Esto mejora la accesibilidad y ayuda a describir el contenido de las imágenes.
- El logotipo también dispone de texto alternativo, como se ve en [index.html](../index.html#L28-L29).

## Aspectos no encontrados en el código revisado

No se han encontrado archivos o etiquetas para `sitemap.xml`, `robots.txt`, URL canónica (`canonical`), datos estructurados (`schema.org`) ni metadatos para compartir en redes sociales (`Open Graph` o `Twitter Cards`). Por tanto, no se documentan como estrategias implementadas.
