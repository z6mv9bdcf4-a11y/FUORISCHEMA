const supabase = globalThis.__FUORISCHEMA_SUPABASE__;

(() => {
  "use strict";

  async function isOwner() {
    if (!supabase) return false;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return false;
    return data.user.app_metadata?.role === "admin";
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
      <span class="menu-feature-text">Segnalazioni e strumenti riservati agli amministratori di FUORISCHEMA.</span>
    `;

    const existingFeature = sideMenu.querySelector(".menu-feature");
    const firstSection = sideMenu.querySelector(".menu-section");
    if (existingFeature) existingFeature.insertAdjacentElement("afterend", box);
    else if (firstSection) sideMenu.insertBefore(box, firstSection);
    else sideMenu.appendChild(box);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdminUI, { once: true });
  } else {
    initAdminUI();
  }
})();
