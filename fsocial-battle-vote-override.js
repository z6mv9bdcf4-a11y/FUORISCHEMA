(() => {
  "use strict";
  if (window.__FS_BATTLE_VOTE_OVERRIDE__) return;
  window.__FS_BATTLE_VOTE_OVERRIDE__ = true;

  const URL_BASE = "https://dbjfvphcrfvajrtkeswg.supabase.co/functions/v1/fsocial-battles";

  const style = document.createElement("style");
  style.textContent = `
    .fs-battle-hub-player,
    .fs-battle-hub-player img {
      pointer-events: auto !important;
      touch-action: manipulation !important;
    }
    .fs-battle-hub-vote.fs-vote-locked {
      opacity: .38 !important;
      filter: saturate(.45) !important;
      cursor: not-allowed !important;
    }
    .fs-battle-hub-vote.fs-vote-ready {
      opacity: 1 !important;
      filter: none !important;
      background: rgba(255,77,0,.18) !important;
      border-color: #ff4d00 !important;
    }
  `;
  document.head.appendChild(style);

  function token() {
    let t = localStorage.getItem("fsocial_battle_voter_token");
    if (!t) {
      const a = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
      const b = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
      t = `${a}${b}`.replaceAll("-", "");
      localStorage.setItem("fsocial_battle_voter_token", t);
    }
    return t;
  }

  function selectedSide(card) {
    const players = [...card.querySelectorAll(".fs-battle-hub-player")];
    const index = players.findIndex(x => x.classList.contains("fs-surgical-selected"));
    return index >= 0 ? index : null;
  }

  function selectedUserId(card, side) {
    const player = card.querySelectorAll(".fs-battle-hub-player")[side];
    if (!player) return "";

    const direct = player.dataset.userId || player.dataset.userid || player.getAttribute("data-user-id") || "";
    if (direct) return String(direct);

    const link = player.closest("a") || player.querySelector("a") || card.querySelectorAll("a")[side];
    const href = link?.getAttribute("href") || "";
    try {
      const id = new URL(href, location.href).searchParams.get("id");
      if (id) return id;
    } catch {}
    return "";
  }

  function selectPlayer(player) {
    const card = player?.closest?.(".fs-battle-hub-card");
    if (!card) return false;

    const players = [...card.querySelectorAll(".fs-battle-hub-player")];
    const alreadySelected = player.classList.contains("fs-surgical-selected");

    players.forEach(x => {
      x.classList.remove("fs-surgical-selected");
    });

    const button = card.querySelector(".fs-battle-hub-vote");

    // Tocca nuovamente l'outfit selezionato = annulla la selezione.
    if (alreadySelected) {
      if (button) {
        button.disabled = true;
        button.classList.remove("fs-vote-ready");
        button.classList.add("fs-vote-locked");
        button.textContent = "TOCCA UN OUTFIT PER VOTARE →";
      }
      return true;
    }

    player.classList.add("fs-surgical-selected");

    if (button) {
      button.disabled = false;
      button.classList.add("fs-vote-ready");
      button.classList.remove("fs-vote-locked");
      button.textContent = "VOTA";
    }

    return true;
  }

  function sync() {
    document.querySelectorAll(".fs-battle-hub-card").forEach(card => {
      const button = card.querySelector(".fs-battle-hub-vote");
      const selected = selectedSide(card) !== null;

      if (!button) return;

      button.disabled = !selected;
      button.classList.toggle("fs-vote-ready", selected);
      button.classList.toggle("fs-vote-locked", !selected);
    });
  }

  async function vote(card, side) {
    const response = await fetch(`${URL_BASE}?action=active&limit=24`, {
      headers: { Accept: "application/json" },
      credentials: "omit"
    });

    const data = await response.json();
    const battles = Array.isArray(data?.battles) ? data.battles : [];
    const cards = [...document.querySelectorAll(".fs-battle-hub-card")];

    const selectedId = selectedUserId(card, side);
    let item = selectedId
      ? battles.find(x => String(side === 0 ? x?.battle?.challenger_id : x?.battle?.challenged_id) === String(selectedId))
      : null;

    if (!item) item = battles[cards.indexOf(card)];
    if (!item?.battle) throw new Error("Battle non disponibile o non sincronizzata.");

    const userId = side === 0 ? item.battle.challenger_id : item.battle.challenged_id;

    const res = await fetch(`${URL_BASE}?action=vote`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        battle_id: Number(item.battle.id),
        voted_for_user_id: userId,
        voter_token: token()
      })
    });

    const result = await res.json();
    if (!res.ok || !result?.success) {
      throw new Error(result?.message || "Voto non registrato.");
    }

    window.showToast?.("Voto registrato.");

    card.querySelectorAll(".fs-battle-hub-player").forEach(x => {
      x.classList.remove("fs-surgical-selected", "fs-surgical-vote-card");
    });

    const button = card.querySelector(".fs-battle-hub-vote");
    if (button) {
      button.disabled = true;
      button.textContent = "VOTO REGISTRATO";
    }

    setTimeout(() => location.reload(), 500);
  }

  function init() {
    if (!location.pathname.toLowerCase().endsWith("/fsocial.html")) return;
    // La selezione avviene solo sul tap/click completato.
    // Uno swipe sopra una card non deve selezionarla.

    // Click: blocca solo l'eventuale navigazione del player, non l'intera card.
    document.addEventListener("click", event => {
      const player = event.target?.closest?.(".fs-battle-hub-player");
      if (player) {
        if (selectPlayer(player)) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      const button = event.target?.closest?.(".fs-battle-hub-vote");
      if (!button) return;

      const card = button.closest(".fs-battle-hub-card");
      if (!card) return;

      const side = selectedSide(card);
      if (side === null) {
        event.preventDefault();
        event.stopPropagation();
        window.showToast?.("Seleziona prima un outfit.");
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      button.disabled = true;
      button.textContent = "VOTO IN CORSO...";

      vote(card, side).catch(err => {
        console.error("Battle vote:", err);
        button.disabled = false;
        button.textContent = "VOTA";
        window.showToast?.(err?.message || "Voto non registrato.");
      });
    }, true);

    sync();
    new MutationObserver(sync).observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
