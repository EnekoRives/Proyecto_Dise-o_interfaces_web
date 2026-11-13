const gamesList = document.querySelector("#games-list");
const categoryOptions = document.querySelector("#category-options");
const filtersForm = document.querySelector("#game-filters");
const searchInput = document.querySelector("#browser-search");
const browserSearchForm = document.querySelector("#browser-search-form");
const sortSelect = document.querySelector("#sort-games");
const resultsCount = document.querySelector("#results-count");
const resetButton = document.querySelector("#reset-filters");

let allGames = [];
let catalogLoadError = false;
let categoryColors = new Map();
const requestedCategory = new URLSearchParams(window.location.search).get(
  "category"
);
searchInput.value = new URLSearchParams(window.location.search).get("q") || "";

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
    typeof value.createdAt === "string" &&
    Number.isFinite(Date.parse(value.createdAt)) &&
    typeof value.updatedAt === "string" &&
    Number.isFinite(Date.parse(value.updatedAt)) &&
    Number.isFinite(value.totalVisits) &&
    value.totalVisits >= 0 &&
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

function formatDate(value) {
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function createGameCard(game) {
  const card = document.createElement("article");
  card.className = "game-card";

  const cover = document.createElement("img");
  cover.src = window.MiniNGamesPaths.asset(game.cover);
  cover.alt = game.coverAlt;
  cover.loading = "lazy";

  const info = document.createElement("div");
  info.className = "game-info";

  const title = document.createElement("h3");
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
    categoryColors
  );

  const meta = document.createElement("div");
  meta.className = "browser-game-meta";
  const visits = document.createElement("span");
  visits.textContent = `${new Intl.NumberFormat("es").format(game.totalVisits)} visitas`;
  const created = document.createElement("span");
  created.textContent = `Creado: ${formatDate(game.createdAt)}`;
  const updated = document.createElement("span");
  updated.textContent = `Actualizado: ${formatDate(game.updatedAt)}`;
  meta.append(visits, created, updated);

  info.append(title, description, category, meta);
  card.append(cover, info);
  return card;
}

function populateCategories(games) {
  const categories = [...new Set(games.map((game) => game.category))].sort(
    (first, second) => first.localeCompare(second, "es")
  );

  if (categories.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "filter-hint";
    emptyMessage.textContent = "No hay categorías disponibles.";
    categoryOptions.replaceChildren(emptyMessage);
    return;
  }

  const labels = categories.map((category, index) => {
    const label = document.createElement("label");
    label.className = "category-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "category";
    checkbox.value = category;
    checkbox.id = `category-${index}`;
    checkbox.checked = requestedCategory === category;

    const text = document.createElement("span");
    text.textContent = category;
    label.append(checkbox, text);
    return label;
  });

  categoryOptions.replaceChildren(...labels);
}

function getDateValue(name) {
  return filtersForm.elements.namedItem(name).value;
}

function getNumberValue(name) {
  const value = filtersForm.elements.namedItem(name).value;
  return value === "" ? null : Number(value);
}

function sortGames(games) {
  const sorted = [...games];
  switch (sortSelect.value) {
    case "recent":
      return sorted.sort(
        (first, second) =>
          Date.parse(second.createdAt) - Date.parse(first.createdAt)
      );
    case "updated":
      return sorted.sort(
        (first, second) =>
          Date.parse(second.updatedAt) - Date.parse(first.updatedAt)
      );
    case "title":
      return sorted.sort((first, second) =>
        first.title.localeCompare(second.title, "es")
      );
    case "popular":
    default:
      return sorted.sort(
        (first, second) => second.totalVisits - first.totalVisits
      );
  }
}

function renderGames() {
  if (catalogLoadError) {
    return;
  }

  const query = searchInput.value.trim().toLocaleLowerCase("es");
  const selectedCategories = new Set(
    [...filtersForm.querySelectorAll('input[name="category"]:checked')].map(
      (checkbox) => checkbox.value
    )
  );
  const createdFrom = getDateValue("createdFrom");
  const createdTo = getDateValue("createdTo");
  const updatedFrom = getDateValue("updatedFrom");
  const updatedTo = getDateValue("updatedTo");
  const visitsMin = getNumberValue("visitsMin");
  const visitsMax = getNumberValue("visitsMax");

  const matchingGames = allGames.filter((game) => {
    const searchableTitle = game.title.toLocaleLowerCase("es");
    const createdDate = game.createdAt.slice(0, 10);
    const updatedDate = game.updatedAt.slice(0, 10);

    return (
      (!query || searchableTitle.includes(query)) &&
      (selectedCategories.size === 0 ||
        selectedCategories.has(game.category)) &&
      (!createdFrom || createdDate >= createdFrom) &&
      (!createdTo || createdDate <= createdTo) &&
      (!updatedFrom || updatedDate >= updatedFrom) &&
      (!updatedTo || updatedDate <= updatedTo) &&
      (visitsMin === null || game.totalVisits >= visitsMin) &&
      (visitsMax === null || game.totalVisits <= visitsMax)
    );
  });

  const orderedGames = sortGames(matchingGames);
  const count = orderedGames.length;
  resultsCount.textContent = `${count} ${count === 1 ? "juego" : "juegos"}`;

  if (count === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "browser-empty";
    emptyMessage.setAttribute("role", "status");
    emptyMessage.textContent =
      "No se han encontrado juegos con estos criterios. Prueba a cambiar o limpiar los filtros.";
    gamesList.replaceChildren(emptyMessage);
    return;
  }

  gamesList.replaceChildren(...orderedGames.map(createGameCard));
}

function showLoadError(error) {
  catalogLoadError = true;
  console.error("Error al cargar la galería de juegos:", error);
  const errorMessage = document.createElement("p");
  errorMessage.className = "browser-error";
  errorMessage.setAttribute("role", "alert");
  errorMessage.textContent =
    "No se pudo cargar el catálogo. Abre la página con Live Server y revisa data/games.json y data/game_categories.json.";
  gamesList.replaceChildren(errorMessage);
  categoryOptions.replaceChildren();
  resultsCount.textContent = "No se pudo cargar el catálogo";
}

filtersForm.addEventListener("input", renderGames);
filtersForm.addEventListener("submit", (event) => event.preventDefault());
browserSearchForm.addEventListener("submit", (event) => event.preventDefault());
searchInput.addEventListener("input", renderGames);
sortSelect.addEventListener("change", renderGames);
resetButton.addEventListener("click", () => {
  filtersForm.reset();
  searchInput.value = "";
  sortSelect.value = "popular";
  renderGames();
});

async function initializeBrowser() {
  try {
    const [response, loadedCategoryColors] = await Promise.all([
      fetch(window.MiniNGamesPaths.data("games.json")),
      window.MiniNGamesCategoryColors.load(),
    ]);
    if (!response.ok) {
      throw new Error(`No se pudo cargar el catálogo (${response.status}).`);
    }

    const games = await response.json();
    if (!Array.isArray(games) || !games.every(isGame)) {
      throw new Error("El catálogo de juegos tiene un formato no válido.");
    }

    categoryColors = loadedCategoryColors;
    allGames = games;
    populateCategories(allGames);
    renderGames();
  } catch (error) {
    showLoadError(error);
  }
}

initializeBrowser();
