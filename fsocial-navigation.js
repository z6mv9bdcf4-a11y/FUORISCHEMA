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

  function openSearch() {
    const path = window.location.pathname.toLowerCase();
    const isHome = path.endsWith(`/${HOME_PATH}`);
    const isProfile = path.endsWith(`/${PROFILE_PATH}`);

    if (isHome) {
      const input = document.querySelector(".user-search-input");
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        return true;
      }
      return false;
    }

    if (isProfile) {
      window.location.href = `${HOME_PATH}?action=search`;
      return true;
    }

    return false;
  }

  function bindSearch() {
    const nav = getNav();
    const search = nav?.querySelector("#navSearch");
    if (!search || search.dataset.navigationSearchBound === "1") return;

    search.dataset.navigationSearchBound = "1";
    search.addEventListener("click", (event) => {
      event.preventDefault();
      openSearch();
    });
  }

  function openCreate() {
    const path = window.location.pathname.toLowerCase();
    const isHome = path.endsWith(`/${HOME_PATH}`);
    const isProfile = path.endsWith(`/${PROFILE_PATH}`);

    if (isHome) {
      const composer = document.querySelector(
        "#createPostInput, textarea[placeholder*='Cosa stai pensando'], textarea[placeholder*='cosa stai pensando']"
      );

      if (composer) {
        composer.focus();
        composer.scrollIntoView({ behavior: "smooth", block: "center" });
        return true;
      }

      return false;
    }

    if (isProfile) {
      window.location.href = `${HOME_PATH}?action=compose`;
      return true;
    }

    return false;
  }

  function bindCreate() {
    const nav = getNav();
    const create = nav?.querySelector("#navCreate");

    if (!create || create.dataset.navigationCreateBound === "1") return;

    create.dataset.navigationCreateBound = "1";

    create.addEventListener("click", (event) => {
      event.preventDefault();
      openCreate();
    });
  }

  function init() {
    if (!getNav()) return;
    setActive();
    bindSearch();
    bindCreate();
  }

  window.FsocialNavigation = Object.freeze({
    init,
    setActive,
    setNotificationBadge,
    openSearch,
    openCreate
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
