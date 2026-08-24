import { supabase } from "./supabase.js";

(() => {
  "use strict";
  if (window.__FS_BATTLE_PAGE_OVERRIDES__) return;
  window.__FS_BATTLE_PAGE_OVERRIDES__ = true;
  const style=document.createElement("style");style.textContent=`.fs-battle-outfit-mode{display:inline-flex;align-items:center;gap:8px;padding:8px 13px;border:1px solid rgba(255,77,0,.35);border-radius:999px;background:rgba(255,77,0,.08);color:#ff4d00;font:900 9px Inter;letter-spacing:1.5px;text-transform:uppercase}.fs-battle-outfit-mode::before{content:"⚔️"}.fs-response-note{margin-top:12px;padding:14px;border:1px solid rgba(255,77,0,.18);border-radius:14px;background:rgba(255,77,0,.055);color:#aaa;font:600 11px/1.5 Inter}.fs-response-note strong{color:#fff}`;document.head.appendChild(style);
  function init(){
    if(!document.body.classList.contains("battle-page"))return;
    const category=document.getElementById("battleCategory");if(category){category.textContent="BATTLE OUTFIT";category.classList.add("fs-battle-outfit-mode");}
    const wrap=document.querySelector(".battle-category-wrap");if(wrap){wrap.querySelector(".battle-category-icon")?.remove();}
    const response=document.getElementById("battleResponseActions");if(response&&!response.querySelector(".fs-response-note")){const note=document.createElement("div");note.className="fs-response-note";note.innerHTML="<strong>SCEGLI IL TUO OUTFIT</strong><br>La tua foto entrerà direttamente in Battle. Dopo l'accettazione la sfida non potrà essere modificata.";response.appendChild(note)}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  setInterval(init,1000);
})();