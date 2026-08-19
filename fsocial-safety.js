import { supabase } from "./supabase.js";

(() => {
  "use strict";

  const STYLE_ID = "fsocial-safety-style";
  const ACTIONS_ID = "fsocial-safety-actions";
  const REASONS = [
    ["spam", "Spam"],
    ["harassment", "Molestie / comportamenti offensivi"],
    ["inappropriate", "Contenuti inappropriati"],
    ["fake_account", "Account falso"],
    ["scam", "Truffa / comportamento sospetto"],
    ["other", "Altro"]
  ];

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${ACTIONS_ID}{margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.06);display:grid;gap:8px}
      .fs-safety-btn{width:100%;padding:10px 12px;border:1px solid rgba(255,255,255,.09);border-radius:999px;background:rgba(255,255,255,.035);color:#aaa;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all .2s ease}
      .fs-safety-btn:hover{color:#fff;border-color:rgba(255,255,255,.2);background:rgba(255,255,255,.07)}
      .fs-safety-btn.danger{color:#ff5a50}
      .fs-safety-btn.danger:hover{border-color:rgba(255,59,48,.35);background:rgba(255,59,48,.08)}
      .fs-safety-overlay{position:fixed;inset:0;z-index:100002;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.86);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
      .fs-safety-overlay.active{display:flex}
      .fs-safety-modal{width:min(100%,390px);padding:24px;border:1px solid rgba(255,255,255,.1);border-radius:20px;background:#0d0d10;box-shadow:0 30px 70px rgba(0,0,0,.85)}
      .fs-safety-modal h3{margin:0 0 8px;color:#fff;font-size:16px;font-weight:900;letter-spacing:.5px;text-transform:uppercase}
      .fs-safety-modal p{margin:0 0 18px;color:#888;font-size:12px;line-height:1.5}
      .fs-safety-reasons{display:grid;gap:8px;margin-bottom:14px}
      .fs-safety-reason{display:flex;align-items:center;gap:9px;padding:10px 12px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(255,255,255,.025);color:#ddd;font-size:11px;cursor:pointer}
      .fs-safety-reason input{accent-color:#ff4d00}
      .fs-safety-description{width:100%;min-height:80px;resize:vertical;padding:10px 12px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:#09090b;color:#fff;outline:0;font-size:12px}
      .fs-safety-actions{display:flex;gap:8px;margin-top:14px}
      .fs-safety-actions button{flex:1;padding:10px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;cursor:pointer}
      .fs-safety-cancel{background:transparent;color:#aaa}
      .fs-safety-submit{background:#ff4d00;color:#000;border-color:#ff4d00!important}
      .fs-safety-message{margin-top:10px;color:#aaa;font-size:11px;line-height:1.4}
    `;
    document.head.appendChild(style);
  }

  function toast(message) {
    const existing = document.getElementById("toast");
    if (existing) {
      existing.textContent = message;
      existing.classList.add("show");
      clearTimeout(window.__fsSafetyToast);
      window.__fsSafetyToast = setTimeout(() => existing.classList.remove("show"), 2600);
      return;
    }
    alert(message);
  }

  function getProfileId() {
    const link = document.getElementById("profilePageLink");
    const match = link?.getAttribute("href")?.match(/[?&]id=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function closeProfile() {
    document.getElementById("profileClose")?.click();
  }

  function buildActions() {
    const social = document.querySelector("#profileOverlay .profile-social");
    if (!social || document.getElementById(ACTIONS_ID)) return;

    const actions = document.createElement("div");
    actions.id = ACTIONS_ID;
    actions.innerHTML = `
      <button type="button" class="fs-safety-btn" data-safety-action="report">Segnala utente</button>
      <button type="button" class="fs-safety-btn danger" data-safety-action="block">Blocca utente</button>
    `;
    social.parentElement.appendChild(actions);

    actions.querySelector('[data-safety-action="report"]').addEventListener("click", openReport);
    actions.querySelector('[data-safety-action="block"]').addEventListener("click", blockUser);
  }

  function openReport() {
    const reportedId = getProfileId();
    if (!reportedId) return toast("Impossibile identificare questo utente.");
    const overlay = document.createElement("div");
    overlay.className = "fs-safety-overlay active";
    overlay.id = "fsReportOverlay";
    overlay.innerHTML = `
      <div class="fs-safety-modal" role="dialog" aria-modal="true" aria-labelledby="fsReportTitle">
        <h3 id="fsReportTitle">Segnala utente</h3>
        <p>La segnalazione verrà inviata per la revisione. Scegli il motivo e, se vuoi, aggiungi dettagli.</p>
        <div class="fs-safety-reasons">
          ${REASONS.map(([value,label]) => `<label class="fs-safety-reason"><input type="radio" name="fs-report-reason" value="${value}"> <span>${label}</span></label>`).join("")}
        </div>
        <textarea id="fsReportDescription" class="fs-safety-description" maxlength="1000" placeholder="Dettagli opzionali..."></textarea>
        <div class="fs-safety-actions">
          <button type="button" class="fs-safety-cancel" id="fsReportCancel">Annulla</button>
          <button type="button" class="fs-safety-submit" id="fsReportSubmit">Invia segnalazione</button>
        </div>
        <div id="fsReportMessage" class="fs-safety-message"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector("#fsReportCancel").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (event) => { if (event.target === overlay) overlay.remove(); });
    overlay.querySelector("#fsReportSubmit").addEventListener("click", async () => {
      const reason = overlay.querySelector('input[name="fs-report-reason"]:checked')?.value;
      const description = overlay.querySelector("#fsReportDescription").value.trim() || null;
      const message = overlay.querySelector("#fsReportMessage");
      if (!reason) { message.textContent = "Seleziona un motivo."; return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { message.textContent = "Devi essere autenticato."; return; }
      if (user.id === reportedId) { message.textContent = "Non puoi segnalare te stesso."; return; }
      const button = overlay.querySelector("#fsReportSubmit");
      button.disabled = true;
      button.textContent = "INVIO...";
      const { error } = await supabase.from("user_reports").insert({ reporter_id: user.id, reported_id: reportedId, reason, description });
      if (error) {
        button.disabled = false;
        button.textContent = "INVIA SEGNALAZIONE";
        message.textContent = error.code === "23505" ? "Segnalazione già registrata." : (error.message || "Errore durante l'invio.");
        return;
      }
      overlay.remove();
      closeProfile();
      toast("Segnalazione inviata.");
    });
  }

  async function blockUser() {
    const blockedId = getProfileId();
    if (!blockedId) return toast("Impossibile identificare questo utente.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast("Devi essere autenticato.");
    if (user.id === blockedId) return toast("Non puoi bloccare te stesso.");
    const confirmed = window.confirm("Bloccare questo utente? Non vedrai più i suoi contenuti e non potrà interagire con te.");
    if (!confirmed) return;
    const { error } = await supabase.from("user_blocks").insert({ blocker_id: user.id, blocked_id: blockedId });
    if (error && error.code !== "23505") return toast(error.message || "Errore durante il blocco.");
    closeProfile();
    toast("Utente bloccato.");
    setTimeout(() => window.location.reload(), 500);
  }

  function observeProfile() {
    const overlay = document.getElementById("profileOverlay");
    if (!overlay) return;
    const observer = new MutationObserver(() => {
      if (overlay.classList.contains("active")) buildActions();
    });
    observer.observe(overlay, { attributes: true, attributeFilter: ["class"] });
  }

  function init() {
    injectStyles();
    observeProfile();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
