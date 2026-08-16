(function () {
	var STORAGE_KEY = "startkiter-demo-color-mode";

	function readMode() {
		var params = new URLSearchParams(window.location.search);
		var fromQuery = params.get("mode");

		if (fromQuery === "dark" || fromQuery === "light") {
			return fromQuery;
		}

		return localStorage.getItem(STORAGE_KEY) || "light";
	}

	function applyMode(mode) {
		document.documentElement.classList.toggle("dark", mode === "dark");
		document.documentElement.style.colorScheme = mode;
		localStorage.setItem(STORAGE_KEY, mode);

		document.querySelectorAll("[data-test^='color-mode-toggle-item-']").forEach(function (button) {
			var value = button.getAttribute("data-test").replace("color-mode-toggle-item-", "");
			button.setAttribute("aria-pressed", String(value === mode));
		});
	}

	window.setDemoColorMode = function setDemoColorMode(mode) {
		applyMode(mode);

		var url = new URL(window.location.href);
		url.searchParams.set("mode", mode);
		history.replaceState(null, "", url);
	};

	applyMode(readMode());

	document.querySelectorAll("[data-auth-tab]").forEach(function (button) {
		button.addEventListener("click", function () {
			var tab = button.getAttribute("data-auth-tab");

			document.querySelectorAll("[data-auth-tab]").forEach(function (item) {
				item.setAttribute("aria-selected", String(item === button));
			});

			document.querySelectorAll("[data-auth-panel]").forEach(function (panel) {
				panel.hidden = panel.getAttribute("data-auth-panel") !== tab;
			});
		});
	});
})();
