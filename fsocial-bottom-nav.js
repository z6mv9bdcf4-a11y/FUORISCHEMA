(() => {
  "use strict";

  if (window.__FUORISCHEMA_BOTTOM_NAV__) return;
  window.__FUORISCHEMA_BOTTOM_NAV__ = true;

  const path = window.location.pathname.toLowerCase();
  const isProfilePage = path.endsWith("/area-personale.html");

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

    /* Same visual language on the existing profile nav, without replacing its links. */
    .bottom-nav {
      height: 72px !important;
      padding: 6px 18px calc(6px + env(safe-area-inset-bottom)) !important;
      background: rgba(10,10,12,.94) !important;
      backdrop-filter: blur(22px) !important;
      -webkit-backdrop-filter: blur(22px) !important;
      border-top: 1px solid rgba(255,255,255,.08) !important;
      box-shadow: 0 -12px 35px rgba(0,0,0,.35) !important;
      justify-content: center !important;
      gap: 6px !important;
    }
    .bottom-nav-item {
      height: 100% !important;
      min-width: 0;
      flex: 1 !important;
      max-width: 152px;
      display:flex !important;
      flex-direction:column !important;
      align-items:center !important;
      justify-content:center !important;
      gap:4px !important;
      color:#77777d !important;
      background:transparent !important;
      border:0 !important;
      font:800 9px Inter,Arial,sans-serif !important;
      letter-spacing:1px !important;
      text-transform:uppercase !important;
      transition:color .2s ease,transform .15s ease !important;
    }
    .bottom-nav-item:hover,
    .bottom-nav-item.active { color:#fff !important; }
    .bottom-nav-item:active { transform:scale(.94) !important; }
    .bottom-nav-icon { font-size:18px !important; line-height:1 !important; }
    .bottom-nav-label { margin-top:0 !important; font-size:9px !important; letter-spacing:1px !important; }
    .bottom-nav-item.plus-btn { flex:1 !important; max-width:152px; }
    .bottom-nav-item.plus-btn .plus-inner {
      width:46px !important;
      height:46px !important;
      border-radius:50% !important;
      display:grid !important;
      place-items:center !important;
      background:#ff4d00 !important;
      color:#000 !important;
      font:900 25px Inter,Arial,sans-serif !important;
      box-shadow:0 0 22px rgba(255,77,0,.28) !important;
    }
    .bottom-nav-item.plus-btn:active .plus-inner { transform:scale(.94); background:#fff; }
    .bottom-nav-badge { top:8px !important; right:28% !important; }

    body { padding-bottom:72px !important; }
    @media (max-width:650px) {
      #fsocialBottomNav { height:68px; padding-left:8px; padding-right:8px; }
      .bottom-nav { height:68px !important; padding-left:8px !important; padding-right:8px !important; }
      body { padding-bottom:68px !important; }
      #fsocialBottomNav .fsbn-item,
      .bottom-nav-item { font-size:8px !important; letter-spacing:.8px !important; }
      #fsocialBottomNav .fsbn-icon,
      .bottom-nav-icon { font-size:17px !important; }
      #fsocialBottomNav .fsbn-add,
      .bottom-nav-item.plus-btn .plus-inner { width:44px !important; height:44px !important; }
    }
  `;

  function injectStyle() {
    if (document.getElementById("fsocialBottomNavStyle")) return;
    const style = document.createElement("style");
    style.id = "fsocialBottomNavStyle";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function styleExistingProfileNav() {
    const nav = document.querySelector(".bottom-nav");
    if (!nav) return false;

    const icons = nav.querySelectorAll(".bottom-nav-icon");
    const replacements = ["⌂", "⌕", null, "♟", "●"];
    icons.forEach((icon, index) => {
      if (replacements[index]) icon.textContent = replacements[index];
    });

    const active = nav.querySelector("#navProfile");
    if (active) active.classList.add("active");
    return true;
  }

  function injectHomeNav() {
    if (!document.body || document.getElementById("fsocialBottomNav")) return;

    const nav = document.createElement("nav");
    nav.id = "fsocialBottomNav";
    nav.setAttribute("aria-label", "Navigazione FSocial");
    nav.innerHTML = `
      <div class="fsbn-inner">
        <a class="fsbn-item active" href="Fsocial.html" data-nav="home" aria-label="Home">
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

    nav.querySelector('[data-nav="search"]').addEventListener("click", () => {
      const input = document.querySelector(".user-search-input");
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior:"smooth", block:"center" });
      }
    });

    nav.querySelector('[data-nav="create"]').addEventListener("click", () => {
      const input = document.querySelector("textarea, [contenteditable=\"true\"]");
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior:"smooth", block:"center" });
      }
    });

    nav.querySelector('[data-nav="notifications"]').addEventListener("click", () => {
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

  function init() {
    injectStyle();
    if (isProfilePage) {
      styleExistingProfileNav();
      return;
    }
    injectHomeNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once:true });
  } else {
    init();
  }
})();
