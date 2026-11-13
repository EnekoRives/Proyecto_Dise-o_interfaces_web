const gameTitle = document.querySelector("#game-title");
const favoriteAction = document.querySelector("#favorite-action");
const gameDescription = document.querySelector("#game-description");
const gameAuthor = document.querySelector("#game-author");
const gameGallery = document.querySelector("#game-gallery");
const reviewSummary = document.querySelector("#review-summary");
const reviewComposer = document.querySelector("#review-composer");
const reviewPrompt = document.querySelector("#review-login-prompt");
const reviewList = document.querySelector("#review-list");
const reviewForm = document.querySelector("#review-form");
const reviewFormStatus = document.querySelector("#review-form-status");
const reviewFormTitle = document.querySelector("#review-form-title");
const reviewRatingControl = reviewForm.querySelector(".review-rating-control");

let activeGameId = null;

function updateRatingButtons(rating) {
  reviewRatingControl.querySelectorAll(".review-rating-button").forEach((button) => {
    const buttonRating = Number(button.dataset.rating);
    button.classList.toggle("is-selected", buttonRating <= rating);
    button.setAttribute("aria-pressed", String(buttonRating === rating));
  });
}

function isGame(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.author === "string" &&
    typeof value.description === "string" &&
    typeof value.category === "string" &&
    typeof value.cover === "string" &&
    typeof value.coverAlt === "string" &&
    Array.isArray(value.extendedDescription) &&
    value.extendedDescription.every(
      (paragraph) => typeof paragraph === "string",
    ) &&
    Array.isArray(value.gallery) &&
    value.gallery.every(
      (image) =>
        image !== null &&
        typeof image === "object" &&
        typeof image.src === "string" &&
        typeof image.alt === "string",
    )
  );
}

function showMessage(message) {
  gameTitle.textContent = message;
  favoriteAction.replaceChildren();
  gameDescription.replaceChildren();
  gameAuthor.textContent = "";
  gameGallery.replaceChildren();
  reviewSummary.textContent = "";
  reviewComposer.hidden = true;
  reviewPrompt.hidden = true;
  reviewList.replaceChildren();
}

function renderReviews() {
  if (!activeGameId) {
    return;
  }
  try {
    const accounts = window.MiniNGamesAccounts;
    const user = accounts.currentUser();
    const reviews = accounts.getReviews(activeGameId);
    const ownReview = user
      ? reviews.find((review) => review.userId === user.id)
      : null;

    reviewComposer.hidden = !user;
    reviewPrompt.hidden = Boolean(user);
    if (!user) {
      const returnUrl = new URL(window.location.href);
      const accountLink = reviewPrompt.querySelector("a");
      accountLink.href = `${window.MiniNGamesPaths.page("account.html")}?return=${encodeURIComponent(returnUrl.href)}`;
    }

    reviewFormTitle.textContent = ownReview ? "Edita tu reseña" : "Escribe una reseña";
    reviewForm.elements.rating.value = ownReview ? String(ownReview.rating) : "5";
    updateRatingButtons(Number(reviewForm.elements.rating.value));
    reviewForm.elements.comment.value = ownReview ? ownReview.comment : "";
    reviewForm.querySelector('button[type="submit"]').textContent = ownReview
      ? "Guardar cambios"
      : "Publicar reseña";

    const average =
      reviews.length === 0
        ? null
        : reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    reviewSummary.textContent =
      average === null
        ? "Todavía no hay reseñas."
        : `${average.toLocaleString("es", {
            maximumFractionDigits: 1,
          })} de 5 · ${reviews.length} ${
            reviews.length === 1 ? "reseña" : "reseñas"
          }`;

    const cards = reviews.map((review) => {
      const card = document.createElement("article");
      card.className = "review-card";

      const header = document.createElement("div");
      header.className = "review-card-header";

      const username = document.createElement("h3");
      username.className = "highlight";
      username.textContent = review.username;

      const rating = document.createElement("span");
      rating.className = "review-rating";
      rating.setAttribute("aria-label", `${review.rating} de 5 estrellas`);
      rating.textContent = `${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}`;
      header.append(username, rating);

      const comment = document.createElement("p");
      comment.className = "review-copy cuerpo";
      comment.textContent = review.comment;
      card.append(header, comment);
      return card;
    });

    if (cards.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "cuerpo";
      emptyState.textContent = "Sé la primera persona en reseñar este juego.";
      cards.push(emptyState);
    }
    reviewList.replaceChildren(...cards);
    reviewFormStatus.textContent = "";
  } catch (error) {
    console.error("Error al cargar las reseñas:", error);
    reviewFormStatus.textContent = error.message;
    reviewList.replaceChildren();
  }
}

reviewRatingControl.addEventListener("click", (event) => {
  const button = event.target.closest(".review-rating-button");
  if (!button) {
    return;
  }
  reviewForm.elements.rating.value = button.dataset.rating;
  updateRatingButtons(Number(button.dataset.rating));
});

reviewForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(reviewForm);
  try {
    window.MiniNGamesAccounts.saveReview(
      activeGameId,
      Number(formData.get("rating")),
      formData.get("comment"),
    );
    renderReviews();
  } catch (error) {
    reviewFormStatus.textContent = error.message;
  }
});

window.addEventListener("mini-ngames:authchange", renderReviews);

async function loadGame() {
  try {
    const response = await fetch(window.MiniNGamesPaths.data("games.json"));
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

    activeGameId = game.id;
    gameTitle.textContent = game.title;
    favoriteAction.replaceChildren(
      window.MiniNGamesFavoriteControls.create(game.id),
    );
    document.title = `${game.title} | Mini N Games`;
    document
      .querySelector('meta[name="description"]')
      .setAttribute("content", game.description);

    const paragraphs = game.extendedDescription.map((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      return paragraph;
    });
    gameDescription.replaceChildren(...paragraphs);
    gameAuthor.hidden = !game.author.trim();
    gameAuthor.textContent = game.author ? `Juego por ${game.author}` : "";

    const images = game.gallery.map((item) => {
      const image = document.createElement("img");
      image.className = "gallery-image";
      image.src = window.MiniNGamesPaths.asset(item.src);
      image.alt = item.alt;
      image.loading = "lazy";
      return image;
    });
    gameGallery.replaceChildren(...images);
    gameGallery.hidden = images.length === 0;
    renderReviews();
  } catch (error) {
    console.error("Error al cargar los datos del juego:", error);
    showMessage("No se pudo cargar el juego");
  }
}

loadGame();
