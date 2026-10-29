const API_BASE_URL = "https://q0mjnzirpg.execute-api.eu-north-1.amazonaws.com";

/* =========================================
   1. AFFICHER LES EVENEMENTS DEPUIS S3
   ========================================= */

async function loadEvents() {
    const eventsContainer = document.getElementById("events-container");

    if (!eventsContainer) {
        return;
    }

    try {
        const response = await fetch("./events.json");

        if (!response.ok) {
            throw new Error("HTTP error: " + response.status);
        }

        const events = await response.json();

        eventsContainer.replaceChildren();

        if (!Array.isArray(events) || events.length === 0) {
            eventsContainer.textContent = "Aucun evenement pour le moment.";
            return;
        }

        events.forEach(function (event) {
            const card = document.createElement("div");
            card.className = "event-card";

            const title = document.createElement("h3");
            title.textContent = event.title;

            const date = document.createElement("p");
            date.textContent = "Date : " + event.date;

            const time = document.createElement("p");
            time.textContent = "Heure : " + event.time;

            const description = document.createElement("p");
            description.textContent = event.description || "";

            const severity = document.createElement("p");
            severity.textContent = "Severite : " + event.severity;

            card.append(title, date, time, description, severity);
            eventsContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Erreur de chargement des evenements :", error);
        eventsContainer.textContent = "Impossible de charger les evenements.";
    }
}


/* =========================================
   2. INSCRIPTION AUX NOTIFICATIONS E-MAIL
   ========================================= */

const subscribeForm = document.getElementById("subscribe-form");

if (subscribeForm) {
    subscribeForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const emailInput = document.getElementById("email");
        const message = document.getElementById("message");

        if (!emailInput || !message) {
            console.error("Elements du formulaire d'inscription introuvables.");
            return;
        }

        const email = emailInput.value.trim();

        if (!email) {
            message.textContent = "Veuillez saisir votre adresse e-mail.";
            return;
        }

        message.textContent = "Inscription en cours...";

        try {
            const response = await fetch(
                API_BASE_URL + "/subscribe",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email: email })
                }
            );

            const data = await response.json();

            if (response.ok) {
                message.textContent =
                    data.message ||
                    "Demande envoyee. Verifiez votre boite e-mail pour confirmer.";
            } else {
                message.textContent =
                    data.message || "Echec de l'inscription.";
            }

        } catch (error) {
            console.error("Erreur d'inscription :", error);
            message.textContent = "Impossible de contacter le serveur.";
        }
    });
}


/* =========================================
   3. CREATION D'UN EVENEMENT
   ========================================= */

const eventForm = document.getElementById("event-form");

if (eventForm) {
    eventForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const message = document.getElementById("event-message");
        const titleInput = document.getElementById("event-title");
        const dateInput = document.getElementById("event-date");
        const timeInput = document.getElementById("event-time");
        const descriptionInput = document.getElementById("event-description");
        const severityInput = document.getElementById("event-severity");

        if (
            !message ||
            !titleInput ||
            !dateInput ||
            !timeInput ||
            !descriptionInput ||
            !severityInput
        ) {
            console.error("Un ou plusieurs champs du formulaire sont introuvables.");
            return;
        }

        const newEvent = {
            title: titleInput.value.trim(),
            date: dateInput.value,
            time: timeInput.value,
            description: descriptionInput.value.trim(),
            severity: severityInput.value
        };

        if (
            !newEvent.title ||
            !newEvent.date ||
            !newEvent.time ||
            !newEvent.severity
        ) {
            message.textContent = "Veuillez remplir tous les champs obligatoires.";
            return;
        }

        if (["info", "warning", "critical"].indexOf(newEvent.severity) === -1) {
            message.textContent = "La severite selectionnee est invalide.";
            return;
        }

        message.textContent = "Creation de l'evenement en cours...";

        try {
            const response = await fetch(
                API_BASE_URL + "/event",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(newEvent)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                message.textContent =
                    data.message ||
                    "Echec de la creation (HTTP " + response.status + ").";
                return;
            }

            message.textContent =
                data.message || "Evenement cree avec succes !";

            eventForm.reset();

            await new Promise(function (resolve) {
                setTimeout(resolve, 300);
            });

            await loadEvents();

        } catch (error) {
            console.error("Erreur de creation d'evenement :", error);

            message.textContent =
                "Impossible de contacter le serveur. Verifiez l'API et le CORS.";
        }
    });
}


/* =========================================
   4. INITIALISATION
   ========================================= */

document.addEventListener("DOMContentLoaded", loadEvents);