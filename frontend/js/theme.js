const themeButton = document.getElementById("themeButton");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

const savedTheme = localStorage.getItem("theme") || "dark";

document.documentElement.setAttribute("data-theme", savedTheme);

const sunIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path>
        <path d="M12 20v2"></path>
        <path d="M4.93 4.93l1.41 1.41"></path>
        <path d="M17.66 17.66l1.41 1.41"></path>
        <path d="M2 12h2"></path>
        <path d="M20 12h2"></path>
        <path d="M4.93 19.07l1.41-1.41"></path>
        <path d="M17.66 6.34l1.41-1.41"></path>
    </svg>
`;

const moonIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
`;

function updateThemeButton() {
    if (!themeButton) {
        return;
    }

    const currentTheme = document.documentElement.getAttribute("data-theme");

    if (currentTheme === "dark") {
        themeIcon.innerHTML = sunIcon;
        themeText.textContent = "Tema claro";
    } else {
        themeIcon.innerHTML = moonIcon;
        themeText.textContent = "Tema escuro";
    }
}

updateThemeButton();

if (themeButton) {
    themeButton.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";

        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);

        updateThemeButton();
    });
}