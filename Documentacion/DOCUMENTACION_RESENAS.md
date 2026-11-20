# Programación de las reseñas y resultado en la página

Las reseñas se muestran en la ficha individual de cada juego, en la sección **Reseñas** de [html/BlankGame.html](../html/BlankGame.html#L106-L173). La lógica de esa sección está en [js/game-detail.js](../js/game-detail.js); las operaciones de guardado y lectura están en [js/accounts.js](../js/accounts.js).

## Cómo funciona

1. **Acceso al formulario:** solo se muestra el formulario si hay una sesión iniciada. Si no la hay, la página muestra un enlace para iniciar sesión y volver a la ficha ([js/game-detail.js](../js/game-detail.js#L63-L89), [html/BlankGame.html](../html/BlankGame.html#L169-L170)).
2. **Valoración y comentario:** el usuario selecciona de una a cinco estrellas y escribe un comentario de entre 10 y 1000 caracteres ([html/BlankGame.html](../html/BlankGame.html#L113-L165)). Al publicar, JavaScript recoge esos campos y llama a `saveReview` ([js/game-detail.js](../js/game-detail.js#L143-L164)).
3. **Validación y edición:** se comprueba la sesión, el rango de estrellas y la longitud del comentario. Cada usuario puede tener una reseña por juego; si vuelve a publicar, se actualiza la existente en vez de crear otra ([js/accounts.js](../js/accounts.js#L213-L249)).
4. **Guardado y lectura:** las reseñas se guardan en `localStorage` del navegador bajo la clave `mini-ngames.reviews.v1` ([js/accounts.js](../js/accounts.js#L1-L5), [js/accounts.js](../js/accounts.js#L10-L30), [js/accounts.js](../js/accounts.js#L226-L249)). Al abrir la ficha se filtran por el identificador de ese juego y se ordenan de más nuevas a más antiguas ([js/accounts.js](../js/accounts.js#L162-L174)).

## Qué aparece en la ficha

- **Resumen:** la página muestra el promedio de las valoraciones sobre 5 y el número de reseñas, con formato localizado en español y hasta un decimal. Si todavía no hay ninguna, muestra “Todavía no hay reseñas” ([js/game-detail.js](../js/game-detail.js#L92-L102)).
- **Reseñas individuales:** cada reseña aparece en una tarjeta con el nombre de usuario, las estrellas seleccionadas y el comentario. Las estrellas incluyen una descripción accesible, por ejemplo, “4 de 5 estrellas” ([js/game-detail.js](../js/game-detail.js#L104-L134)).
- **Sin reseñas:** además del resumen, se invita a la primera persona a escribir una reseña ([js/game-detail.js](../js/game-detail.js#L128-L134)).
- **Errores y actualizaciones:** los mensajes del formulario se muestran en la página y la sección de reseñas se actualiza después de publicar o editar ([html/BlankGame.html](../html/BlankGame.html#L110-L113), [html/BlankGame.html](../html/BlankGame.html#L165-L173), [js/game-detail.js](../js/game-detail.js#L152-L164)).

**Ejemplo ilustrativo del resultado:** `4,5 de 5 · 2 reseñas`, seguido de tarjetas como `Nombre de usuario · ★★★★☆` y el texto del comentario. Los valores dependen de las reseñas guardadas para el juego.

## Alcance del almacenamiento

Actualmente las reseñas se conservan en el almacenamiento local del navegador; no se envían a un servidor. Por tanto, no se sincronizan automáticamente entre navegadores o dispositivos.
