(() => {
  "use strict";
  if (window.__FUORISCHEMA_BOTTOM_NAV_FIX__) return;
  window.__FUORISCHEMA_BOTTOM_NAV_FIX__ = true;

  const path = window.location.pathname.toLowerCase();
  const isHome = path.endsWith("/fsocial.html");
  const isProfile = path.endsWith("/area-personale.html");
  if (!isHome && !isProfile) return;

  /* FSocial Home already owns the native bottom nav and its real notification handler. */
  if (isHome && document.querySelector(".bottom-nav")) return;

  const icon = (name) => {
    const paths = {
      home: '<path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>',
      search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 5 5"/>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
      user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ""}</g></svg>`;
  };

  function inject() {
    if (!document.body) return;
    if (isHome && document.querySelector(".bottom-nav")) return;

    document.querySelectorAll(".bottom-nav,#fsocialBottomNav").forEach(el => el.remove());

    const nav = document.createElement("nav");
    nav.id = "fsocialBottomNav";
    nav.setAttribute("aria-label", "Navigazione FSocial");
    nav.innerHTML = `
      <div class="fsbn-inner">
        <a class="fsbn-item ${isHome ? "active" : ""}" href="Fsocial.html" data-nav="home" aria-label="Home"><span class="fsbn-icon">${icon("home")}</span><span>HOME</span></a>
        <button class="fsbn-item" type="button" data-nav="search" aria-label="Cerca"><span class="fsbn-icon">${icon("search")}</span><span>CERCA</span></button>
        <button class="fsbn-item" type="button" data-nav="create" aria-label="Crea un post"><span class="fsbn-add">+</span></button>
        <button class="fsbn-item" type="button" data-nav="notifications" aria-label="Notifiche"><span class="fsbn-icon">${icon("bell")}</span><span>NOTIFICHE</span></button>
        <a class="fsbn-item ${isProfile ? "active" : ""}" href="area-personale.html" data-nav="profile" aria-label="Profilo"><span class="fsbn-icon">${icon("user")}</span><span>PROFILO</span></a>
      </div>`;

    const style = document.createElement("style");
    style.id = "fsocialBottomNavFixStyle";
    style.textContent = `#fsocialBottomNav{position:fixed!important;left:0!important;right:0!important;bottom:0!important;z-index:2147483000!important;width:100%!important;height:70px!important;padding:5px 10px calc(5px + env(safe-area-inset-bottom))!important;background:rgba(8,8,10,.82)!important;border-top:1px solid rgba(255,255,255,.12)!important;box-shadow:0 -10px 30px rgba(0,0,0,.24)!important;backdrop-filter:blur(24px)!important;-webkit-backdrop-filter:blur(24px)!important}#fsocialBottomNav .fsbn-inner{width:min(600px,100%)!important;height:100%!important;margin:0 auto!important;display:flex!important;align-items:center!important;justify-content:space-between!important}#fsocialBottomNav .fsbn-item{height:100%!important;min-width:0!important;flex:1 1 0!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;color:#85858c!important;background:transparent!important;border:0!important;font:800 8px Inter,Arial,sans-serif!important;letter-spacing:.8px!important;text-transform:uppercase!important;text-decoration:none!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}#fsocialBottomNav .fsbn-item.active{color:#fff!important}#fsocialBottomNav .fsbn-item:active{transform:scale(.96)!important}#fsocialBottomNav .fsbn-icon{width:21px!important;height:21px!important;display:flex!important;align-items:center!important;justify-content:center!important}#fsocialBottomNav .fsbn-icon svg{width:18px!important;height:18px!important;display:block!important}#fsocialBottomNav .fsbn-add{width:44px!important;height:44px!important;border-radius:50%!important;display:grid!important;place-items:center!important;background:#ff4d00!important;color:#000!important;font:900 23px/1 Inter,Arial,sans-serif!important;box-shadow:0 0 14px rgba(255,77,0,.16)!important}@media(max-width:650px){#fsocialBottomNav{height:68px!important;padding-left:6px!important;padding-right:6px!important}}`;
    document.head.appendChild(style);
    document.body.appendChild(nav);

    nav.querySelector('[data-nav="search"]')?.addEventListener("click", () => {
      if (!isHome) return void (window.location.href = "Fsocial.html#search");
      const input = document.querySelector(".user-search-input");
      input?.focus({ preventScroll: true });
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    nav.querySelector('[data-nav="create"]')?.addEventListener("click", () => {
      if (!isHome) return void (window.location.href = "Fsocial.html#compose");
      const input = document.querySelector(".create-card textarea, textarea, [contenteditable=\"true\"]");
      input?.focus({ preventScroll: true });
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    nav.querySelector('[data-nav="notifications"]')?.addEventListener("click", () => {
      const button = document.getElementById("navNotif");
      if (button) button.click();
      else if (!isHome) window.location.href = "Fsocial.html#notifications";
    });
  }

  const boot = () => setTimeout(inject, 0);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
