const themeOptions = document.querySelectorAll(".theme-option");

let currentTheme = localStorage.getItem("theme") || "dark";

document.documentElement.setAttribute("data-theme", currentTheme);

function updateThemeSwitcher() {
    themeOptions.forEach((option) => {
        option.classList.toggle("active", option.dataset.themeValue === currentTheme);
    });
}

themeOptions.forEach((option) => {
    option.addEventListener("click", () => {
        if (option.dataset.themeValue === currentTheme) {
            return;
        }

        currentTheme = option.dataset.themeValue;

        document.documentElement.setAttribute("data-theme", currentTheme);
        localStorage.setItem("theme", currentTheme);

        updateThemeSwitcher();
    });
});

updateThemeSwitcher();