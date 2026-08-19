const supabase = globalThis.__FUORISCHEMA_SUPABASE__;

(() => {
  "use strict";

  const OWNER_EMAILS = new Set([
    "gennyesposito2000@icloud.com",
    "vincenzo.castaldo11@icloud.com"
  ]);

  async function isOwner() {
    if (!supabase) return false;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.email) return false;
    return OWNER_EMAILS.has(String(data.user.email).toLowerCase());
  }

  async function initAdminUI() {
    if (!supabase) return;
    const path = window.location.pathname.toLowerCase();

    try {
      const owner = await isOwner();

      if (owner) {
        addHamburgerModerationLink();
        if (!document.querySelector(".side-menu")) {
          const observer = new MutationObserver(() => {
            addHamburgerModer