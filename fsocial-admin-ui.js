const supabase = globalThis.__FUORISCHEMA_SUPABASE__;

(() => {
  "use strict";

  async function initAdminUI() {
    if (!supabase) return;

    const path = window.location.pathname.toLowerCase();
    if (!path.endsWith("/area-personale.html") && !path.endsWith("/fsocial-moderazione.html")) return;

    try {
      const { data, error } = await supabase.rpc("is_fsocial_admin");
      if (error || data !== true) {
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdminUI, { once: true });
  } else {
    initAdminUI();
  }
})();
