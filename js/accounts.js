(function () {
  const STORAGE = {
    accounts: "mini-ngames.accounts.v1",
    session: "mini-ngames.session.v1",
    reviews: "mini-ngames.reviews.v1",
    favorites: "mini-ngames.favorites.v1",
  };
  const PASSWORD_ITERATIONS = 120000;

  function readList(key, label) {
    const stored = window.localStorage.getItem(key);
    if (stored === null) {
      return [];
    }

    let value;
    try {
      value = JSON.parse(stored);
    } catch (error) {
      throw new Error(`No se pudieron leer ${label}: los datos guardados no son válidos.`, {
        cause: error,
      });
    }
    if (!Array.isArray(value)) {
      throw new Error(`No se pudieron leer ${label}: el formato guardado no es válido.`);
    }
    return value;
  }

  function writeValue(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeUsername(username) {
    return username.trim().toLocaleLowerCase("es");
  }

  function makeHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function makeRandomHex(length) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    return makeHex(bytes);
  }

  async function hashPassword(password, salt) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error(
        "Este navegador no permite proteger contraseñas en este contexto. Abre la web con Live Server o localhost.",
      );
    }
    const key = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await window.crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: new TextEncoder().encode(salt),
        iterations: PASSWORD_ITERATIONS,
        hash: "SHA-256",
      },
      key,
      256,
    );
    return makeHex(new Uint8Array(bits));
  }

  function currentUser() {
    const sessionValue = window.localStorage.getItem(STORAGE.session);
    if (!sessionValue) {
      return null;
    }
    let session;
    try {
      session = JSON.parse(sessionValue);
    } catch (error) {
      throw new Error("No se pudo leer la sesión guardada.", { cause: error });
    }
    if (!session || typeof session.accountId !== "string") {
      throw new Error("El formato de la sesión guardada no es válido.");
    }
    const account = readList(STORAGE.accounts, "las cuentas").find(
      (item) => item && item.id === session.accountId,
    );
    return account
      ? { id: account.id, username: account.username }
      : null;
  }

  function announceAuthChange() {
    window.dispatchEvent(new CustomEvent("mini-ngames:authchange"));
  }

  async function register(username, password) {
    const displayName = username.trim();
    if (!/^[A-Za-z0-9_-]{3,20}$/.test(displayName)) {
      throw new Error("El nombre debe tener entre 3 y 20 letras, números, guiones o guiones bajos.");
    }
    if (password.length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres.");
    }

    const accounts = readList(STORAGE.accounts, "las cuentas");
    const normalizedUsername = normalizeUsername(displayName);
    if (
      accounts.some(
        (account) =>
          account &&
          typeof account.username === "string" &&
          normalizeUsername(account.username) === normalizedUsername,
      )
    ) {
      throw new Error("Ese nombre de usuario ya está registrado.");
    }

    const salt = makeRandomHex(16);
    const account = {
      id: makeRandomHex(16),
      username: displayName,
      normalizedUsername,
      salt,
      passwordHash: await hashPassword(password, salt),
    };
    accounts.push(account);
    writeValue(STORAGE.accounts, accounts);
    writeValue(STORAGE.session, { accountId: account.id });
    announceAuthChange();
    return { id: account.id, username: account.username };
  }

  async function login(username, password) {
    const normalizedUsername = normalizeUsername(username);
    const account = readList(STORAGE.accounts, "las cuentas").find(
      (item) =>
        item &&
        typeof item.normalizedUsername === "string" &&
        item.normalizedUsername === normalizedUsername,
    );
    if (!account || typeof account.salt !== "string" || typeof account.passwordHash !== "string") {
      throw new Error("Nombre de usuario o contraseña incorrectos.");
    }
    const passwordHash = await hashPassword(password, account.salt);
    if (passwordHash !== account.passwordHash) {
      throw new Error("Nombre de usuario o contraseña incorrectos.");
    }
    writeValue(STORAGE.session, { accountId: account.id });
    announceAuthChange();
    return { id: account.id, username: account.username };
  }

  function logout() {
    window.localStorage.removeItem(STORAGE.session);
    announceAuthChange();
  }

  function getReviews(gameId) {
    return readList(STORAGE.reviews, "las reseñas")
      .filter(
        (review) =>
          review &&
          review.gameId === gameId &&
          typeof review.username === "string" &&
          Number.isInteger(review.rating) &&
          typeof review.comment === "string" &&
          typeof review.createdAt === "string",
      )
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  }

  function getFavoriteGameIds() {
    const user = currentUser();
    if (!user) {
      return [];
    }
    return readList(STORAGE.favorites, "los juegos favoritos")
      .filter(
        (favorite) =>
          favorite && favorite.userId === user.id && typeof favorite.gameId === "string",
      )
      .map((favorite) => favorite.gameId);
  }

  function toggleFavorite(gameId) {
    const user = currentUser();
    if (!user) {
      throw new Error("Inicia sesión para guardar juegos favoritos.");
    }
    if (typeof gameId !== "string" || !gameId) {
      throw new Error("El identificador del juego no es válido.");
    }

    const favorites = readList(STORAGE.favorites, "los juegos favoritos");
    const existingIndex = favorites.findIndex(
      (favorite) =>
        favorite && favorite.userId === user.id && favorite.gameId === gameId,
    );
    if (existingIndex >= 0) {
      favorites.splice(existingIndex, 1);
    } else {
      favorites.push({ userId: user.id, gameId });
    }
    writeValue(STORAGE.favorites, favorites);
    window.dispatchEvent(new CustomEvent("mini-ngames:favoriteschange"));
    return existingIndex < 0;
  }

  function saveReview(gameId, rating, comment) {
    const user = currentUser();
    if (!user) {
      throw new Error("Inicia sesión para publicar una reseña.");
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error("La valoración debe estar entre 1 y 5 estrellas.");
    }
    const cleanComment = comment.trim();
    if (cleanComment.length < 10 || cleanComment.length > 1000) {
      throw new Error("La reseña debe tener entre 10 y 1000 caracteres.");
    }

    const reviews = readList(STORAGE.reviews, "las reseñas");
    const existingIndex = reviews.findIndex(
      (review) => review && review.gameId === gameId && review.userId === user.id,
    );
    const now = new Date().toISOString();
    const review = {
      gameId,
      userId: user.id,
      username: user.username,
      rating,
      comment: cleanComment,
      createdAt:
        existingIndex >= 0 && typeof reviews[existingIndex].createdAt === "string"
          ? reviews[existingIndex].createdAt
          : now,
      updatedAt: now,
    };
    if (existingIndex >= 0) {
      reviews[existingIndex] = review;
    } else {
      reviews.push(review);
    }
    writeValue(STORAGE.reviews, reviews);
    return review;
  }

  window.MiniNGamesAccounts = {
    currentUser,
    getFavoriteGameIds,
    getReviews,
    login,
    logout,
    register,
    saveReview,
    toggleFavorite,
  };

  function updateAccountLinks() {
    const links = document.querySelectorAll(".account-button");
    if (!links.length) {
      return;
    }
    try {
      const user = currentUser();
      links.forEach((link) => {
        link.textContent = user ? user.username : "Iniciar Sesión";
        link.href = window.MiniNGamesPaths.page("account.html");
        link.setAttribute("aria-label", user ? `Cuenta de ${user.username}` : "Iniciar sesión");
      });
    } catch (error) {
      console.error("No se pudo actualizar el estado de la cuenta:", error);
    }
  }

  function safeReturnUrl() {
    const returnValue = new URLSearchParams(window.location.search).get("return");
    if (!returnValue) {
      return window.MiniNGamesPaths.page("account.html");
    }
    try {
      const returnUrl = new URL(returnValue, window.location.href);
      if (returnUrl.origin === window.location.origin) {
        return returnUrl.href;
      }
    } catch (error) {
      console.error("La dirección de retorno no es válida:", error);
    }
    return window.MiniNGamesPaths.page("account.html");
  }

  function setupAccountPage() {
    const registerForm = document.querySelector("#register-panel");
    if (!registerForm) {
      return;
    }
    const loginForm = document.querySelector("#login-panel");
    const authPanel = document.querySelector("#account-auth");
    const sessionPanel = document.querySelector("#account-session");
    const welcome = document.querySelector("#account-welcome");
    const status = document.querySelector("#account-status");
    const registerTab = document.querySelector("#register-tab");
    const loginTab = document.querySelector("#login-tab");
    const returnUrl = safeReturnUrl();

    function showMessage(message) {
      status.textContent = message;
    }

    function selectTab(tab) {
      const showRegister = tab === "register";
      registerForm.hidden = !showRegister;
      loginForm.hidden = showRegister;
      registerTab.classList.toggle("active", showRegister);
      loginTab.classList.toggle("active", !showRegister);
      registerTab.setAttribute("aria-selected", String(showRegister));
      loginTab.setAttribute("aria-selected", String(!showRegister));
      showMessage("");
    }

    if (new URLSearchParams(window.location.search).get("mode") === "register") {
      selectTab("register");
    }

    function renderSession() {
      try {
        const user = currentUser();
        authPanel.hidden = Boolean(user);
        sessionPanel.hidden = !user;
        if (user) {
          welcome.textContent = `Sesión iniciada como ${user.username}. Ya puedes publicar y editar tus reseñas.`;
        }
      } catch (error) {
        showMessage(error.message);
      }
    }

    registerTab.addEventListener("click", () => selectTab("register"));
    loginTab.addEventListener("click", () => selectTab("login"));
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(registerForm);
      const password = formData.get("password");
      if (password !== formData.get("passwordConfirm")) {
        showMessage("Las contraseñas no coinciden.");
        return;
      }
      try {
        await register(formData.get("username"), password);
        window.location.href = returnUrl;
      } catch (error) {
        showMessage(error.message);
      }
    });
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(loginForm);
      try {
        await login(formData.get("username"), formData.get("password"));
        window.location.href = returnUrl;
      } catch (error) {
        showMessage(error.message);
      }
    });
    document.querySelector("#account-logout").addEventListener("click", () => {
      try {
        logout();
        renderSession();
        showMessage("Has cerrado sesión.");
      } catch (error) {
        showMessage(error.message);
      }
    });
    window.addEventListener("mini-ngames:authchange", renderSession);
    renderSession();
  }

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE.session || event.key === STORAGE.accounts) {
      updateAccountLinks();
      window.dispatchEvent(new CustomEvent("mini-ngames:authchange"));
    }
  });
  updateAccountLinks();
  setupAccountPage();
})();
