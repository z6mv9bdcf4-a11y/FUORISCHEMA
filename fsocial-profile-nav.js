(() => {
  "use strict";

  if (window.__FUORISCHEMA_PROFILE_NAV__) return;
  window.__FUORISCHEMA_PROFILE_NAV__ = true;

  const css = `
    .bottom-nav {
      height: 72px !important;
      padding: 6px 18px calc(6px + env(safe-area-inset-bottom)) !important;
      background: rgba(10,10,12,.94) !important;
      border-top: 1px solid rgba(255,255,255,.08) !important;
      backdrop-filter: blur(22px) !important;
      -webkit-backdrop-filter: blur(22px) !important;
      box-shadow: 0 -12px 35px rgba(0,0,0,.35) !important;
      justify-content: center !important;
      gap: 6px !important;
    }

    .bottom-nav-item {
      height: 100% !important;
      min-width: 0 !important;
      flex: 1 1 0 !important;
      max-width: 152px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 4px !important;
      color: #77777d !important;
      background: transparent !important;
      border: 0 !important;
      text-decoration: none !important;
      font: 800 9px Inter,Arial,sans-serif !important;
      letter-spacing: 1px !important;
      text-transform: uppercase !important;
      transition: color .2s ease, transform .15s ease !important;
    }

    .bottom-nav-item:hover,
    .bottom-nav-item.active {
      color: #fff !important;
    }

    .bottom-nav-item:active {
      transform: scale(.94) !important;
    }

    .bottom-nav-icon {
      font-size: 18px !important;
      line-height: 1 !important;
      font-family: Inter,Arial,sans-serif !important;
      font-weight: 500 !important;
    }

    .bottom-nav-label {
      margin-top: 0 !important;
      font-size: 9px !important;
      font-weight: 800 !important;
      letter-spacing: 1px !important;
    }

    .bottom-nav-item.plus-btn {
      flex: 1 1 0 !important;
      max-width: 152px !important;
    }

    .bottom-nav-item.plus-btn .plus-inner {
      width: 46px !important;
      height: 46px !important;
      border-radius: 50% !important;
      display: grid !important;
      place-items: center !important;
      background: #ff4d00 !important;
      color: #000 !important;
      font: 900 25px Inter,Arial,sans-serif !important;
      box-shadow: 0 0 22px rgba(255,77,0,.28) !important;
      transition: transform .15s ease, background .2s ease !important;
    }

    .bottom-nav-item.plus-btn:hover .plus-inner {
      background: #fff !important;
    }

    .bottom-nav-item.plus-btn:active .plus-inner {
      transform: scale(.94) !important;
    }

    .bottom-nav-badge {
      top: 8px !important;
      right: 28% !important;
    }

    body {
      padding-bottom: 72px !important;
    }

    @media (max-width: 650px) {
      .bottom-nav {
        height: 68px !important;
        padding-left: 8px !important;
        padding-right: 8px !important;
      }

      body {
        padding-bottom: 68px !important;
      }

      .bottom-nav-item {
        font-size: 8px !important;
        letter-spacing: .8px !important;
      }

      .bottom-nav-icon {
        font-size: 17px !important;
      }

      .bottom-nav-label {
        font-size: 8px !important;
        letter-spacing: .8px !important;
      }

      .bottom-nav-item.plus-btn .plus-inner {
        width: 44px !important;
        height: 44px !important;
      }
    }
  `;

  function init() {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;

    const style = document.createElement('style');
    style.id = 'fsocialProfileNavStyle';
    style.textContent = css;
    document.head.appendChild(style);

    const icons = nav.querySelectorAll('.bottom-nav-icon');
    const iconMap = ['⌂', '⌕', null, '♟', '●'];
    icons.forEach((icon, index) => {
      if (iconMap[index] !== null) icon.textContent = iconMap[index];
    });

    const profile = nav.querySelector('#navProfile');
    if (profile) profile.classList.add('active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
