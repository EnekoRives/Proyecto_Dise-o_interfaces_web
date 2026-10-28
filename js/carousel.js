const carousel = document.querySelector(".carousel");
const carouselTrack = carousel.querySelector(".carousel-track");
const indicators = carousel.querySelector(".carousel-indicators");
const prevButton = carousel.querySelector(".carousel-prev");
const nextButton = carousel.querySelector(".carousel-next");

const intervalTime = 5000;
let currentSlide = 0;
let autoplayInterval;

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
    typeof value.totalVisits === "number" &&
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

function createSlide(game) {
  const slide = document.createElement("article");
  slide.className = "carousel-slide";

  const main = document.createElement("div");
  main.className = "carousel-main";

  const cover = document.createElement("img");
  cover.className = "carousel-main-image";
  cover.src = game.cover;
  cover.alt = game.coverAlt;
  main.append(cover);

  const details = document.createElement("aside");
  details.className = "carousel-details";

  const title = document.createElement("h3");
  title.textContent = game.title;

  const description = document.createElement("p");
  description.textContent = game.description;

  const thumbnails = document.createElement("div");
  thumbnails.className = "carousel-thumbnails";
  thumbnails.setAttribute("aria-label", `Imágenes de ${game.title}`);
  game.gallery.slice(0, 4).forEach((item) => {
    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.alt;
    image.loading = "lazy";
    thumbnails.append(image);
  });

  const footer = document.createElement("div");
  footer.className = "carousel-footer";

  const meta = document.createElement("div");
  meta.className = "carousel-meta";

  const category = document.createElement("span");
  category.textContent = game.category;

  const visits = document.createElement("span");
  visits.textContent = `${new Intl.NumberFormat("es").format(game.totalVisits)} visitas`;
  meta.append(category, visits);

  const playLink = document.createElement("a");
  playLink.className = "hero-button";
  playLink.href = `./BlankGame.html?id=${encodeURIComponent(game.id)}`;
  playLink.setAttribute("aria-label", `Jugar: ${game.title}`);
  playLink.textContent = "Jugar";

  footer.append(meta, playLink);
  details.append(title, description, thumbnails, footer);
  slide.append(main, details);
  return slide;
}

function showSlide(index) {
  const slides = carouselTrack.querySelectorAll(".carousel-slide");
  const dots = indicators.querySelectorAll(".carousel-dot");
  if (slides.length === 0) {
    return;
  }

  slides.forEach((slide) => slide.classList.remove("active"));
  dots.forEach((dot) => {
    dot.classList.remove("active");
    dot.removeAttribute("aria-current");
  });

  currentSlide = (index + slides.length) % slides.length;
  slides[currentSlide].classList.add("active");
  dots[currentSlide].classList.add("active");
  dots[currentSlide].setAttribute("aria-current", "true");
}

function stopAutoplay() {
  clearInterval(autoplayInterval);
}

function startAutoplay() {
  stopAutoplay();
  if (carouselTrack.querySelectorAll(".carousel-slide").length > 1) {
    autoplayInterval = setInterval(() => showSlide(currentSlide + 1), intervalTime);
  }
}

function showLoadError(message) {
  const errorMessage = document.createElement("p");
  errorMessage.className = "cuerpo";
  errorMessage.setAttribute("role", "alert");
  errorMessage.textContent = message;
  carouselTrack.replaceChildren(errorMessage);
  indicators.replaceChildren();
  prevButton.hidden = true;
  nextButton.hidden = true;
}

async function loadCarousel() {
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
      showLoadError("Todavía no hay juegos en el catálogo.");
      return;
    }

    const mostVisited = [...games].sort(
      (first, second) => second.totalVisits - first.totalVisits
    ).slice(0, 6);
    const slides = mostVisited.map(createSlide);
    const dots = mostVisited.map((game, index) => {
      const dot = document.createElement("button");
      dot.className = "carousel-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Mostrar juego ${index + 1}: ${game.title}`);
      dot.addEventListener("click", () => {
        showSlide(index);
        startAutoplay();
      });
      return dot;
    });

    carouselTrack.replaceChildren(...slides);
    indicators.replaceChildren(...dots);
    showSlide(0);
    startAutoplay();
  } catch (error) {
    console.error("Error al cargar los juegos destacados:", error);
    showLoadError(
      "No se pudieron cargar los juegos destacados. Revisa data/games.json y abre la página con Live Server."
    );
  }
}

nextButton.addEventListener("click", () => {
  showSlide(currentSlide + 1);
  startAutoplay();
});

prevButton.addEventListener("click", () => {
  showSlide(currentSlide - 1);
  startAutoplay();
});

carousel.addEventListener("mouseenter", stopAutoplay);
carousel.addEventListener("mouseleave", startAutoplay);

loadCarousel();
