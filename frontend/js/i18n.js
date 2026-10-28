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
        clearFilters: "Limpar filtros",

        priority: "Prioridade",
        createdBy: "Criado por",
        assignedTo: "Responsável",
        createdAt: "Criado em",
        updatedAt: "Atualizado em",

        noAssignee: "Sem responsável",
        unidentifiedUser: "Usuário não identificado",

        edit: "Alterar",
        delete: "Excluir",
        claim: "Assumir",
        save: "Salvar",
        cancel: "Cancelar",

        statusOpen: "Aberto",
        statusInProgress: "Em andamento",
        statusResolved: "Resolvido",
        statusClosed: "Fechado",

        priorityLow: "Baixa",
        priorityMedium: "Média",
        priorityHigh: "Alta",
        priorityCritical: "Crítica"
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
        clearFilters: "Clear filters",

        priority: "Priority",
        createdBy: "Created by",
        assignedTo: "Assigned to",
        createdAt: "Created at",
        updatedAt: "Updated at",

        noAssignee: "Unassigned",
        unidentifiedUser: "Unidentified user",

        edit: "Edit",
        delete: "Delete",
        claim: "Claim",
        save: "Save",
        cancel: "Cancel",

        statusOpen: "Open",
        statusInProgress: "In progress",
        statusResolved: "Resolved",
        statusClosed: "Closed",

        priorityLow: "Low",
        priorityMedium: "Medium",
        priorityHigh: "High",
        priorityCritical: "Critical"
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
        document.dispatchEvent(new CustomEvent("languageChanged"));
    });
});

translatePage();

function t(key) {
    return translations[currentLanguage]?.[key] || key;
}

window.t = t;
window.getCurrentLanguage = () => currentLanguage;