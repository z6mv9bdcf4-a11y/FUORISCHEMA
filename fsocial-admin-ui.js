const supabase = globalThis.__FUORISCHEMA_SUPABASE__;

(() => {
  "use strict";

  const OWNER_EMAILS = new Set([
    "gennyesposito2000@icloud.com",
    "vincenzo.castaldo11@icloud.com"
  ]);

  async function isOwner() {
    if (!supabase) return false;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.email) return false;
    return OWNER_EMAILS.has(String(data.user.email).toLowerCase());
  }

  async function initAdminUI() {
    if (!supabase) return;

    const path = window.location.pathname.toLowerCase();

    try {
      const owner = await isOwner();

      if (owner) {
        addHamburgerModerationLink();
        if (!document.querySelector(".side-menu")) {
          const observer = new MutationObserver(() => {
            addHamburgerModerationLink();
            if (document.querySelector("[data-fsocial-owner-menu]")) observer.disconnect();
          });
          observer.observe(document.documentElement, { childList: true, subtree: true });
          setTimeout(() => observer.disconnect(), 10000);
        }
      }

      if (!path.endsWith("/area-personale.html") && !path.endsWith("/fsocial-moderazione.html")) return;

      if (!owner) {
        if (path.endsWith("/fsocial-moderazione.html")) {
          document.body.innerHTML = `
            <div style="min-height:100vh;display:grid;place-items:center;background:#050505;color:#f4f4f4;font-family:Inter,Arial,sans-serif;padding:24px;text-align:center">
              <div>
                <div style="color:#ff4d00;font-size:10px;font-weight:900;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px">FUORISCHEMA</div>
                <strong style="font-size:18px">ACCESSO NEGATO</strong>
              </div>
            </div>`;
        }
        return;
      }

      if (path.endsWith("/area-personale.html")) addModerationButton();
      if (path.endsWith("/fsocial-moderazione.html")) addPostManagement();
    } catch (error) {
      console.error("FSocial admin UI check failed:", error);
    }
  }

  function addModerationButton() {
    const actions = document.querySelector(".actions");
    if (!actions || document.getElementById("fsocialModerationButton")) return;

    const button = document.createElement("a");
    button.id = "fsocialModerationButton";
    button.href = "fsocial-moderazione.html";
    button.className = "action-btn";
    button.textContent = "CENTRO MODERAZIONE";
    button.style.borderColor = "rgba(255,77,0,.45)";
    button.style.color = "#ff4d00";
    button.title = "Strumenti di moderazione";

    actions.appendChild(button);
  }

  function addHamburgerModerationLink() {
    const sideMenu = document.querySelector(".side-menu");
    if (!sideMenu || sideMenu.querySelector("[data-fsocial-owner-menu]")) return;

    const box = document.createElement("a");
    box.href = "fsocial-moderazione.html";
    box.setAttribute("data-fsocial-owner-menu", "true");
    box.className = "menu-feature";
    box.style.marginBottom = "42px";
    box.style.display = "block";
    box.innerHTML = `
      <div class="menu-feature-top">
        <span class="menu-feature-label">OWNER / MODERAZIONE</span>
        <span class="menu-feature-arrow">↗</span>
      </div>
      <span class="menu-feature-title">CENTRO MODERAZIONE</span>
      <span class="menu-feature-text">Segnalazioni e strumenti riservati ai proprietari di FUORISCHEMA.</span>
    `;

    const existingFeature = sideMenu.querySelector(".menu-feature");
    const firstSection = sideMenu.querySelector(".menu-section");
    if (existingFeature) existingFeature.insertAdjacentElement("afterend", box);
    else if (firstSection) sideMenu.insertBefore(box, firstSection);
    else sideMenu.appendChild(box);
  }

  function addPostManagement() {
    if (document.getElementById("fsocialPostManagement")) return;

    const wrap = document.querySelector(".wrap");
    const stats = document.querySelector(".stats");
    if (!wrap || !stats) return;

    const panel = document.createElement("section");
    panel.id = "fsocialPostManagement";
    panel.style.cssText = `
      margin:0 0 28px;
      border:1px solid #202024;
      background:linear-gradient(145deg,#0d0d10,#080808);
      padding:20px;
      border-radius:14px;
    `;
    panel.innerHTML = `
      <div style="color:#ff4d00;font:900 9px Inter,Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px">OWNER TOOLS</div>
      <h2 style="margin:0;color:#fff;font:900 22px Syne,Inter,Arial,sans-serif;letter-spacing:-.5px">GESTIONE POST</h2>
      <p style="margin:8px 0 16px;color:#8b8b91;font:500 12px Inter,Arial,sans-serif;line-height:1.5">Strumenti riservati ai proprietari. L'eliminazione globale rimuove tutti i post FSocial e i relativi contenuti collegati.</p>
      <button id="deleteAllFsocialPosts" type="button" style="border:1px solid rgba(255,59,48,.45);background:#111114;color:#ff6258;padding:11px 15px;border-radius:999px;font:900 9px Inter,Arial,sans-serif;letter-spacing:1.2px;text-transform:uppercase;cursor:pointer">ELIMINA TUTTI I POST</button>
      <div id="deleteAllFsocialStatus" style="margin-top:10px;color:#666;font:700 9px Inter,Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;min-height:12px"></div>
    `;

    stats.insertAdjacentElement("afterend", panel);

    const button = document.getElementById("deleteAllFsocialPosts");
    const status = document.getElementById("deleteAllFsocialStatus");

    button.addEventListener("click", async () => {
      const first = window.confirm("ATTENZIONE: stai per eliminare TUTTI i post FSocial. Vuoi continuare?");
      if (!first) return;

      const second = window.confirm("CONFERMA FINALE: tutti i post verranno rimossi. Questa operazione non può essere annullata. Procedere?");
      if (!second) return;

      button.disabled = true;
      button.style.opacity = ".5";
      status.textContent = "ELIMINAZIONE IN CORSO...";

      const { data, error } = await supabase.rpc("admin_delete_all_posts");
      if (error) {
        console.error(error);
        status.textContent = "ERRORE: " + error.message;
        button.disabled = false;
        button.style.opacity = "1";
        return;
      }

      status.textContent = `${Number(data || 0)} POST ELIMINATI`;
      setTimeout(() => window.location.reload(), 800);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdminUI, { once: true });
  } else {
    initAdminUI();
  }
})();
