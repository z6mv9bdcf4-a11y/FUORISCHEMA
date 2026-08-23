const supabase = globalThis.__FUORISCHEMA_SUPABASE__;

(() => {
  "use strict";

  async function isOwner() {
    if (!supabase) return false;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return false;
    return data.user.app_metadata?.role === "admin";
  }

  function showOwnerToast(message, isError = false) {
    let toast = document.getElementById("fsOwnerToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "fsOwnerToast";
      toast.style.cssText = `position:fixed;left:50%;bottom:28px;transform:translate(-50%,12px);z-index:1000000;opacity:0;pointer-events:none;padding:11px 16px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(12,12,14,.94);color:#fff;font:800 10px Inter,Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;box-shadow:0 14px 40px rgba(0,0,0,.55);transition:opacity .22s ease,transform .22s ease;`;
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.color = isError ? "#ff6258" : "#fff";
    toast.style.borderColor = isError ? "rgba(255,59,48,.35)" : "rgba(255,77,0,.35)";
    toast.style.opacity = "1";
    toast.style.transform = "translate(-50%,0)";
    clearTimeout(window.__fsOwnerToastTimer);
    window.__fsOwnerToastTimer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translate(-50%,12px)";
    }, 2400);
  }

  function removeModerationPostPanel() {
    document.getElementById("fsocialPostManagement")?.remove();
  }

  function cleanModerationPage() {
    removeModerationPostPanel();
    const observer = new MutationObserver(() => removeModerationPostPanel());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
  }

  function getPostId(article) {
    const commentBox = article.querySelector('[id^="comments-"]');
    const match = commentBox?.id?.match(/^comments-(\d+)$/);
    if (match) return Number(match[1]);
    return Number(article.querySelector("[data-post-id]")?.dataset.postId || article.dataset.postId || 0);
  }

  function addOwnerDeleteButton(article) {
    if (!article || article.querySelector("[data-owner-delete-post]")) return;

    const postId = getPostId(article);
    if (!postId) return;

    const actions = article.querySelector(".post-actions");
    if (!actions) return;

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.ownerDeletePost = String(postId);
    button.className = "action-button owner-delete-button";
    button.textContent = "RIMUOVI POST";
    button.title = "Rimuovi questo post come owner";
    button.style.cssText = `margin-left:auto;padding:6px 10px;border:1px solid rgba(255,59,48,.32);border-radius:7px;color:#ff6258;background:rgba(255,59,48,.035);font:900 9px Inter,Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;`;

    button.addEventListener("mouseenter", () => {
      button.style.background = "rgba(255,59,48,.10)";
      button.style.borderColor = "rgba(255,59,48,.55)";
    });
    button.addEventListener("mouseleave", () => {
      button.style.background = "rgba(255,59,48,.035)";
      button.style.borderColor = "rgba(255,59,48,.32)";
    });

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const confirmed = await window.FSNotifications.confirm(
        "RIMUOVERE POST?",
        "Questa azione eliminerà il contenuto per tutti.",
        "RIMUOVI POST"
      );
      if (!confirmed) return;

      button.disabled = true;
      button.textContent = "RIMOZIONE...";

      try {
        const { data, error } = await supabase.rpc("admin_delete_post", { target_post_id: postId });
        if (error || Number(data || 0) !== 1) {
          throw new Error(error?.message || "Post non trovato o rimozione non autorizzata.");
        }
        article.remove();
        showOwnerToast(`POST #${postId} RIMOSSO`);
      } catch (error) {
        console.error("FSocial owner delete failed:", error);
        button.disabled = false;
        button.textContent = "RIMUOVI POST";
        showOwnerToast(error?.message || "Errore durante la rimozione.", true);
      }
    });

    actions.appendChild(button);
  }

  function addOwnerToolsToFeed() {
    const feed = document.getElementById("feed");
    if (!feed) return;

    const scan = () => feed.querySelectorAll(".post-card").forEach(addOwnerDeleteButton);
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(feed, { childList: true, subtree: true });
    window.addEventListener("beforeunload", () => observer.disconnect(), { once: true });
  }

  async function init() {
    if (!supabase) return;
    const path = window.location.pathname.toLowerCase();
    const owner = await isOwner();

    if (path.endsWith("/fsocial-moderazione.html")) {
      if (owner) cleanModerationPage();
      return;
    }

    if (!path.endsWith("/fsocial.html") || !owner) return;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", addOwnerToolsToFeed, { once: true });
    } else {
      addOwnerToolsToFeed();
    }
  }

  init().catch(error => console.error("FSocial owner tools failed:", error));
})();
