// =========================
// CONFIGURACIÓN DEL CARRUSEL
// =========================

const carousel = document.querySelector(".carousel");

const slides = document.querySelectorAll(".carousel-slide");

const dots = document.querySelectorAll(".carousel-dot");

const prevButton = document.querySelector(".carousel-prev");

const nextButton = document.querySelector(".carousel-next");

// Índice de la diapositiva actual
let currentSlide = 0;

// Tiempo entre cambios automáticos (5 segundos)
const intervalTime = 5000;

// Temporizador
let autoplayInterval;

// =========================
// MOSTRAR UNA DIAPOSITIVA
// =========================

function showSlide(index) {
  // Ocultar todas las diapositivas
  slides.forEach((slide) => {
    slide.classList.remove("active");
  });

  // Desactivar todos los indicadores
  dots.forEach((dot) => {
    dot.classList.remove("active");
    dot.removeAttribute("aria-current");
  });

  // Actualizar el índice
  currentSlide = (index + slides.length) % slides.length;

  // Mostrar la diapositiva correspondiente
  slides[currentSlide].classList.add("active");

  // Activar su indicador
  dots[currentSlide].classList.add("active");

  dots[currentSlide].setAttribute("aria-current", "true");
}

// =========================
// NAVEGACIÓN
// =========================

// Avanzar a la siguiente diapositiva
function nextSlide() {
  showSlide(currentSlide + 1);
}

// Volver a la diapositiva anterior
function prevSlide() {
  showSlide(currentSlide - 1);
}

// =========================
// CAMBIO AUTOMÁTICO
// =========================

function startAutoplay() {
  stopAutoplay();

  autoplayInterval = setInterval(() => {
    nextSlide();
  }, intervalTime);
}

function stopAutoplay() {
  clearInterval(autoplayInterval);
}

// =========================
// EVENTOS DE LOS BOTONES
// =========================

nextButton.addEventListener("click", () => {
  nextSlide();

  startAutoplay();
});

prevButton.addEventListener("click", () => {
  prevSlide();

  startAutoplay();
});

// =========================
// EVENTOS DE LOS INDICADORES
// =========================

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    showSlide(index);

    startAutoplay();
  });
});

// =========================
// PAUSAR AL PASAR EL RATÓN
// =========================

carousel.addEventListener("mouseenter", stopAutoplay);

carousel.addEventListener("mouseleave", startAutoplay);

// =========================
// INICIALIZACIÓN
// =========================

showSlide(0);

startAutoplay();
