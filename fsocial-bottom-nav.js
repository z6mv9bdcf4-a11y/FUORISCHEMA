(() => {
  "use strict";

  if (window.__FUORISCHEMA_BOTTOM_NAV__) return;
  window.__FUORISCHEMA_BOTTOM_NAV__ = true;

  const css = `
    #fsocialBottomNav {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 99990;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(10,10,12,.94);
      border-top: 1px solid rgba(255,255,255,.08);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      box-shadow: 0 -12px 35px rgba(0,0,0,.35);
      padding: 6px 18px calc(6px + env(safe-area-inset-bottom));
    }
    #fsocialBottomNav .fsbn-inner {
      width: min(760px, 100%);
      height: 100%;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      align-items: center;
      gap: 6px;
    }
    #fsocialBottomNav .fsbn-item {
      height: 100%;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      color: #77777d;
      background: transparent;
      border: 0;
      text-decoration: none;
      font: 800 9px Inter,Arial,sans-serif;
      letter-spacing: 1px;
      text-transform: uppercase;
      cursor: pointer;
      transition: color .2s ease, transform .15s ease;
    }
    #fsocialBottomNav .fsbn-item:hover { color:#fff; }
    #fsocialBottomNav .fsbn-item:active { transform:scale(.94); }
    #fsocialBottomNav .fsbn-icon { font-size: 18px; line-height: 1; }
    #fsocialBottomNav .fsbn-item.active { color:#fff; }
    #fsocialBottomNav .fsbn-add {
      width: 46px;
      height: 46px;
      margin: 0 auto;
      border-radius: 50%;
      display:grid;
      place-items:center;
      background:#ff4d00;
      color:#000;
      font: 900 25px Inter,Arial,sans-serif;
      box-shadow:0 0 22px rgba(255,77,0,.28);
    }
    #fsocialBottomNav .fsbn-add:hover { background:#fff; color:#000; }
    body { padding-bottom: 72px; }
    @media (max-width: 650px) {
      #fsocialBottomNav { height: 68px; padding-left: 8px; padding-right: 8px; }
      body { padding-bottom: 68px; }
      #fsocialBottomNav .fsbn-item { font-size:8px; letter-spacing:.8px; }
      #fsocialBottomNav .fsbn-icon { font-size:17px; }
      #fsocialBottomNav .fsbn-add { width:44px; height:44px; }
    }
  `;

  function inject() {
    if (!document.body || document.getElementById("fsocialBottomNav")) return;

    const style = document.createElement("style");
    style.id = "fsocialBottomNavStyle";
    style.textContent = css;
    document.head.appendChild(style);

    const nav = document.createElement("nav");
    nav.id = "fsocialBottomNav";
    nav.setAttribute("aria-label", "Navigazione FSocial");
    nav.innerHTML = `
      <div class="fsbn-inner">
        <a class="fsbn-item active" href="Fsoc​ial.html" data-nav="home" aria-label="Home">
          <span class="fsbn-icon">⌂</span><span>HOME</span>
        </a>
        <button class="fsbn-item" type="button" data-nav="search" aria-label="Cerca">
          <span class="fsbn-icon">⌕</span><span>CERCA</span>
        </button>
        <button class="fsbn-item" type="button" data-nav="create" aria-label="Crea un post">
          <span class="fsbn-add">+</span>
        </button>
        <button class="fsbn-item" type="button" data-nav="notifications" aria-label="Notifiche">
          <span class="fsbn-icon">♟</span><span>NOTIFICHE</span>
        </button>
        <a class="fsbn-item" href="area-personale.html" data-nav="profile" aria-label="Profilo">
          <span class="fsbn-icon">●</span><span>PROFILO</span>
        </a>
      </div>
    `;
    document.body.appendChild(nav);

    const search = nav.querySelector('[data-nav="search"]');
    search.addEventListener("click", () => {
      const input = document.querySelector(".user-search-input");
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior:"smooth", block:"center" });
      }
    });

    const create = nav.querySelector('[data-nav="create"]');
    create.addEventListener("click", () => {
      const input = document.querySelector("textarea, [contenteditable=\"true\"]");
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior:"smooth", block:"center" });
      }
    });

    const notifications = nav.querySelector('[data-nav="notifications"]');
    notifications.addEventListener("click", () => {
      const button = document.querySelector(".notif-btn");
      if (button) button.click();
    });

    if (window.supabase?.auth) {
      window.supabase.auth.getUser().then(({data}) => {
        if (data?.user?.id) {
          const profile = nav.querySelector('[data-nav="profile"]');
          profile.href = `area-personale.html?id=${encodeURIComponent(data.user.id)}`;
        }
      }).catch(() => {});
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject, { once:true });
  } else {
    inject();
  }
})();
