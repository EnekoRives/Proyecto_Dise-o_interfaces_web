const gamesList = document.querySelector("#games-list");

function createGameCard(game) {
  const card = document.createElement("article");
  card.className = "game-card";

  const cover = document.createElement("img");
  cover.src = game.cover;
  cover.alt = game.coverAlt;
  cover.loading = "lazy";

  const info = document.createElement("div");
  info.className = "game-info";

  const title = document.createElement("h3");
  title.className = "highlight";
  const detailLink = document.createElement("a");
  detailLink.href = `./BlankGame.html?id=${encodeURIComponent(game.id)}`;
  detailLink.textContent = game.title;
  title.append(detailLink);

  const description = document.createElement("p");
  description.className = "cuerpo";
  description.textContent = game.description;

  const category = document.createElement("span");
  category.className = "game-category";
  category.textContent = game.category;

  info.append(title, description, category);
  card.append(cover, info);
  return card;
}

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

async function loadGames() {
  try {
    const response = await fetch("./data/games.json");
    if (!response.ok) {
      throw new Error(`No se pudo cargar el catálogo (${response.status}).`);
    }

    const games = await response.json();
    if (!Array.isArray(games) || !games.every(isGame)) {
      throw new Error("El catálogo de juegos tiene un formato no válido.");
    }

    if (games.length === 0) {
      const message = document.createElement("p");
      message.className = "cuerpo";
      message.setAttribute("role", "status");
      message.textContent = "Todavía no hay juegos en el catálogo.";
      gamesList.replaceChildren(message);
      return;
    }

    gamesList.replaceChildren(...games.map(createGameCard));
  } catch (error) {
    console.error("Error al cargar los juegos:", error);
    const message = document.createElement("p");
    message.className = "cuerpo";
    message.setAttribute("role", "alert");
    message.textContent =
      "No se pudo cargar el catálogo. Abre la página con Live Server y revisa data/games.json.";
    gamesList.replaceChildren(message);
  }
}

loadGames();
