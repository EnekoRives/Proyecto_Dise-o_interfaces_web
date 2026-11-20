# Usabilidad implementada en Mini N Games

Este documento describe las facilidades de uso de la portada y sus componentes, con referencias a los archivos donde están implementadas.

## 1. Navegación clara

- La cabecera reúne enlaces a Inicio, Explorar, Favoritos y a la cuenta, y el pie de página enlaza a las páginas informativas ([index.html](../index.html#L33-L37), [index.html](../index.html#L149-L152)).
- La página actual se identifica con `aria-current="page"` y la navegación principal tiene una etiqueta accesible ([index.html](../index.html#L33-L35)).
- El logotipo enlaza a Inicio y tiene un nombre accesible y texto alternativo ([index.html](../index.html#L28-L29)).

## 2. Búsqueda de juegos

- El buscador está identificado como formulario de búsqueda, ofrece una indicación dentro del campo y tiene una etiqueta accesible ([index.html](../index.html#L43-L71)).
- En móviles, la lupa es clicable y está asociada al campo; tocarla enfoca el buscador y hace que se expanda ([index.html](../index.html), [CSS/index.css](../CSS/index.css)).
- Al escribir al menos dos caracteres, muestra hasta cinco sugerencias con el título y la categoría de cada juego ([js/nav-search.js](../js/nav-search.js#L53-L86)).
- Se puede recorrer las sugerencias con las flechas, seleccionarlas con Enter y cerrarlas con Escape. El buscador comunica el estado de las sugerencias mediante atributos ARIA ([js/nav-search.js](../js/nav-search.js#L11-L15), [js/nav-search.js](../js/nav-search.js#L100-L116)).

## 3. Acceso a juegos destacados y catálogo

- El carrusel dispone de botones para avanzar y retroceder y de indicadores seleccionables con nombre accesible ([index.html](../index.html#L90-L112), [js/carousel.js](../js/carousel.js#L168-L175), [js/carousel.js](../js/carousel.js#L190-L197)).
- El estado de la diapositiva actual se comunica con `aria-current`, y el carrusel pausa su avance automático mientras el puntero está sobre él ([js/carousel.js](../js/carousel.js#L100-L115), [js/carousel.js](../js/carousel.js#L200-L201)).
- El enlace “Ver todos” ofrece un acceso directo al catálogo ([index.html](../index.html#L115-L119)). Las tarjetas muestran el título como enlace, una descripción y la categoría ([js/games.js](../js/games.js#L16-L36)).
- Las portadas de juegos incluyen texto alternativo y carga diferida para no cargar todas las imágenes de inmediato ([js/games.js](../js/games.js#L8-L12)).

## 4. Estructura y comunicación del estado

- Se usan elementos semánticos como `<header>`, `<nav>`, `<main>` y `<footer>`, y la portada organiza su contenido con títulos y secciones ([index.html](../index.html#L21-L35), [index.html](../index.html#L81-L119), [index.html](../index.html#L131-L153)).
- Mientras se carga el contenido se muestra un mensaje de estado; si el catálogo o el carrusel no pueden cargarse, se presenta un mensaje de error ([index.html](../index.html#L90-L92), [index.html](../index.html#L121-L122), [js/games.js](../js/games.js#L85-L100), [js/carousel.js](../js/carousel.js#L130-L134)).

## 5. Adaptación y preferencias

- La interfaz reorganiza la cabecera y la navegación en distintos anchos de pantalla; en móviles, el campo de búsqueda se expande al enfocarlo ([CSS/index.css](../CSS/index.css#L207-L263)).
- El carrusel también cambia su disposición en pantallas pequeñas ([CSS/index.css](../CSS/index.css#L803-L855)).
- Se desactivan las transiciones del carrusel cuando el sistema indica que el usuario prefiere reducir el movimiento ([CSS/index.css](../CSS/index.css#L855-L862)).
