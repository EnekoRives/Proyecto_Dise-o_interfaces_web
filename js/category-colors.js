(() => {
  let categoriesPromise;

  async function load() {
    if (!categoriesPromise) {
      categoriesPromise = (async () => {
        const response = await fetch(
          window.MiniNGamesPaths.data("game_categories.json")
        );
        if (!response.ok) {
          throw new Error(
            `No se pudieron cargar las categorías (${response.status}).`
          );
        }

        const categories = await response.json();
        if (
          !Array.isArray(categories) ||
          !categories.every(
            (category) =>
              category !== null &&
              typeof category === "object" &&
              typeof category.id === "string" &&
              typeof category.name === "string" &&
              typeof category.color === "string" &&
              /^#[0-9a-f]{6}$/i.test(category.color)
          )
        ) {
          throw new Error("El catálogo de categorías tiene un formato no válido.");
        }

        return new Map(
          categories.map((category) => [category.name, category.color])
        );
      })();
    }

    return categoriesPromise;
  }

  function applyBackgroundColor(element, categoryName, colors) {
    const color = colors.get(categoryName);
    if (!color) {
      console.warn(`No hay un color definido para la categoría "${categoryName}".`);
      return;
    }
    element.style.backgroundColor = color;
  }

  window.MiniNGamesCategoryColors = { load, applyBackgroundColor };
})();
