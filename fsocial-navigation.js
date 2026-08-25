(() => {
  "use strict";

  if (window.__FUORISCHEMA_NAVIGATION__) return;
  window.__FUORISCHEMA_NAVIGATION__ = true;

  const HOME_PATH = "fsocial.html";
  const PROFILE_PATH = "area-personale.html";

  function getNav() {
    return document.querySelector(".bottom-nav");
  }

  function getCurrentPage() {
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith(`/${PROFILE_PATH}`)) return "profile";
    if (path.endsWith(`/${HOME_PATH}`)) return "home";
    return null;
  }

  function setActive(page = getCurrentPage()) {
    const nav = getNav();
    if (!nav || !page) return;

    const home = nav.querySelector("#navHome");
    const profile = nav.querySelector("#navProfile");

    home?.classList.toggle("active", page === "home");
    profile?.classList.toggle("active", page === "profile");
  }

  function setNotificationBadge(value) {
    const nav = getNav();
    if (!nav) return;

    const badge = nav.querySelector("#bottomNavBadge, .bottom-nav-badge");
    if (!badge) return;

    const count = Number(value) || 0;
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.classList.toggle("active", count > 0);
  }

  function init() {
    if (!getNav()) return;
    setActive();
  }

  window.FsocialNavigation = Object.freeze({
    init,
    setActive,
    setNotificationBadge
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
