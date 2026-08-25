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
      height:calc(60px + env(safe-area-inset-bottom, 0px)) !important;
      padding-bottom:env(safe-area-inset-bottom, 0px) !important;
      background:rgba(8,8,10,0.95) !important;
      backdrop-filter:blur(20px) !important;
      -webkit-backdrop-filter:blur(20px) !important;
      border-top:1px solid rgba(255,255,255,0.08) !important;
      z-index:100000 !important;
      align-items:center !important;
      justify-content:space-around !important;
      box-shadow:0 -10px 30px rgba(0,0,0,0.5) !important;
    }
    .bottom-nav-item{
      display:flex !important;
      flex-direction:column !important;
      align-items:center !important;
      justify-content:center !important;
      flex:1 !important;
      height:100% !important;
      color:#8e8e93 !important;
      transition:color .2s ease,transform .15s ease !important;
      position:relative !important;
      background:transparent !important;
      border:none !important;
      cursor:pointer !important;
      text-decoration:none !important;
    }
    .bottom-nav-item:active{transform:scale(.88) !important}
    .bottom-nav-item.active,.bottom-nav-item:hover{color:#fff !important}
    .bottom-nav-icon{font-size:20px !important;line-height:1 !important}
    .bottom-nav-label{font-size:9px !important;font-weight:700 !important;letter-spacing:.5px !important;margin-top:3px !important;text-transform:uppercase !important}
    .bottom-nav-item.plus-btn{flex:0 0 48px !important}
    .bottom-nav-item.plus-btn .plus-inner{
      width:42px !important;
      height:42px !important;
      border-radius:50% !important;
      background:#ff4d00 !important;
      color:#000 !important;
      display:grid !important;
      place-items:center !important;
      font-size:22px !important;
      font-weight:900 !important;
      box-shadow:0 0 16px rgba(255,77,0,.25) !important;
      transition:transform .2s ease,background-color .2s ease !important;
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
    @media(max-width:550px){
      .bottom-nav{height:calc(60px + env(safe-area-inset-bottom, 0px)) !important}
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
    if (profileItem) {
      profileItem.classList.add("active");
      const icon = profileItem.querySelector(".bottom-nav-icon");
      if (icon) icon.textContent = "♙";
    }
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
