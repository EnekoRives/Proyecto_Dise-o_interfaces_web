const gameTitle = document.querySelector("#game-title");
const gameDescription = document.querySelector("#game-description");
const gameGallery = document.querySelector("#game-gallery");

function isGame(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.category === "string" &&
    typeof value.cover === "string" &&
    typeof value.coverAlt === "string" &&
    Array.isArray(value.extendedDescription) &&
    value.extendedDescription.every(
      (paragraph) => typeof paragraph === "string"
    ) &&
    Array.isArray(value.gallery) &&
    value.gallery.every(
      (image) =>
        image !== null &&
        typeof image === "object" &&
        typeof image.src === "string" &&
        typeof image.alt === "string"
    )
  );
}

function showMessage(message) {
  gameTitle.textContent = message;
  gameDescription.replaceChildren();
  gameGallery.replaceChildren();
}

async function loadGame() {
  try {
    const response = await fetch("./data/games.json");
    if (!response.ok) {
      throw new Error(`No se pudo cargar el catálogo (${response.status}).`);
    }

    const games = await response.json();
    if (!Array.isArray(games) || !games.every(isGame)) {
      throw new Error("El catálogo de juegos tiene un formato no válido.");
    }

    const gameId = new URLSearchParams(window.location.search).get("id");
    const game = games.find((item) => item.id === gameId);
    if (!game) {
      showMessage("Juego no encontrado");
      return;
    }

    gameTitle.textContent = game.title;
    document.title = `${game.title} | Mini N Games`;

    const paragraphs = game.extendedDescription.map((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      return paragraph;
    });
    gameDescription.replaceChildren(...paragraphs);

    const images = game.gallery.map((item) => {
      const image = document.createElement("img");
      image.className = "gallery-image";
      image.src = item.src;
      image.alt = item.alt;
      image.loading = "lazy";
      return image;
    });
    gameGallery.replaceChildren(...images);
    gameGallery.hidden = images.length === 0;
  } catch (error) {
    console.error("Error al cargar los datos del juego:", error);
    showMessage("No se pudo cargar el juego");
  }
}

loadGame();
