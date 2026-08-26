import { supabase } from "./supabase.js";

(() => {
  "use strict";
  if (window.__FSOCIAL_SURGICAL_OVERRIDES__) return;
  window.__FSOCIAL_SURGICAL_OVERRIDES__ = true;

  const BATTLE_URL = "https://dbjfvphcrfvajrtkeswg.supabase.co/functions/v1/fsocial-battles";
  const escape = value => { const d = document.createElement("div"); d.textContent = value ?? ""; return d.innerHTML; };
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function addStyle() {
    if (document.getElementById("fsocialSurgicalOverridesStyle")) return;
    const style = document.createElement("style");
    style.id = "fsocialSurgicalOverridesStyle";
    style.textContent = `
      .fs-surgical-selected{outline:2px solid #ff4d00!important;outline-offset:2px;box-shadow:0 0 28px rgba(255,77,0,.18)!important;transform:translateY(-2px)}
      .fs-surgical-vote-card{cursor:pointer!important;transition:transform .18s ease,box-shadow .18s ease,filter .18s ease!important}
      .fs-surgical-vote-card:active{transform:scale(.985)!important}
      .fs-surgical-vote-button{width:100%;min-height:46px;margin-top:12px;border:1px solid rgba(255,77,0,.45);border-radius:14px;background:rgba(255,77,0,.08);color:#fff;font:900 10px Inter,Arial,sans-serif;letter-spacing:1.2px;text-transform:uppercase}
      .fs-surgical-vote-button:disabled{opacity:.45}
      .fs-surgical-percent{font:900 14px Inter,Arial,sans-serif;color:#fff}
      .fs-surgical-timer{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 0 14px;padding:10px 14px;border:1px solid rgba(255,77,0,.18);border-radius:999px;background:rgba(255,77,0,.06);color:#fff;font:900 10px Inter,Arial,sans-serif;letter-spacing:1.4px;text-transform:uppercase}
      .fs-surgical-timer strong{color:#ff4d00;font-variant-numeric:tabular-nums}
      .fs-surgical-battle-mode{font:900 9px Inter,Arial,sans-serif;letter-spacing:1.6px;color:#ff4d00;text-transform:uppercase}
      .fs-surgical-modal{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.72);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
      .fs-surgical-modal-card{width:min(620px,100%);max-height:88vh;overflow:auto;background:#0c0c0f;border:1px solid rgba(255,255,255,.10);border-bottom:0;border-radius:24px 24px 0 0;padding:22px 18px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -30px 90px rgba(0,0,0,.55)}
      .fs-surgical-kicker{color:#ff4d00;font:900 9px Inter,Arial,sans-serif;letter-spacing:2px;text-transform:uppercase}
      .fs-surgical-title{margin:7px 0;color:#fff;font:900 28px/1 Syne,Inter,sans-serif;letter-spacing:-1px;text-transform:uppercase}
      .fs-surgical-sub{margin:0 0 18px;color:#888;font:500 12px/1.5 Inter,Arial,sans-serif}
      .fs-surgical-label{margin:18px 0 9px;color:#aaa;font:900 9px Inter,Arial,sans-serif;letter-spacing:1.8px;text-transform:uppercase}
      .fs-surgical-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:48vh;overflow:auto;padding:2px}
      .fs-surgical-post{position:relative;aspect-ratio:1;border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden;background:#151518;padding:0}
      .fs-surgical-post img{width:100%;height:100%;display:block;object-fit:cover}
      .fs-surgical-post span{position:absolute;right:7px;top:7px;width:24px;height:24px;display:grid;place-items:center;border-radius:50%;background:rgba(0,0,0,.72);color:#fff;font:900 12px Inter;opacity:0}
      .fs-surgical-post.selected{border-color:#ff4d00;box-shadow:0 0 0 2px rgba(255,77,0,.20)}
      .fs-surgical-post.selected span{opacity:1;background:#ff4d00}
      .fs-surgical-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px}
      .fs-surgical-actions button{min-height:48px;border-radius:14px;font:900 10px Inter;letter-spacing:1px}
      .fs-surgical-cancel{background:#151518;border:1px solid rgba(255,255,255,.10);color:#aaa}
      .fs-surgical-confirm{background:#ff4d00;border:1px solid #ff4d00;color:#050505}
      .fs-surgical-confirm:disabled{opacity:.35}
      .fs-surgical-status{min-height:18px;margin-top:10px;text-align:center;color:#888;font:700 10px Inter}
      .fs-surgical-profile-post{cursor:pointer!important}
      @media(max-width:550px){.fs-surgical-grid{grid-template-columns:repeat(2,1fr)}.fs-surgical-modal-card{max-height:91vh}}
    `;
    document.head.appendChild(style);
  }

  async function session() {
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  }

  async function battleRequest(action, body = null, slug = "") {
    const s = await session();
    const url = new URL(BATTLE_URL);
    if (action) url.searchParams.set("action", action);
    if (slug) url.searchParams.set("slug", slug);
    const headers = { Accept: "application/json" };
    if (body !== null) {
      headers["Content-Type"] = "application/json";
      if (s?.access_token) headers.Authorization = `Bearer ${s.access_token}`;
    }
    const response = await fetch(url, { method: body === null ? "GET" : "POST", headers, body: body === null ? undefined : JSON.stringify(body), credentials: "omit" });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      const error = new Error(data?.message || "Operazione Battle non riuscita.");
      error.data = data;
      throw error;
    }
    return data;
  }

  async function myPosts() {
    const s = await session();
    if (!s?.user?.id) throw new Error("Devi essere autenticato.");
    const { data, error } = await supabase.from("posts").select("id,image_url,content,created_at").eq("user_id", s.user.id).not("image_url", "is", null).order("created_at", { ascending: false }).limit(24);
    if (error) throw error;
    return data || [];
  }

  function closeModal() { document.getElementById("fsSurgicalBattleModal")?.remove(); document.body.classList.remove("fs-battle-modal-open"); }

  async function acceptPendingBattle(button) {
    const s = await session();
    if (!s?.user?.id) return;
    const slug = new URLSearchParams(location.search).get("battle") || new URLSearchParams(location.search).get("slug") || "";
    if (!slug) return;
    const data = await battleRequest("", null, slug);
    const battle = data?.battle;
    if (!battle || battle.status !== "pending" || battle.challenged_id !== s.user.id) return;
    const posts = await myPosts();
    if (!posts.length) { window.showToast?.("Pubblica un outfit prima di accettare."); return; }
    const root = document.createElement("div"); root.id = "fsSurgicalBattleModal"; root.className = "fs-surgical-modal";
    root.innerHTML = `<div class="fs-surgical-modal-card"><div class="fs-surgical-kicker">⚔️ SFIDA RICEVUTA</div><h2 class="fs-surgical-title">SCEGLI IL TUO OUTFIT</h2><p class="fs-surgical-sub">Scegli il post con cui vuoi affrontare questa Battle.</p><div class="fs-surgical-grid">${posts.map(p => `<button class="fs-surgical-post" type="button" data-post-id="${escape(p.id)}"><img loading="lazy" src="${escape(p.image_url)}" alt="Outfit"><span>✓</span></button>`).join("")}</div><div class="fs-surgical-status" id="fsSurgicalStatus">Seleziona un outfit.</div><div class="fs-surgical-actions"><button class="fs-surgical-cancel" id="fsSurgicalCancel">ANNULLA</button><button class="fs-surgical-confirm" id="fsSurgicalConfirm" disabled>⚔️ ACCETTA E INIZIA</button></div></div>`;
    document.body.appendChild(root); document.body.classList.add("fs-battle-modal-open");
    let selected = ""; const grid = root.querySelector(".fs-surgical-grid"); const status = root.querySelector("#fsSurgicalStatus"); const confirm = root.querySelector("#fsSurgicalConfirm");
    root.querySelector("#fsSurgicalCancel").onclick = closeModal;
    grid.querySelectorAll(".fs-surgical-post").forEach(b => b.onclick = () => { grid.querySelectorAll(".fs-surgical-post").forEach(x => x.classList.remove("selected")); b.classList.add("selected"); selected = b.dataset.postId; confirm.disabled = false; status.textContent = "Outfit selezionato."; });
    confirm.onclick = async () => { if (!selected) return; confirm.disabled = true; status.textContent = "Avvio la Battle..."; try { await battleRequest("accept", { battle_id: Number(battle.id), post_id: Number(selected) }); closeModal(); location.reload(); } catch (error) { status.textContent = error?.message || "La sfida non è più disponibile."; } };
  }

  function bindBattleAccept() {
    if (!document.body.classList.contains("battle-page") || window.__FSBattleAcceptBound) return;
    window.__FSBattleAcceptBound = true;
    document.addEventListener("click", event => {
      const button = event.target?.closest?.("#acceptBattleButton");
      if (!button) return;
      event.preventDefault(); event.stopImmediatePropagation();
      acceptPendingBattle(button).catch(error => console.error("FSocial surgical accept:", error));
    }, true);
  }

  let activeBattleData = [];
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    try {
      const requestUrl = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      if (requestUrl.includes("/functions/v1/fsocial-battles") && requestUrl.includes("action=active")) {
        const clone = response.clone();
        const json = await clone.json();
        if (json?.success && Array.isArray(json.battles)) activeBattleData = json.battles;
      }
    } catch {}
    return response;
  };

  function formatTimer(endedAt) {
    const end = new Date(endedAt || 0).getTime();
    if (!Number.isFinite(end) || !end) return "LIVE";
    const remaining = Math.max(0, end - Date.now());
    const total = Math.floor(remaining / 1000);
    return `${String(Math.floor(total / 3600)).padStart(2,"0")}:${String(Math.floor((total % 3600) / 60)).padStart(2,"0")}:${String(total % 60).padStart(2,"0")}`;
  }

  function decorateBattleHub() {
    const cards = document.querySelectorAll(".fs-battle-hub-card");
    if (!cards.length || !activeBattleData.length) return;
    cards.forEach((card, index) => {
      const item = activeBattleData[index]; if (!item?.battle) return;
      card.querySelector(".fs-battle-hub-top strong")?.remove();
      const random = document.getElementById("fsBattleRandomBtn"); random?.remove();
      const heading = card.closest(".fs-battle-hub")?.querySelector(".fs-battle-hub-heading");
      if (heading) { const live = heading.querySelector(".fs-battle-hub-live"); if (live) live.style.marginInline = "auto"; }
      let timer = card.querySelector(".fs-surgical-timer");
      if (!timer) { timer = document.createElement("div"); timer.className = "fs-surgical-timer"; card.prepend(timer); }
      timer.innerHTML = `<span>LIVE</span><strong>${formatTimer(item.battle.ended_at)}</strong>`;
      const players = card.querySelectorAll(".fs-battle-hub-player");
      [0,1].forEach(side => { const player = players[side]; if (!player) return; player.classList.add("fs-surgical-vote-card"); });
      const total = Number(item.votes?.[item.battle.challenger_id] || 0) + Number(item.votes?.[item.battle.challenged_id] || 0);
      const p0 = total ? Math.round(Number(item.votes?.[item.battle.challenger_id] || 0) / total * 100) : 0;
      const p1 = total ? 100 - p0 : 0;
      players[0]?.querySelector(".fs-battle-hub-votes")?.insertAdjacentHTML("beforeend", `<span class="fs-surgical-percent">${p0}%</span>`);
      players[1]?.querySelector(".fs-battle-hub-votes")?.insertAdjacentHTML("beforeend", `<span class="fs-surgical-percent">${p1}%</span>`);
      const oldVote = card.querySelector(".fs-battle-hub-vote"); if (oldVote && !card.querySelector(".fs-surgical-selected")) oldVote.textContent = "TOCCA UN OUTFIT PER VOTARE →";
    });
  }

  function init() {
    addStyle();
    if (location.pathname.toLowerCase().endsWith("/fsocial.html")) {
      setInterval(() => { decorateBattleHub(); }, 500);
    }
    if (document.body.classList.contains("battle-page")) bindBattleAccept();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true }); else init();
})();
