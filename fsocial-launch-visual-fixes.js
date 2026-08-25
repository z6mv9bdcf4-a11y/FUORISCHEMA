(() => {
  "use strict";
  const path = window.location.pathname.toLowerCase();
  const isHome = path.endsWith("/fsocial.html");
  const isProfile = path.endsWith("/area-personale.html");
  if (!isHome && !isProfile) return;

  const style = document.createElement("style");
  style.id = "fsocialLaunchVisualFixes";
  style.textContent = `
    /* BATTLES: visual-only title treatment. */
    .fs-battle-hub-heading h2 {
      color: #fff !important;
      font-family: Syne, Inter, Arial, sans-serif !important;
      font-size: clamp(24px, 6vw, 34px) !important;
      line-height: 1 !important;
      font-weight: 900 !important;
      letter-spacing: -1px !important;
      text-transform: uppercase !important;
      text-shadow: 0 2px 18px rgba(0,0,0,.45) !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    .fs-battle-hub-heading h2::after {
      content: "";
      display: block;
      width: 34px;
      height: 3px;
      margin-top: 8px;
      border-radius: 99px;
      background: #ff4d00;
    }

    /* PROFILE: identity/stat text must remain readable on the actual profile background. */
    .profile-name,
    .stat-value,
    .posts-count {
      font-weight: 900 !important;
      opacity: 1 !important;
    }
    .stat-label {
      font-weight: 800 !important;
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);

  function colorForBackground(el) {
    const bg = getComputedStyle(el || document.body).backgroundColor || "";
    const m = bg.match(/rgba?\(([^)]+)\)/i);
    if (!m) return "#171717";
    const parts = m[1].split(",").map(v => Number.parseFloat(v.trim()));
    if (parts.length < 3 || parts.some(Number.isNaN)) return "#171717";
    const [r,g,b] = parts;
    const luminance = (0.2126*r + 0.7152*g + 0.0722*b) / 255;
    return luminance > 0.58 ? "#171717" : "#fff";
  }

  function syncProfileTextContrast() {
    if (!isProfile) return;
    /* The profile currently uses a light hero/background, so never leave the name white. */
    document.querySelectorAll(".profile-name").forEach(el => {
      el.style.setProperty("color", "#171717", "important");
    });

    const sample = document.querySelector(".profile-container") || document.body;
    const color = colorForBackground(sample);
    document.querySelectorAll(".stat-value,.posts-count").forEach(el => {
      el.style.setProperty("color", color, "important");
    });
    document.querySelectorAll(".stat-label").forEach(el => {
      el.style.setProperty("color", color === "#171717" ? "#666" : "#8e8e93", "important");
    });
  }

  function routeRanking(event) {
    if (!isProfile) return;
    const button = event.target?.closest?.("#fsProfileRanking");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    window.location.href = "fsocial-ranking.html";
  }

  document.addEventListener("click", routeRanking, true);
  syncProfileTextContrast();

  if (isProfile) {
    const observer = new MutationObserver(() => syncProfileTextContrast());
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 30000);
  }
})();
