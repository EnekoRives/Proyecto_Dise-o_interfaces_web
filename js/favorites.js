const loginPrompt = document.querySelector("#favorites-login-prompt");
const loginLink = document.querySelector("#favorites-login-link");
const registerLink = document.querySelector("#favorites-register-link");
const favoritesContent = document.querySelector("#favorites-content");
const favoritesStatus = document.querySelector("#favorites-status");
const favoritesList = document.querySelector("#favorites-list");

let gamesPromise;
let categoryColors = new Map();
let categoryColorsPromise;

function setAccountLinks() {
  const returnUrl = encodeURIComponent(window.location.href);
  loginLink.href = `${window.MiniNGamesPaths.page("account.html")}?return=${returnUrl}`;
  registerLink.href = `${window.MiniNGamesPaths.page("account.html")}?mode=register&return=${returnUrl}`;
}

function createFavoriteCard(game) {
  const card = document.createElement("article");
  card.className = "game-card";

  const cover = document.createElement("img");
  cover.src = window.MiniNGamesPaths.asset(game.cover);
  cover.alt = game.coverAlt;
  cover.loading = "lazy";

  const info = document.createElement("div");
  info.className = "game-info";

  const title = document.createElement("h2");
  title.className = "highlight";
  const detailLink = document.createElement("a");
  detailLink.href = `${window.MiniNGamesPaths.page("BlankGame.html")}?id=${encodeURIComponent(game.id)}`;
  detailLink.textContent = game.title;
  title.append(detailLink);

  const description = document.createElement("p");
  description.className = "cuerpo";
  description.textContent = game.description;

  const category = document.createElement("span");
  category.className = "game-category";
  category.textContent = game.category;
  window.MiniNGamesCategoryColors.applyBackgroundColor(
    category,
    game.category,
    categoryColors,
  );

  info.append(title, description, category);
  card.append(cover, info);
  return card;
}

async function loadGames() {
  if (!gamesPromise) {
    gamesPromise = fetch(window.MiniNGamesPaths.data("games.json")).then(async (response) => {
      if (!response.ok) {
        throw new Error(`No se pudo cargar el catálogo (${response.status}).`);
      }
      const games = await response.json();
      if (
        !Array.isArray(games) ||
        !games.every(
          (game) =>
            game &&
            typeof game.id === "string" &&
            typeof game.title === "string" &&
            typeof game.description === "string" &&
            typeof game.category === "string" &&
            typeof game.cover === "string" &&
            typeof game.coverAlt === "string",
        )
      ) {
        throw new Error("El catálogo de juegos tiene un formato no válido.");
      }
      return games;
    });
  }
  return gamesPromise;
}

function loadCategoryColors() {
  if (!categoryColorsPromise) {
    categoryColorsPromise = window.MiniNGamesCategoryColors.load().then((colors) => {
      categoryColors = colors;
      return colors;
    });
  }
  return categoryColorsPromise;
}

async function renderFavorites() {
  let user;
  try {
    user = window.MiniNGamesAccounts.currentUser();
  } catch (error) {
    console.error("No se pudo comprobar la sesión:", error);
    loginPrompt.hidden = true;
    favoritesContent.hidden = false;
    favoritesStatus.textContent = error.message;
    favoritesList.replaceChildren();
    return;
  }

  loginPrompt.hidden = Boolean(user);
  favoritesContent.hidden = !user;
  if (!user) {
    return;
  }

  favoritesStatus.textContent = "Cargando tus juegos favoritos...";
  try {
    const [games, , favoriteIds] = await Promise.all([
      loadGames(),
      loadCategoryColors(),
      Promise.resolve(window.MiniNGamesAccounts.getFavoriteGameIds()),
    ]);
    const favoriteIdSet = new Set(favoriteIds);
    const favoriteGames = games.filter((game) => favoriteIdSet.has(game.id));
    if (favoriteGames.length === 0) {
      favoritesStatus.textContent = "";
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "favorites-empty";
      emptyMessage.textContent =
        "Todavía no tienes juegos favoritos. Explora el catálogo y pulsa «Añadir a favoritos» en los juegos que te gusten.";
      favoritesList.replaceChildren(emptyMessage);
      return;
    }

    favoritesStatus.textContent = `${favoriteGames.length} ${
      favoriteGames.length === 1 ? "juego favorito" : "juegos favoritos"
    }`;
    favoritesList.replaceChildren(...favoriteGames.map(createFavoriteCard));
  } catch (error) {
    console.error("No se pudieron cargar los juegos favoritos:", error);
    favoritesStatus.textContent = "";
    const errorMessage = document.createElement("p");
    errorMessage.className = "favorites-error";
    errorMessage.setAttribute("role", "alert");
    errorMessage.textContent = error.message;
    favoritesList.replaceChildren(errorMessage);
  }
}

setAccountLinks();
window.addEventListener("mini-ngames:authchange", renderFavorites);
window.addEventListener("mini-ngames:favoriteschange", renderFavorites);
renderFavorites();
