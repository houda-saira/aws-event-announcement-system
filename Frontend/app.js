/* =====================================================
   GATHER — FRONTEND APPLICATION
   Events + subscriptions + Cognito admin authentication
===================================================== */

/* =========================
   CONFIGURATION
========================= */

const API_BASE_URL =
  "https://q0mjnzirpg.execute-api.eu-north-1.amazonaws.com";

const COGNITO_REGION = "eu-north-1";

const COGNITO_USER_POOL_ID = "eu-north-1_mQvOjJXfG";

const COGNITO_CLIENT_ID = "1vha3av18t2t9mvgt9dc2glp45";

const COGNITO_DOMAIN = "https://eu-north-1mqvojjxfg.auth.eu-north-1.amazoncognito.com";

const COGNITO_ISSUER =
  `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;

const REDIRECT_URI = "https://d2ip8xq39wmurj.cloudfront.net/";

const OAUTH_SCOPES = "openid email";

const SESSION_KEY = "gather_admin_session";
const PKCE_VERIFIER_KEY = "gather_pkce_verifier";
const OAUTH_STATE_KEY = "gather_oauth_state";
const OAUTH_NONCE_KEY = "gather_oauth_nonce";


/* =========================
   DOM ELEMENTS
========================= */

const eventContainer =
  document.getElementById("events-container");

const eventsCount =
  document.getElementById("events-count");

const searchInput =
  document.getElementById("event-search");

const subscribeForm =
  document.getElementById("subscribe-form");

const eventForm =
  document.getElementById("event-form");

const adminSection =
  document.getElementById("admin-section");

const loginButton =
  document.getElementById("admin-login-button");

const logoutButton =
  document.getElementById("admin-logout-button");

const loginDialog =
  document.getElementById("admin-login-dialog");

const continueLoginButton =
  document.getElementById("continue-cognito-login");

const loginMessage =
  document.getElementById("login-message");

let cachedEvents = [];


/* =========================
   EVENT CATEGORIES
========================= */

const categoryLabels = {
  info: "Community",
  warning: "Important update",
  critical: "Critical notice"
};


/* =====================================================
   EVENTS
===================================================== */

/**
 * Formats an event date for display.
 */
function formatDateParts(dateValue) {
  const parsed = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return {
      day: "—",
      month: "Date tbc",
      full: dateValue || "Date to be announced"
    };
  }

  return {
    day: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit"
    }).format(parsed),

    month: new Intl.DateTimeFormat("en-GB", {
      month: "short"
    }).format(parsed),

    full: new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(parsed)
  };
}


/**
 * Creates an event card.
 */
function createEventCard(event) {
  const card = document.createElement("article");
  card.className = "event-card";

  const top = document.createElement("div");
  top.className = "event-card-top";

  const symbol = document.createElement("span");
  symbol.className = "event-symbol";
  symbol.setAttribute("aria-hidden", "true");

  symbol.textContent =
    event.severity === "critical"
      ? "✳"
      : event.severity === "warning"
        ? "↗"
        : "✦";

  const date = formatDateParts(event.date);

  const dateBadge = document.createElement("span");
  dateBadge.className = "event-date-badge";

  const day = document.createElement("strong");
  day.textContent = date.day;

  const month = document.createElement("span");
  month.textContent = date.month;

  dateBadge.append(day, month);
  top.append(symbol, dateBadge);

  const body = document.createElement("div");
  body.className = "event-card-body";

  const title = document.createElement("h3");
  title.textContent = event.title || "Untitled event";

  const meta = document.createElement("div");
  meta.className = "event-meta";

  const dateMeta = document.createElement("span");
  dateMeta.textContent = `◷ ${date.full}`;

  const timeMeta = document.createElement("span");
  timeMeta.textContent =
    `· ${event.time || "Time to be announced"}`;

  meta.append(dateMeta, timeMeta);

  const description = document.createElement("p");
  description.className = "event-description";

  description.textContent =
    event.description || "More details will be shared soon.";

  const bottom = document.createElement("div");
  bottom.className = "event-bottom";

  const tag = document.createElement("span");
  tag.className = "event-tag";

  tag.textContent =
    categoryLabels[event.severity] || "Event";

  const arrow = document.createElement("span");
  arrow.className = "event-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";

  bottom.append(tag, arrow);

  body.append(title, meta, description, bottom);
  card.append(top, body);

  return card;
}


/**
 * Displays events on the page.
 */
function renderEvents(events) {
  if (!eventContainer) return;

  eventContainer.replaceChildren();

  if (!Array.isArray(events) || events.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";

    empty.textContent =
      searchInput && searchInput.value.trim()
        ? "No events match your search. Try another keyword."
        : "Nothing on the calendar just yet. Please check back soon.";

    eventContainer.appendChild(empty);

    if (eventsCount) {
      eventsCount.textContent = "No events to show";
    }

    return;
  }

  events.forEach((event) => {
    eventContainer.appendChild(createEventCard(event));
  });

  if (eventsCount) {
    eventsCount.textContent =
      `${events.length} ${events.length === 1 ? "event" : "events"} to discover`;
  }
}


/**
 * Loads public events from events.json.
 */
async function loadEvents() {
  if (!eventContainer) return;

  try {
    const response = await fetch("./events.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const events = await response.json();

    if (!Array.isArray(events)) {
      throw new Error("Unexpected events data format");
    }

    cachedEvents = events;
    filterEvents();

  } catch (error) {
    console.error("Unable to load events:", error);

    eventContainer.replaceChildren();

    const errorState = document.createElement("p");
    errorState.className = "empty-state";
    errorState.textContent =
      "We couldn't load events right now. Please refresh the page and try again.";

    eventContainer.appendChild(errorState);

    if (eventsCount) {
      eventsCount.textContent = "Events temporarily unavailable";
    }
  }
}


/**
 * Filters events using the search field.
 */
function filterEvents() {
  const query = searchInput
    ? searchInput.value.trim().toLocaleLowerCase()
    : "";

  const filtered = cachedEvents.filter((event) => {
    const searchableValues = [
      event.title,
      event.description,
      event.date,
      event.time,
      categoryLabels[event.severity]
    ];

    return searchableValues
      .filter(Boolean)
      .some((value) =>
        String(value).toLocaleLowerCase().includes(query)
      );
  });

  renderEvents(filtered);
}


if (searchInput) {
  searchInput.addEventListener("input", filterEvents);
}


/* =====================================================
   NEWSLETTER SUBSCRIPTION
===================================================== */

if (subscribeForm) {
  subscribeForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailInput = document.getElementById("email");
    const message = document.getElementById("message");

    const submitButton = subscribeForm.querySelector(
      'button[type="submit"]'
    );

    if (!emailInput || !message || !submitButton) return;

    const email = emailInput.value.trim();

    if (!email) {
      message.textContent = "Please enter your email address.";
      message.classList.add("is-error");
      return;
    }

    message.textContent = "Submitting your subscription…";
    message.classList.remove("is-error");

    submitButton.disabled = true;

    try {
      const response = await fetch(
        `${API_BASE_URL}/subscribe`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({ email })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || `Request failed (HTTP ${response.status})`
        );
      }

      message.textContent =
        data.message ||
        "Request received. Check your inbox to confirm your subscription.";

      subscribeForm.reset();

    } catch (error) {
      console.error("Subscription failed:", error);

      message.textContent =
        error.message ||
        "We couldn't reach the server. Please try again.";

      message.classList.add("is-error");

    } finally {
      submitButton.disabled = false;
    }
  });
}


/* =====================================================
   COGNITO AUTHENTICATION — PKCE
===================================================== */

/**
 * Returns the configured Cognito domain.
 */
function getCognitoDomain() {
  const domain = COGNITO_DOMAIN.trim().replace(/\/+$/, "");

  if (
    !domain ||
    domain.includes("REPLACE_WITH_YOUR_COGNITO_DOMAIN")
  ) {
    throw new Error(
      "Configure your Cognito domain in app.js before logging in."
    );
  }

  if (!domain.startsWith("https://")) {
    throw new Error(
      "Your Cognito domain must start with https://"
    );
  }

  return domain;
}


/**
 * Converts bytes to a URL-safe Base64 string.
 */
function base64UrlEncode(bytes) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}


/**
 * Generates a cryptographically random string.
 */
function randomString(length = 64) {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

  const randomValues = new Uint8Array(length);

  crypto.getRandomValues(randomValues);

  return Array.from(
    randomValues,
    (value) => alphabet[value % alphabet.length]
  ).join("");
}


/**
 * Creates the PKCE SHA-256 challenge.
 */
async function createCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);

  const digest = await crypto.subtle.digest("SHA-256", data);

  return base64UrlEncode(new Uint8Array(digest));
}


/**
 * Reads the current admin session.
 */
function getAdminSession() {
  try {
    const rawSession = sessionStorage.getItem(SESSION_KEY);

    if (!rawSession) return null;

    const session = JSON.parse(rawSession);

    if (
      !session ||
      !session.accessToken ||
      !session.idToken ||
      !session.expiresAt ||
      Date.now() >= session.expiresAt
    ) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    return session;

  } catch (error) {
    console.error("Unable to read admin session:", error);

    sessionStorage.removeItem(SESSION_KEY);

    return null;
  }
}


/**
 * Decodes a JWT payload.
 *
 * This client-side decoding is not a substitute for
 * server-side JWT verification by API Gateway.
 */
function decodeJwtPayload(token) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid ID token format.");
  }

  const base64 = parts[1]
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded = base64.padEnd(
    Math.ceil(base64.length / 4) * 4,
    "="
  );

  const binary = atob(padded);

  const bytes = Uint8Array.from(
    binary,
    (character) => character.charCodeAt(0)
  );

  return JSON.parse(new TextDecoder().decode(bytes));
}


/**
 * Checks basic ID token claims for UI purposes.
 *
 * API Gateway must independently validate the access
 * token before allowing event creation.
 */
function validateIdToken(idToken, expectedNonce) {
  const payload = decodeJwtPayload(idToken);

  const now = Math.floor(Date.now() / 1000);

  if (payload.iss !== COGNITO_ISSUER) {
    throw new Error("Unexpected token issuer.");
  }

  if (payload.aud !== COGNITO_CLIENT_ID) {
    throw new Error("Unexpected token audience.");
  }

  if (!payload.exp || payload.exp <= now) {
    throw new Error("Your login session has expired.");
  }

  if (
    expectedNonce &&
    payload.nonce !== expectedNonce
  ) {
    throw new Error("Authentication nonce validation failed.");
  }

  return payload;
}


/**
 * Exchanges the authorization code for Cognito tokens.
 */
async function exchangeAuthorizationCode(code) {
  const domain = getCognitoDomain();

  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY);
  const expectedNonce = sessionStorage.getItem(OAUTH_NONCE_KEY);

  const url = new URL(window.location.href);

  const returnedState = url.searchParams.get("state");

  if (!verifier || !expectedState || !expectedNonce) {
    throw new Error(
      "Your login session could not be verified. Please try again."
    );
  }

  if (!returnedState || returnedState !== expectedState) {
    throw new Error(
      "Authentication state validation failed. Please try again."
    );
  }

  const response = await fetch(`${domain}/oauth2/token`, {
    method: "POST",

    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },

    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: COGNITO_CLIENT_ID,
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier
    })
  });

  const tokens = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Cognito token exchange failed:", tokens);

    throw new Error(
      "Unable to complete login. Please try again."
    );
  }

  if (!tokens.access_token || !tokens.id_token) {
    throw new Error(
      "Cognito did not return the expected authentication tokens."
    );
  }

  validateIdToken(tokens.id_token, expectedNonce);

  const expiresIn = Number(tokens.expires_in) || 3600;

  const session = {
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    expiresAt: Date.now() + expiresIn * 1000
  };

  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session)
  );

  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_NONCE_KEY);

  return session;
}


/**
 * Removes OAuth query parameters from the address bar.
 */
function cleanCallbackUrl() {
  const cleanUrl = new URL(window.location.href);

  cleanUrl.searchParams.delete("code");
  cleanUrl.searchParams.delete("state");
  cleanUrl.searchParams.delete("error");
  cleanUrl.searchParams.delete("error_description");

  window.history.replaceState(
    {},
    document.title,
    cleanUrl.pathname + cleanUrl.search + cleanUrl.hash
  );
}


/**
 * Starts the Cognito Hosted UI authorization flow.
 */
async function startCognitoLogin() {
  try {
    const domain = getCognitoDomain();

    if (!window.crypto || !window.crypto.subtle) {
      throw new Error(
        "Secure authentication requires HTTPS or localhost."
      );
    }

    const verifier = randomString(64);
    const challenge = await createCodeChallenge(verifier);

    const state = randomString(32);
    const nonce = randomString(32);

    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
    sessionStorage.setItem(OAUTH_STATE_KEY, state);
    sessionStorage.setItem(OAUTH_NONCE_KEY, nonce);

    const authorizeUrl = new URL(`${domain}/oauth2/authorize`);

    authorizeUrl.search = new URLSearchParams({
      response_type: "code",
      client_id: COGNITO_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: OAUTH_SCOPES,
      state,
      nonce,
      code_challenge_method: "S256",
      code_challenge: challenge
    }).toString();

    window.location.assign(authorizeUrl.toString());

  } catch (error) {
    console.error("Unable to start Cognito login:", error);

    showLoginMessage(
      error.message || "Unable to start login.",
      true
    );
  }
}


/**
 * Logs the administrator out locally and from Cognito.
 */
function logoutAdmin() {
  const domain = getCognitoDomain();

  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_NONCE_KEY);

  updateAdminInterface();

  const logoutUrl = new URL(`${domain}/logout`);

  logoutUrl.search = new URLSearchParams({
    client_id: COGNITO_CLIENT_ID,
    logout_uri: REDIRECT_URI
  }).toString();

  window.location.assign(logoutUrl.toString());
}


/* =====================================================
   ADMIN INTERFACE
===================================================== */

/**
 * Shows or hides the admin workspace based on the
 * current browser session.
 *
 * This controls the interface only. API authorization
 * must be enforced independently by API Gateway.
 */
function updateAdminInterface() {
  const session = getAdminSession();
  const isLoggedIn = Boolean(session);

  if (adminSection) {
    adminSection.hidden = !isLoggedIn;
  }

  if (loginButton) {
    loginButton.hidden = isLoggedIn;
  }

  if (logoutButton) {
    logoutButton.hidden = !isLoggedIn;
  }
}


/**
 * Displays a login message.
 */
function showLoginMessage(message, isError = false) {
  if (!loginMessage) return;

  loginMessage.textContent = message;
  loginMessage.classList.toggle("is-error", isError);
}


/**
 * Opens the login dialog.
 */
function openLoginDialog() {
  showLoginMessage("");

  if (loginDialog && typeof loginDialog.showModal === "function") {
    if (!loginDialog.open) {
      loginDialog.showModal();
    }
  } else {
    startCognitoLogin();
  }
}


/**
 * Handles the callback after Cognito redirects back.
 */
async function handleCognitoCallback() {
  const url = new URL(window.location.href);

  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    const description =
      url.searchParams.get("error_description");

    cleanCallbackUrl();

    console.error("Cognito authorization error:", oauthError, description);

    showLoginMessage(
      "Login was not completed. Please try again.",
      true
    );

    return;
  }

  if (!code) return;

  try {
    await exchangeAuthorizationCode(code);

    cleanCallbackUrl();

    updateAdminInterface();

    if (loginDialog && loginDialog.open) {
      loginDialog.close();
    }

  } catch (error) {
    console.error("Cognito callback failed:", error);

    cleanCallbackUrl();

    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    sessionStorage.removeItem(OAUTH_NONCE_KEY);

    updateAdminInterface();

    showLoginMessage(
      error.message || "Login failed. Please try again.",
      true
    );
  }
}


/* Login button */
if (loginButton) {
  loginButton.addEventListener("click", openLoginDialog);
}


/* Continue to Cognito */
if (continueLoginButton) {
  continueLoginButton.addEventListener("click", () => {
    startCognitoLogin();
  });
}


/* Logout button */
if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    try {
      logoutAdmin();
    } catch (error) {
      console.error("Logout failed:", error);

      sessionStorage.removeItem(SESSION_KEY);
      updateAdminInterface();
    }
  });
}


/* Close dialog buttons, if present in the HTML */
if (loginDialog) {
  loginDialog
    .querySelectorAll("[data-close-dialog]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        loginDialog.close();
      });
    });
}


/* =====================================================
   CREATE EVENT — ADMIN ONLY
===================================================== */

if (eventForm) {
  eventForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = document.getElementById("event-message");

    const submitButton = eventForm.querySelector(
      'button[type="submit"]'
    );

    if (!message || !submitButton) return;

    const session = getAdminSession();

    if (!session) {
      message.textContent =
        "Please sign in as an administrator before publishing an event.";

      message.classList.add("is-error");

      updateAdminInterface();

      return;
    }

    const newEvent = {
      title: document.getElementById("event-title").value.trim(),

      date: document.getElementById("event-date").value,

      time: document.getElementById("event-time").value,

      description: document
        .getElementById("event-description")
        .value.trim(),

      severity: document.getElementById("event-severity").value
    };

    if (
      !newEvent.title ||
      !newEvent.date ||
      !newEvent.time ||
      !newEvent.severity
    ) {
      message.textContent =
        "Please complete all required fields.";

      message.classList.add("is-error");

      return;
    }

    if (
      !["info", "warning", "critical"].includes(newEvent.severity)
    ) {
      message.textContent = "Please choose a valid category.";

      message.classList.add("is-error");

      return;
    }

    message.textContent = "Publishing event…";
    message.classList.remove("is-error");

    submitButton.disabled = true;

    try {
      const response = await fetch(
        `${API_BASE_URL}/event`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`
          },

          body: JSON.stringify(newEvent)
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Your session may have expired, or you may not have permission to publish events."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
          `Request failed (HTTP ${response.status})`
        );
      }

      message.textContent =
        data.message || "Event created successfully.";

      eventForm.reset();

      await loadEvents();

    } catch (error) {
      console.error("Event creation failed:", error);

      message.textContent =
        error.message ||
        "Unable to publish the event. Please check the API configuration.";

      message.classList.add("is-error");

    } finally {
      submitButton.disabled = false;
    }
  });
}


/* =====================================================
   INITIALIZATION
===================================================== */

async function initializeGather() {
  updateAdminInterface();

  await loadEvents();

  await handleCognitoCallback();

  updateAdminInterface();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeGather
  );
} else {
  initializeGather();
}