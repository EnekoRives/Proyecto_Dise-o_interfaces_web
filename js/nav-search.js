const headerSearch = document.querySelector(".header-search");

if (headerSearch) {
  const searchInput = headerSearch.querySelector('input[type="search"]');
  const suggestions = document.createElement("div");
  suggestions.className = "header-suggestions";
  suggestions.id = "header-search-suggestions";
  suggestions.setAttribute("role", "listbox");
  suggestions.setAttribute("aria-label", "Juegos coincidentes");
  suggestions.hidden = true;
  headerSearch.append(suggestions);

  searchInput.setAttribute("aria-autocomplete", "list");
  searchInput.setAttribute("aria-controls", suggestions.id);
  searchInput.setAttribute("aria-expanded", "false");

  let games = [];
  let activeIndex = -1;

  function normalize(value) {
    return value
      .trim()
      .toLocaleLowerCase("es")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function closeSuggestions() {
    suggestions.hidden = true;
    headerSearch.classList.remove("suggestions-open");
    searchInput.setAttribute("aria-expanded", "false");
    searchInput.removeAttribute("aria-activedescendant");
    activeIndex = -1;
  }

  function setActiveSuggestion(index) {
    const options = suggestions.querySelectorAll(".header-suggestion");
    if (options.length === 0) {
      return;
    }

    activeIndex = (index + options.length) % options.length;
    options.forEach((option, optionIndex) => {
      option.setAttribute(
        "aria-selected",
        optionIndex === activeIndex ? "true" : "false"
      );
    });
    searchInput.setAttribute(
      "aria-activedescendant",
      options[activeIndex].id
    );
  }

  function renderSuggestions() {
    const query = normalize(searchInput.value);
    if (query.length < 2) {
      closeSuggestions();
      suggestions.replaceChildren();
      return;
    }

    const matches = games
      .filter((game) => normalize(game.title).includes(query))
      .slice(0, 5);

    const options = matches.map((game, index) => {
      const option = document.createElement("a");
      option.className = "header-suggestion";
      option.id = `header-suggestion-${index}`;
      option.href = `${window.MiniNGamesPaths.page("BlankGame.html")}?id=${encodeURIComponent(game.id)}`;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.setAttribute("aria-label", `${game.title}, ${game.category}`);

      const title = document.createElement("span");
      title.className = "header-suggestion-title";
      title.textContent = game.title;

      const category = document.createElement("span");
      category.className = "header-suggestion-category";
      category.textContent = game.category;
      option.append(title, category);
      return option;
    });

    suggestions.replaceChildren(...options);
    activeIndex = -1;
    searchInput.removeAttribute("aria-activedescendant");
    suggestions.hidden = options.length === 0;
    headerSearch.classList.toggle("suggestions-open", options.length > 0);
    searchInput.setAttribute(
      "aria-expanded",
      options.length > 0 ? "true" : "false"
    );
  }

  searchInput.addEventListener("input", renderSuggestions);

  searchInput.addEventListener("keydown", (event) => {
    const options = suggestions.querySelectorAll(".header-suggestion");
    if (suggestions.hidden || options.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion(activeIndex < 0 ? options.length - 1 : activeIndex - 1);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      options[activeIndex].click();
    } else if (event.key === "Escape") {
      closeSuggestions();
    }
  });

  headerSearch.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!headerSearch.contains(document.activeElement)) {
        closeSuggestions();
      }
    }, 0);
  });

  document.addEventListener("pointerdown", (event) => {
    if (!headerSearch.contains(event.target)) {
      closeSuggestions();
    }
  });

  async function loadGames() {
    try {
      const response = await fetch(window.MiniNGamesPaths.data("games.json"));
      if (!response.ok) {
        throw new Error(`No se pudo cargar el catálogo (${response.status}).`);
      }

      const catalog = await response.json();
      if (
        !Array.isArray(catalog) ||
        !catalog.every(
          (game) =>
            game !== null &&
            typeof game === "object" &&
            typeof game.id === "string" &&
            typeof game.title === "string" &&
            typeof game.category === "string"
        )
      ) {
        throw new Error("El catálogo de juegos tiene un formato no válido.");
      }

      games = catalog;
      renderSuggestions();
    } catch (error) {
      console.error("Error al cargar las sugerencias del buscador:", error);
    }
  }

  loadGames();
}
