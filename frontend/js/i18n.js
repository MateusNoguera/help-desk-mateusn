const translations = {
    "pt-BR": {
        navTickets: "Tickets",
        navUsers: "Usuários",
        navAccount: "Minha conta",
        logout: "Sair",

        ticketsTitle: "Tickets",
        createTicket: "Criar ticket",

        filtersTitle: "Filtros",
        searchTickets: "Buscar tickets...",
        allStatuses: "Todos os status",
        allPriorities: "Todas as prioridades",
        allAssignees: "Todos os responsáveis",
        clearFilters: "Limpar filtros"
    },

    en: {
        navTickets: "Tickets",
        navUsers: "Users",
        navAccount: "My account",
        logout: "Logout",

        ticketsTitle: "Tickets",
        createTicket: "Create ticket",

        filtersTitle: "Filters",
        searchTickets: "Search tickets...",
        allStatuses: "All statuses",
        allPriorities: "All priorities",
        allAssignees: "All assignees",
        clearFilters: "Clear filters"
    }
};

const languageOptions = document.querySelectorAll(".language-option");

let currentLanguage = localStorage.getItem("language") || "pt-BR";

function updateLanguageSwitcher() {
    languageOptions.forEach((option) => {
        option.classList.toggle("active", option.dataset.language === currentLanguage);
    });
}

function translatePage() {
    document.documentElement.lang = currentLanguage;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.dataset.i18n;
        element.textContent = translations[currentLanguage][key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
        const key = element.dataset.i18nPlaceholder;
        element.placeholder = translations[currentLanguage][key];
    });

    updateLanguageSwitcher();
}

languageOptions.forEach((option) => {
    option.addEventListener("click", () => {
        if (option.dataset.language === currentLanguage) {
            return;
        }

        currentLanguage = option.dataset.language;
        localStorage.setItem("language", currentLanguage);

        translatePage();
    });
});

translatePage();