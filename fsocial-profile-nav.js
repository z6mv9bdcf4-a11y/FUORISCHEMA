(() => {
  "use strict";

  if (window.__FUORISCHEMA_PROFILE_NAV__) return;
  window.__FUORISCHEMA_PROFILE_NAV__ = true;

  const icon = (name) => {
    const paths = {
      home: '<path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>',
      search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 5 5"/>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
      user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ""}</g></svg>`;
  };

  const css = `
    /* =========================================================
       FSOCIAL PROFILE — SHARED CLEAN VISUAL SYSTEM
       VISUAL ONLY: no profile, auth or navigation logic changes.
    ========================================================= */
    body{background:radial-gradient(circle at 15% 10%,rgba(255,78,0,.14),transparent 32%),radial-gradient(circle at 85% 85%,rgba(255,120,40,.10),transparent 35%),linear-gradient(135deg,#ffffff 0%,#fffaf7 48%,#fff0e8 100%)!important;color:#f5f5f5!important}
    header{background:rgba(5,5,5,.94)!important;border-bottom-color:rgba(255,255,255,.055)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important}
    .profile-container{padding-top:28px!important;padding-bottom:88px!important}
    .profile-header{border-bottom-color:rgba(255,255,255,.055)!important}
    .avatar{box-shadow:none!important;border-color:rgba(255,255,255,.10)!important}
    .action-btn{border-color:rgba(255,255,255,.09)!important;box-shadow:none!important}
    .action-btn.orange{box-shadow:none!important}
    .posts-section{padding-top:24px!important}
    .post-tile{border-color:rgba(255,255,255,.055)!important;box-shadow:none!important}
    .post-tile:hover{border-color:rgba(255,255,255,.10)!important}

    /* Same navigation grammar as Home. */
    .bottom-nav{
      position:fixed!important;left:0!important;right:0!important;bottom:0!important;z-index:99990!important;
      height:calc(60px + env(safe-area-inset-bottom,0px))!important;padding:0 8px env(safe-area-inset-bottom,0px)!important;
      background:rgba(8,8,10,.55)!important;border-top:1px solid rgba(255,255,255,.12)!important;
      backdrop-filter:blur(24px) saturate(145%)!important;-webkit-backdrop-filter:blur(24px) saturate(145%)!important;
      box-shadow:0 -10px 30px rgba(0,0,0,.5)!important;justify-content:space-around!important;align-items:center!important;
    }
    .bottom-nav-item{
      height:100%!important;min-width:0!important;flex:1 1 0!important;
      color:#77777d!important;font:700 9px Inter,Arial,sans-serif!important;letter-spacing:.85px!important;gap:4px!important;
      transition:color .18s ease,transform .15s ease!important;
    }
    .bottom-nav-item:hover,.bottom-nav-item.active{color:#fff!important}
    .bottom-nav-item:active{transform:scale(.96)!important}
    .bottom-nav-icon{width:20px!important;height:20px!important;display:flex!important;align-items:center!important;justify-content:center!important;font-family:Inter,Arial,sans-serif!important}
    .bottom-nav-icon svg{width:18px;height:18px;display:block}
    .bottom-nav-label{margin-top:0!important;font-size:9px!important;letter-spacing:.85px!important}
    .bottom-nav-item.plus-btn .plus-inner{box-shadow:0 0 12px rgba(255,77,0,.14)!important;width:44px!important;height:44px!important}
    .bottom-nav-badge{top:8px!important;right:28%!important}

    @media(max-width:650px){
      .profile-container{padding-top:20px!important;padding-bottom:84px!important}
      .posts-section{padding-top:20px!important}
      .bottom-nav{height:68px!important;padding-left:8px!important;padding-right:8px!important}
      .bottom-nav-item{font-size:8px!important;letter-spacing:.75px!important}
      .bottom-nav-icon{width:19px!important;height:19px!important}
      .bottom-nav-icon svg{width:17px;height:17px}
      .bottom-nav-label{font-size:8px!important;letter-spacing:.75px!important}
      .bottom-nav-item.plus-btn .plus-inner{width:44px!important;height:44px!important}
    }
  `;

  function init() {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;

    if (!document.getElementById('fsocialProfileNavStyle')) {
      const style = document.createElement('style');
      style.id = 'fsocialProfileNavStyle';
      style.textContent = css;
      document.head.appendChild(style);
    }

    const profile = nav.querySelector('#navProfile');
    if (profile) profile.classList.add('active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
