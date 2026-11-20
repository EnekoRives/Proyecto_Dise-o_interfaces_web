# Accesibilidad implementada en Mini N Games

Este documento describe las correcciones de accesibilidad aplicadas a la portada para resolver los avisos detectados en el buscador, el contraste de texto y los controles del carrusel. Estas mejoras no constituyen por sí solas una certificación de conformidad de todo el sitio.

## 1. Buscador accesible

- El campo de búsqueda se identifica como `combobox` y se relaciona con la lista de sugerencias mediante `aria-controls`. Los atributos `aria-autocomplete` y `aria-expanded` comunican el tipo y el estado de las sugerencias ([js/nav-search.js](../js/nav-search.js)).
- La lupa de la cabecera es una etiqueta asociada al campo; tocarla le da foco y expande el buscador en móvil. Su área táctil es de 24 × 24 píxeles.
- Las sugerencias conservan el rol `option`. Se pueden recorrer con las flechas, activar con Enter y cerrar con Escape.

## 2. Contraste de texto

- El texto introductorio usa un gris más oscuro (`#626579`) sobre el fondo de la página (`#fcfaf6`), con una relación de contraste medida de **5,51:1**.
- El enlace «Ver todos» usa un tono de marca más oscuro (`#b5451c`) sobre blanco, con una relación medida de **5,48:1**.
- Ambos valores superan el mínimo de **4,5:1** recomendado para texto normal. Los colores están definidos en [CSS/colors.css](../CSS/colors.css) y [CSS/index.css](../CSS/index.css).

## 3. Controles táctiles del carrusel

- Los botones indicadores tienen un área pulsable de **24 × 24 píxeles CSS**, mientras que el punto visual se mantiene en 10 × 10 píxeles.
- La franja y la distribución de los indicadores se ajustan en móvil para acomodar ese tamaño ([CSS/index.css](../CSS/index.css)).

## 4. Verificación realizada

- Se comprobó en el navegador que el buscador expone el rol `combobox`, controla una lista con rol `listbox` y mantiene la selección por teclado y el cierre con Escape.
- Se midieron los indicadores en escritorio y móvil; ambos conservan el área pulsable de 24 × 24 píxeles.
- Se comprobaron los ratios de contraste indicados y la sintaxis de los scripts JavaScript.

No se ejecutó una auditoría completa de Lighthouse ni pruebas con lectores de pantalla. Se recomienda probar también el sitio completo con tecnologías de asistencia y revisar las demás páginas antes de afirmar conformidad global con WCAG.
