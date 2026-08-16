(() => {
  const root = document.documentElement;
  const toggle = document.querySelector("[data-theme-toggle]");
  const storageKey = "startkiter-theme";

  if (!toggle) {
    return;
  }

  const syncToggle = () => {
    const isDark = root.classList.contains("dark");
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.querySelector(".theme-icon").textContent = isDark ? "☀" : "☾";
    toggle.querySelector(".theme-label").textContent = isDark ? "淺色" : "深色";
  };

  syncToggle();
  toggle.addEventListener("click", () => {
    const nextIsDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nextIsDark);
    try {
      localStorage.setItem(storageKey, nextIsDark ? "dark" : "light");
    } catch (error) {}
    syncToggle();
  });
})();
