(() => {
  "use strict";
  if (window.__FUORISCHEMA_BOTTOM_NAV_FIX__) return;
  window.__FUORISCHEMA_BOTTOM_NAV_FIX__ = true;

  const path = window.location.pathname.toLowerCase();
  const isHome = path.endsWith("/fsocial.html");
  const isProfile = path.endsWith("/area-personale.html");
  if (!isHome && !isProfile) return;

  const homeNavCss = `
    .bottom-nav{
      display:flex !important;
      position:fixed !important;
      left:0 !important;
      right:0 !important;
      bottom:0 !important;
      height:70px !important;
      padding:5px 18px calc(5px + env(safe-area-inset-bottom)) !important;
      background:rgba(8,8,10,.58) !important;
      border-top:1px solid rgba(255,255,255,.14) !important;
      box-shadow:0 -10px 30px rgba(0,0,0,.20),inset 0 1px 0 rgba(255,255,255,.10) !important;
      backdrop-filter:blur(30px) saturate(160%) !important;
      -webkit-backdrop-filter:blur(30px) saturate(160%) !important;
      z-index:99990 !important;
      align-items:center !important;
      justify-content:space-between !important;
      gap:2px !important;
    }
    .bottom-nav-item{
      height:100% !important;
      min-width:0 !important;
      flex:1 1 0 !important;
      display:flex !important;
      flex-direction:column !important;
      align-items:center !important;
      justify-content:center !important;
      gap:4px !important;
      color:#9a9aa0 !important;
      background:transparent !important;
      border:0 !important;
      font:700 9px Inter,Arial,sans-serif !important;
      letter-spacing:.85px !important;
      text-transform:uppercase !important;
      text-decoration:none !important;
      transition:color .18s ease,transform .15s ease !important;
      position:relative !important;
      cursor:pointer !important;
    }
    .bottom-nav-item:hover,.bottom-nav-item.active{color:#fff !important}
    .bottom-nav-item:active{transform:scale(.96) !important}
    .bottom-nav-icon{
      width:20px !important;
      height:20px !important;
      display:flex !important;
      align-items:center !important;
      justify-content:center !important;
      font-size:0 !important;
      line-height:1 !important;
    }
    .bottom-nav-icon svg{width:18px !important;height:18px !important;display:block !important}
    .bottom-nav-label{font-size:9px !important;font-weight:700 !important;letter-spacing:.85px !important;margin-top:0 !important;text-transform:uppercase !important}
    .bottom-nav-item.plus-btn{flex:1 1 0 !important}
    .bottom-nav-item.plus-btn .plus-inner{
      width:44px !important;
      height:44px !important;
      border-radius:50% !important;
      display:grid !important;
      place-items:center !important;
      background:#ff4d00 !important;
      color:#000 !important;
      font:900 21px/1 Inter,Arial,sans-serif !important;
      box-shadow:0 0 12px rgba(255,77,0,.14) !important;
      transition:transform .18s ease,background-color .18s ease !important;
    }
    .bottom-nav-item.plus-btn:active .plus-inner{transform:scale(.92) !important;background:#fff !important}
    .bottom-nav-badge{
      position:absolute !important;
      top:8px !important;
      right:22% !important;
      background:#ff4d00 !important;
      color:#000 !important;
      font-size:9px !important;
      font-weight:900 !important;
      min-width:14px !important;
      height:14px !important;
      border-radius:100px !important;
      display:none !important;
      align-items:center !important;
      justify-content:center !important;
      padding:0 3px !important;
      border:2px solid #050505 !important;
    }
    .bottom-nav-badge.active{display:inline-flex !important}
    @media(max-width:650px){
      .bottom-nav{
        height:68px !important;
        padding-left:8px !important;
        padding-right:8px !important;
      }
      .bottom-nav-item{font-size:8px !important;letter-spacing:.75px !important}
      .bottom-nav-icon{width:19px !important;height:19px !important}
      .bottom-nav-icon svg{width:17px !important;height:17px !important}
      .bottom-nav-label{font-size:8px !important;letter-spacing:.75px !important}
      .bottom-nav-item.plus-btn .plus-inner{width:44px !important;height:44px !important}
    }
  `;

  function normalizeProfileNav() {
    if (!isProfile) return;
    const nav = document.querySelector(".bottom-nav");
    if (!nav) return;

    let style = document.getElementById("fsocialProfileBottomNavStyle");
    if (!style) {
      style = document.createElement("style");
      style.id = "fsocialProfileBottomNavStyle";
      document.head.appendChild(style);
    }
    style.textContent = homeNavCss;

    const profileItem = nav.querySelector("#navProfile");
    if (profileItem) profileItem.classList.add("active");
  }

  function inject() {
    if (!document.body) return;

    const nativeNav = document.querySelector(".bottom-nav");
    if (nativeNav) {
      normalizeProfileNav();
      return;
    }

    if (isHome) return;

    const nav = document.createElement("nav");
    nav.className = "bottom-nav";
    nav.setAttribute("aria-label", "Navigazione FSocial");
    nav.innerHTML = `
      <a class="bottom-nav-item" href="Fsocial.html" aria-label="Home"><span class="bottom-nav-icon">⌂</span><span class="bottom-nav-label">Home</span></a>
      <a class="bottom-nav-item" href="Fsocial.html#search" aria-label="Cerca"><span class="bottom-nav-icon">⌕</span><span class="bottom-nav-label">Cerca</span></a>
      <a class="bottom-nav-item plus-btn" href="Fsocial.html#compose" aria-label="Crea Post"><div class="plus-inner">+</div></a>
      <a class="bottom-nav-item" href="Fsocial.html#notifications" aria-label="Notifiche"><span class="bottom-nav-icon">♧</span><span class="bottom-nav-label">Notifiche</span></a>
      <a class="bottom-nav-item active" href="area-personale.html" aria-label="Profilo"><span class="bottom-nav-icon">♙</span><span class="bottom-nav-label">Profilo</span></a>`;
    document.body.appendChild(nav);
    normalizeProfileNav();
  }

  const boot = () => setTimeout(inject, 0);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
