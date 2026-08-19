const supabase = globalThis.__FUORISCHEMA_SUPABASE__;

(() => {
  "use strict";

  const STYLE_ID = "fsocial-safety-style";
  const ACTIONS_ID = "fsocial-safety-actions";
  const REASONS = [
    ["spam", "Spam / commenti ripetitivi"],
    ["harassment", "Insulti, molestie o minacce"],
    ["inappropriate", "Contenuti sessuali o inappropriati"],
    ["fake_account", "Profilo sospetto o impersonificazione"],
    ["scam", "Truffa, frode o comportamento sospetto"],
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
      .fs-safety-overlay{position:fixed;inset:0;z-index:100002;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.86);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .28s ease,visibility .28s ease}
      .fs-safety-overlay.active{opacity:1;visibility:visible;pointer-events:auto}
      .fs-safety-modal{width:min(100%,390px);padding:24px;border:1px solid rgba(255,255,255,.1);border-radius:20px;background:#0d0d10;box-shadow:0 30px 70px rgba(0,0,0,.85);transform:translateY(18px) scale(.97);opacity:0;transition:transform .34s cubic-bezier(.16,1,.3,1),opacity .25s ease}
      .fs-safety-overlay.active .fs-safety-modal{transform:translateY(0) scale(1);opacity:1}
      .fs-safety-modal h3{margin:0 0 8px;color:#fff;font-size:16px;font-weight:900;letter-spacing:.5px;text-transform:uppercase}
      .fs-safety-modal p{margin:0 0 18px;color:#888;font-size:12px;line-height:1.5}
      .fs-safety-reasons{display:grid;gap:8px;margin-bottom:14px}
      .fs-safety-reason{display:flex;align-items:center;gap:9px;padding:10px 12px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(255,255,255,.025);color:#ddd;font-size:11px;cursor:pointer;transition:border-color .2s ease,background .2s ease,transform .2s ease}
      .fs-safety-reason:hover{border-color:rgba(255,77,0,.3);background:rgba(255,77,0,.06);transform:translateX(2px)}
      .fs-safety-reason:has(input:checked){border-color:rgba(255,77,0,.45);background:rgba(255,77,0,.09);color:#fff}
      .fs-safety-reason input{accent-color:#ff4d00}
      .fs-safety-description{width:100%;min-height:80px;resize:vertical;padding:10px 12px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:#09090b;color:#fff;outline:0;font-size:12px;transition:border-color .2s ease}
      .fs-safety-description:focus{border-color:rgba(255,77,0,.4)}
      .fs-safety-actions{display:flex;gap:8px;margin-top:14px}
      .fs-safety-actions button{flex:1;padding:10px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;cursor:pointer}
      .fs-safety-cancel{background:transparent;color:#aaa}
      .fs-safety-submit{background:#ff4d00;color:#000;border-color:#ff4d00!important}
      .fs-safety-message{margin-top:10px;color:#aaa;font-size:11px;line-height:1.4}
      .fs-block-modal{text-align:center}
      .fs-block-icon{width:52px;height:52px;margin:0 auto 16px;border:1px solid rgba(255,59,48,.25);border-radius:50%;display:grid;place-items:center;color:#ff5a50;background:rgba(255,59,48,.08);font-size:20px;animation:fsBlockPulse 2s ease-in-out infinite}
      .fs-block-modal p{max-width:310px;margin:0 auto 20px}
      .fs-block-actions{display:flex;gap:8px}
      .fs-block-actions button{flex:1;padding:11px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;cursor:pointer}
      .fs-block-cancel{background:transparent;color:#aaa}
      .fs-block-confirm{background:#ff3b30;color:#fff;border-color:#ff3b30!important}
      @keyframes fsBlockPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,59,48,0)}50%{box-shadow:0 0 0 8px rgba(255,59,48,.05)}}
      @media (prefers-reduced-motion:reduce){.fs-safety-overlay,.fs-safety-modal,.fs-safety-reason,.fs-block-icon{transition:none!important;animation:none!important}}
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
      <button type="button" class="fs-safety-btn danger" data-safety-action="block">Blocca utente</button>`;
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
        <p>Segnala il comportamento di questo profilo. Scegli il motivo più vicino a quello che hai visto nei suoi commenti.</p>
        <div class="fs-safety-reasons">${REASONS.map(([value,label]) => `<label class="fs-safety-reason"><input type="radio" name="fs-report-reason" value="${value}"> <span>${label}</span></label>`).join("")}</div>
        <textarea id="fsReportDescription" class="fs-safety-description" maxlength="1000" placeholder="Dettagli opzionali..."></textarea>
        <div class="fs-safety-actions"><button type="button" class="fs-safety-cancel" id="fsReportCancel">Annulla</button><button type="button" class="fs-safety-submit" id="fsReportSubmit">Invia segnalazione</button></div>
        <div id="fsReportMessage" class="fs-safety-message"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector("#fsReportCancel").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", event => { if (event.target === overlay) overlay.remove(); });
    overlay.querySelector("#fsReportSubmit").addEventListener("click", async () => {
      const reason = overlay.querySelector('input[name="fs-report-reason"]:checked')?.value;
      const description = overlay.querySelector("#fsReportDescription").value.trim() || null;
      const message = overlay.querySelector("#fsReportMessage");
      if (!reason) { message.textContent = "Seleziona un motivo."; return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { message.textContent = "Devi essere autenticato."; return; }
      if (user.id === reportedId) { message.textContent = "Non puoi segnalare te stesso."; return; }
      const button = overlay.querySelector("#fsReportSubmit");
      button.disabled = true; button.textContent = "INVIO...";
      const { error } = await supabase.from("user_reports").insert({ reporter_id: user.id, reported_id: reportedId, reason, description });
      if (error) {
        button.disabled = false; button.textContent = "INVIA SEGNALAZIONE";
        message.textContent = error.message || "Errore durante l'invio."; return;
      }
      overlay.remove(); closeProfile(); toast("Segnalazione inviata.");
    });
  }

  function openBlockConfirm(blockedId, onConfirm) {
    const overlay = document.createElement("div");
    overlay.className = "fs-safety-overlay active";
    overlay.id = "fsBlockOverlay";
    overlay.innerHTML = `
      <div class="fs-safety-modal fs-block-modal" role="dialog" aria-modal="true" aria-labelledby="fsBlockTitle">
        <div class="fs-block-icon" aria-hidden="true">×</div>
        <h3 id="fsBlockTitle">Blocca utente?</h3>
        <p>Non vedrai più i suoi contenuti e questo utente non potrà interagire con te.</p>
        <div class="fs-block-actions">
          <button type="button" class="fs-block-cancel" id="fsBlockCancel">Annulla</button>
          <button type="button" class="fs-block-confirm" id="fsBlockConfirm">Blocca utente</button>
        </div>
        <div id="fsBlockMessage" class="fs-safety-message"></div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector("#fsBlockCancel").addEventListener("click", close);
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    overlay.querySelector("#fsBlockConfirm").addEventListener("click", async () => {
      const button = overlay.querySelector("#fsBlockConfirm");
      const message = overlay.querySelector("#fsBlockMessage");
      button.disabled = true;
      button.textContent = "BLOCCO...";
      try {
        await onConfirm(blockedId, message);
      } catch (error) {
        button.disabled = false;
        button.textContent = "BLOCCA UTENTE";
        message.textContent = error?.message || "Errore durante il blocco.";
      }
    });
  }

  async function blockUser() {
    const blockedId = getProfileId();
    if (!blockedId) return toast("Impossibile identificare questo utente.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast("Devi essere autenticato.");
    if (user.id === blockedId) return toast("Non puoi bloccare te stesso.");
    openBlockConfirm(blockedId, async (targetId) => {
      const { error } = await supabase.from("user_blocks").insert({ blocker_id: user.id, blocked_id: targetId });
      if (error && error.code !== "23505") throw error;
      document.getElementById("fsBlockOverlay")?.remove();
      closeProfile();
      toast("Utente bloccato.");
      setTimeout(() => window.location.reload(), 500);
    });
  }

  function observeProfile() {
    const overlay = document.getElementById("profileOverlay");
    if (!overlay) return;
    const observer = new MutationObserver(() => { if (overlay.classList.contains("active")) buildActions(); });
    observer.observe(overlay, { attributes: true, attributeFilter: ["class"] });
  }

  function init() { if (!supabase) return; injectStyles(); observeProfile(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
