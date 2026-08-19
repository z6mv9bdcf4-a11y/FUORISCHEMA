(() => {
  "use strict";

  const path = window.location.pathname.toLowerCase();
  if (!path.endsWith("/fsocial.html")) return;
  if (window.__FUORISCHEMA_NOTIFICATION_BRIDGE__) return;
  window.__FUORISCHEMA_NOTIFICATION_BRIDGE__ = true;

  // The visual bottom nav is injected separately. Use capture-phase delegation
  // so the notification action remains reliable without touching the feed logic.
  document.addEventListener("click", (event) => {
    const item = event.target?.closest?.('#fsocialBottomNav [data-nav="notifications"]');
    if (!item) return;

    const notificationButton = document.getElementById("notifButton");
    if (!notificationButton) return;

    event.preventDefault();
    event.stopPropagation();
    notificationButton.click();
  }, true);
})();
