import { supabase } from "./supabase.js";

const path = window.location.pathname.toLowerCase();

function errorText(error) {
    return error?.message || "Errore di autenticazione. Riprova.";
}

function showInline(message) {
    const feedback = document.getElementById("authFeedback");
    const text = document.getElementById("authFeedbackText");
    const title = document.getElementById("authFeedbackTitle");
    const mark = document.getElementById("authFeedbackMark");
    const kicker = document.getElementById("authFeedbackKicker");
    if (feedback && text && title && mark && kicker) {
        feedback.classList.add("error");
        mark.textContent = "!";
        kicker.textContent = "01 / ACCESS ERROR";
        title.textContent = "ACCESSO NEGATO.";
        text.textContent = message;
        feedback.classList.add("active");
        feedback.setAttribute("aria-hidden", "false");
        return;
    }
    console.error("FUORISCHEMA AUTH:", message);
}

async function handleLogin(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const email = document.getElementById("email")?.value.trim() || "";
    const password = document.getElementById("password")?.value || "";
    const button = document.getElementById("loginBtn");

    if (!email || !password) {
        showInline("Inserisci email e password per continuare.");
        return;
    }

    button?.classList.add("loading");
    if (button) button.disabled = true;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        button?.classList.remove("loading");
        if (button) button.disabled = false;
        showInline(errorText(error));
        return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        button?.classList.remove("loading");
        if (button) button.disabled = false;
        showInline("Accesso completato ma sessione non disponibile. Riprova.");
        return;
    }

    window.location.replace("Fsocial.html");
}

async function handleRecovery(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const email = document.getElementById("resetEmail")?.value.trim() || "";
    const button = document.getElementById("resetBtn");

    if (!email) {
        showInline("Inserisci il tuo indirizzo email per ricevere il link di recupero.");
        return;
    }

    button?.classList.add("loading");
    if (button) button.disabled = true;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://fuorischemastore.it/reset-password.html"
    });

    button?.classList.remove("loading");
    if (button) button.disabled = false;

    if (error) {
        showInline(errorText(error));
        return;
    }

    const feedback = document.getElementById("authFeedback");
    const text = document.getElementById("authFeedbackText");
    const title = document.getElementById("authFeedbackTitle");
    const kicker = document.getElementById("authFeedbackKicker");
    const mark = document.getElementById("authFeedbackMark");
    if (feedback && text && title && kicker && mark) {
        feedback.classList.remove("error");
        mark.textContent = "✓";
        kicker.textContent = "02 / RECOVERY SENT";
        title.textContent = "LINK INVIATO.";
        text.textContent = "Se l'indirizzo è associato a un account FUORISCHEMA, riceverai un'email con le istruzioni per reimpostare la password.";
        feedback.classList.add("active");
        feedback.setAttribute("aria-hidden", "false");
    }
}

function bindLogin() {
    const loginButton = document.getElementById("loginBtn");
    const recoveryButton = document.getElementById("resetBtn");
    if (loginButton && !loginButton.dataset.fsAuthBridge) {
        loginButton.dataset.fsAuthBridge = "1";
        loginButton.addEventListener("click", handleLogin, true);
    }
    if (recoveryButton && !recoveryButton.dataset.fsAuthBridge) {
        recoveryButton.dataset.fsAuthBridge = "1";
        recoveryButton.addEventListener("click", handleRecovery, true);
    }
}

if (path.endsWith("/login.html")) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindLogin, { once: true });
    else bindLogin();
}
