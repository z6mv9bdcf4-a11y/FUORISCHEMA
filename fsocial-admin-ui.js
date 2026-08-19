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
    panel.style.cssText = `margin:0 0 28px;border:1px solid #202024;background:linear-gradient(145deg,#0d0d10,#080808);padding:20px;border-radius:14px;`;
    panel.innerHTML = `
      <div style="color:#ff4d00;font:900 9px Inter,Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px">OWNER TOOLS</div>
      <h2 style="margin:0;color:#fff;font:900 22px Syne,Inter,Arial,sans-serif;letter-spacing:-.5px">MODERAZIONE POST</h2>
      <p style="margin:8px 0 16px;color:#8b8b91;font:500 12px Inter,Arial,sans-serif;line-height:1.5">Qui puoi esaminare i post pubblicati su FSocial e rimuovere singolarmente quelli fuori luogo, espliciti o non conformi alle regole della community.</p>
      <div id="fsocialPostList" style="display:grid;gap:10px"></div>
      <div id="fsocialPostStatus" style="margin-top:10px;color:#666;font:700 9px Inter,Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;min-height:12px"></div>
    `;

    stats.insertAdjacentElement("afterend", panel);
    loadPosts(panel.querySelector("#fsocialPostList"), panel.querySelector("#fsocialPostStatus"));
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
  }

  async function loadPosts(list, status) {
    list.innerHTML = `<div style="color:#777;font:700 9px Inter,Arial,sans-serif;letter-spacing:1px;text-transform:uppercase">CARICAMENTO POST...</div>`;

    const { data: posts, error } = await supabase.from("posts").select("id,user_id,content,image_url,created_at").order("created_at", { ascending:false });
    if (error) {
      list.innerHTML = `<div style="color:#ff7b73;font:500 11px Inter,Arial,sans-serif">Impossibile caricare i post: ${escapeHtml(error.message)}</div>`;
      return;
    }

    const rows = posts || [];
    if (!rows.length) {
      list.innerHTML = `<div style="padding:18px;border:1px dashed #202024;color:#777;font:700 10px Inter,Arial,sans-serif;letter-spacing:1px;text-transform:uppercase">NESSUN POST DA MODERARE</div>`;
      return;
    }

    const ids = [...new Set(rows.map(post => post.user_id).filter(Boolean))];
    const profiles = new Map();
    if (ids.length) {
      const { data } = await supabase.from("profiles").select("id,username,full_name").in("id", ids);
      (data || []).forEach(profile => profiles.set(profile.id, profile));
    }

    list.innerHTML = rows.map(post => {
      const profile = profiles.get(post.user_id);
      const author = profile?.full_name || profile?.username || "Utente";
      const username = profile?.username ? `@${profile.username}` : "";
      const date = post.created_at ? new Date(post.created_at).toLocaleString("it-IT", { dateStyle:"medium", timeStyle:"short" }) : "";
      const image = post.image_url ? `<img src="${escapeHtml(post.image_url)}" alt="" style="width:100%;max-height:260px;object-fit:cover;border-radius:10px;margin-top:12px;border:1px solid rgba(255,255,255,.06)">` : "";
      const content = post.content ? escapeHtml(post.content) : "POST CON SOLO IMMAGINE";
      return `<article data-post-id="${post.id}" style="border:1px solid rgba(255,255,255,.07);background:#09090b;border-radius:12px;padding:14px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><div style="color:#fff;font:800 12px Inter,Arial,sans-serif">${escapeHtml(author)}</div><div style="color:#666;font:600 10px Inter,Arial,sans-serif;margin-top:3px">${escapeHtml(username)}</div></div><div style="color:#555;font:600 9px Inter,Arial,sans-serif">${escapeHtml(date)}</div></div><div style="margin-top:12px;color:#c7c7cb;font:500 12px Inter,Arial,sans-serif;line-height:1.5;white-space:pre-wrap">${content}</div>${image}<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.05)"><span style="color:#555;font:700 8px Inter,Arial,sans-serif;letter-spacing:1.2px;text-transform:uppercase">POST #${post.id}</span><button type="button" data-delete-post="${post.id}" style="border:1px solid rgba(255,59,48,.4);background:rgba(255,59,48,.04);color:#ff6258;padding:9px 12px;border-radius:999px;font:900 9px Inter,Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;cursor:pointer">ELIMINA POST</button></div></article>`;
    }).join("");

    list.querySelectorAll("[data-delete-post]").forEach(button => {
      button.addEventListener("click", async () => {
        const postId = Number(button.dataset.deletePost);
        if (!postId) return;
        if (!window.confirm("Eliminare questo post? L'azione rimuoverà solo questo contenuto e non gli altri post.")) return;

        button.disabled = true;
        button.textContent = "ELIMINAZIONE...";
        const { data, error } = await supabase.rpc("admin_delete_post", { target_post_id: postId });
        if (error || Number(data || 0) !== 1) {
          button.disabled = false;
          button.textContent = "ELIMINA POST";
          status.textContent = "ERRORE: " + (error?.message || "post non trovato");
          return;
        }

        document.querySelector(`[data-post-id="${postId}"]`)?.remove();
        status.textContent = `POST #${postId} ELIMINATO`;
        if (!list.children.length) list.innerHTML = `<div style="padding:18px;border:1px dashed #202024;color:#777;font:700 10px Inter,Arial,sans-serif;letter-spacing:1px;text-transform:uppercase">NESSUN POST DA MODERARE</div>`;
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAdminUI, { once:true });
  else initAdminUI();
})();
