(() => {
  const projectRoot = new URL("../", document.currentScript.src);

  function page(name) {
    return new URL(`html/${name}`, projectRoot).href;
  }

  function data(name) {
    return new URL(`data/${name}`, projectRoot).href;
  }

  function asset(path) {
    return new URL(path.replace(/^\.\//, ""), projectRoot).href;
  }

  window.MiniNGamesPaths = { asset, data, page };
})();
