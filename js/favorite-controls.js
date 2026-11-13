(function () {
  function renderControl(wrapper) {
    const button = wrapper.querySelector(".favorite-button");
    const status = wrapper.querySelector(".favorite-status");
    const gameId = wrapper.dataset.gameId;
    try {
      const accounts = window.MiniNGamesAccounts;
      const user = accounts.currentUser();
      const isFavorite =
        Boolean(user) && accounts.getFavoriteGameIds().includes(gameId);
      button.textContent = isFavorite
        ? "★ Quitar de favoritos"
        : "☆ Añadir a favoritos";
      button.setAttribute("aria-pressed", String(isFavorite));
      status.textContent = "";
    } catch (error) {
      console.error("No se pudo actualizar el estado del favorito:", error);
      status.textContent = "No se pudo cargar el favorito.";
    }
  }

  function renderAllControls() {
    document.querySelectorAll(".favorite-control").forEach(renderControl);
  }

  function createFavoriteControl(gameId) {
    const wrapper = document.createElement("div");
    wrapper.className = "favorite-control";
    wrapper.dataset.gameId = gameId;

    const button = document.createElement("button");
    button.className = "favorite-button";
    button.type = "button";
    button.setAttribute("aria-pressed", "false");

    const status = document.createElement("span");
    status.className = "favorite-status";
    status.setAttribute("role", "status");
    wrapper.append(button, status);
    renderControl(wrapper);
    return wrapper;
  }

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }
    const button = event.target.closest(".favorite-button");
    const wrapper = button && button.closest(".favorite-control");
    if (!wrapper) {
      return;
    }

    try {
      if (!window.MiniNGamesAccounts.currentUser()) {
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `${window.MiniNGamesPaths.page("account.html")}?return=${returnUrl}`;
        return;
      }
      window.MiniNGamesAccounts.toggleFavorite(wrapper.dataset.gameId);
      renderControl(wrapper);
    } catch (error) {
      console.error("No se pudo actualizar el favorito:", error);
      wrapper.querySelector(".favorite-status").textContent = error.message;
    }
  });

  window.addEventListener("mini-ngames:authchange", renderAllControls);
  window.addEventListener("mini-ngames:favoriteschange", renderAllControls);
  window.MiniNGamesFavoriteControls = { create: createFavoriteControl };
})();
