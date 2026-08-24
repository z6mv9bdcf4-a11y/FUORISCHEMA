import { supabase } from "./supabase.js";

(() => {
  "use strict";
  if (window.__FSOCIAL_SURGICAL_OVERRIDES_2__) return;
  window.__FSOCIAL_SURGICAL_OVERRIDES_2__ = true;

  const esc = v => { const d=document.createElement("div"); d.textContent=v??""; return d.innerHTML; };
  const css = document.createElement("style");
  css.textContent = `
    .fs-like-meta-action{cursor:pointer;transition:color .18s ease}.fs-like-meta-action:hover{color:#fff!important}.fs-save-button{margin-left:auto!important}.fs-save-button.is-saved{color:#ff4d00!important}.fs-notif-battle{background:rgba(255,77,0,.075)!important;border-left:2px solid #ff4d00!important}.fs-notif-battle::after{content:"BATTLE";position:absolute;right:14px;top:50%;transform:translateY(-50%);font:900 8px Inter;letter-spacing:1px;color:#ff4d00}.fs-live-pulse{animation:fsLivePulse 1.8s ease-in-out infinite}@keyframes fsLivePulse{0%,100%{box-shadow:0 0 0 0 rgba(255,77,0,.0)}50%{box-shadow:0 0 0 5px rgba(255,77,0,.10)}}
    .fs-post-detail{position:fixed;inset:0;z-index:2147482999;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(0,0,0,.78);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}.fs-post-detail-card{width:min(620px,100%);max-height:92vh;overflow:auto;background:#0c0c0f;border:1px solid rgba(255,255,255,.1);border-radius:22px;box-shadow:0 30px 100px rgba(0,0,0,.65)}.fs-post-detail-close{position:sticky;top:10px;float:right;margin:10px;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.12);color:#fff;font-size:20px;z-index:3}.fs-post-detail img{width:100%;display:block;max-height:68vh;object-fit:contain;background:#050505}.fs-post-detail-body{padding:16px}.fs-post-detail-author{font:900 12px Inter;color:#fff}.fs-post-detail-caption{margin-top:7px;color:#aaa;font:500 12px/1.5 Inter}.fs-post-detail-actions{display:flex;gap:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.07);margin-top:14px}.fs-post-detail-actions button{color:#aaa;background:none;border:0;font:800 10px Inter}.fs-post-detail-actions button.active{color:#ff4d00}
  `;
  document.head.appendChild(css);

  function notifyBattleRows(){
    document.querySelectorAll(".notif-item").forEach(item=>{
      if(item.dataset.fsBattleStyled) return;
      const text=(item.textContent||"").toLowerCase();
      if(text.includes("battle")||text.includes("sfidato")||text.includes("concluso una battle")||text.includes("rifiutato la tua battle")){
        item.classList.add("fs-notif-battle"); item.dataset.fsBattleStyled="1";
      }
    });
    const badge=document.getElementById("bottomNavBadge");
    if(badge?.classList.contains("active")) badge.classList.add("fs-live-pulse");
  }

  async function openLikes(postId){
    const {data,error}=await supabase.from("post_likes").select("user_id").eq("post_id",postId).order("created_at",{ascending:false});
    if(error){window.showToast?.(error.message);return;}
    const ids=[...(data||[]).map(x=>x.user_id)];
    let profiles=[];
    if(ids.length){const res=await supabase.from("profiles").select("id,username,full_name,avatar_url").in("id",ids);profiles=res.data||[];}
    const map=new Map(profiles.map(p=>[p.id,p]));
    const root=document.createElement("div");root.className="fs-post-detail";
    root.innerHTML=`<div class="fs-post-detail-card" style="max-width:420px"><button class="fs-post-detail-close">×</button><div style="padding:20px"><div style="font:900 12px Syne;color:#fff;letter-spacing:1px">PIACE A ${ids.length} PERSONE</div><div style="margin-top:14px;display:grid;gap:8px">${ids.map(id=>{const p=map.get(id)||{};return `<a href="area-personale.html?id=${encodeURIComponent(id)}" style="display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;padding:10px;border:1px solid rgba(255,255,255,.07);border-radius:12px"><div style="width:34px;height:34px;border-radius:50%;overflow:hidden;background:#ff4d00;display:grid;place-items:center;color:#000;font-weight:900">${p.avatar_url?`<img src="${esc(p.avatar_url)}" style="width:100%;height:100%;object-fit:cover">`:esc((p.full_name||p.username||"F").slice(0,2).toUpperCase())}</div><div><strong style="font:700 11px Inter">${esc(p.full_name||p.username||"MEMBRO FUORISCHEMA")}</strong><div style="color:#666;font:500 9px Inter">${p.username?"@"+esc(p.username):""}</div></div></a>`}).join("")||`<div style="color:#666;font:700 10px Inter">NESSUN LIKE.</div>`}</div></div></div>`;
    root.onclick=e=>{if(e.target===root||e.target.closest(".fs-post-detail-close"))root.remove()};document.body.appendChild(root);
  }

  async function toggleSave(postId,button){
    const {data:userData}=await supabase.auth.getUser();const user=userData?.user;if(!user){window.showToast?.("Devi essere loggato.");return;}
    const existing=await supabase.from("post_saves").select("id").eq("post_id",postId).eq("user_id",user.id).maybeSingle();
    if(existing.data){const {error}=await supabase.from("post_saves").delete().eq("id",existing.data.id);if(error){window.showToast?.(error.message);return}button.classList.remove("is-saved");button.textContent="SALVA";}
    else{const {error}=await supabase.from("post_saves").insert({post_id:postId,user_id:user.id});if(error){window.showToast?.(error.message);return}button.classList.add("is-saved");button.textContent="SALVATO";}
  }

  async function decoratePost(article){
    const comments=article.querySelector('[id^="comments-"]');const match=comments?.id?.match(/^comments-(\d+)$/);const postId=match?Number(match[1]):0;if(!postId)return;
    const meta=article.querySelector(".post-meta");
    if(meta&&!meta.dataset.fsLikeBound){meta.dataset.fsLikeBound="1";meta.classList.add("fs-like-meta-action");meta.addEventListener("click",()=>openLikes(postId));}
    const actions=article.querySelector(".post-actions");
    if(actions&&!actions.querySelector(".fs-save-button")){
      const b=document.createElement("button");b.type="button";b.className="action-button fs-save-button";b.textContent="SALVA";b.title="Salva post";b.onclick=()=>toggleSave(postId,b);actions.appendChild(b);
      try{const {data:userData}=await supabase.auth.getUser();const user=userData?.user;if(user){const {data}=await supabase.from("post_saves").select("id").eq("post_id",postId).eq("user_id",user.id).maybeSingle();if(data){b.classList.add("is-saved");b.textContent="SALVATO"}}}catch{}
    }
  }

  async function openProfilePost(tile){
    const img=tile.querySelector("img");if(!img)return;
    const {data:post,error}=await supabase.from("posts").select("id,user_id,content,image_url,created_at").eq("image_url",img.currentSrc||img.src).order("created_at",{ascending:false}).limit(1).maybeSingle();
    if(error||!post){window.showToast?.("Post non disponibile.");return;}
    const {data:profile}=await supabase.from("profiles").select("username,full_name").eq("id",post.user_id).maybeSingle();
    const root=document.createElement("div");root.className="fs-post-detail";
    root.innerHTML=`<div class="fs-post-detail-card"><button class="fs-post-detail-close">×</button><img src="${esc(post.image_url)}" alt="Post"><div class="fs-post-detail-body"><div class="fs-post-detail-author">${esc(profile?.username?"@"+profile.username:profile?.full_name||"MEMBRO FUORISCHEMA")}</div>${post.content?`<div class="fs-post-detail-caption">${esc(post.content)}</div>`:""}<div class="fs-post-detail-actions"><button data-like>♡ LIKE</button><button data-comments>💬 COMMENTI</button><button data-save>SALVA</button><button data-battle>⚔️ BATTLE</button></div></div></div>`;
    root.onclick=e=>{if(e.target===root||e.target.closest(".fs-post-detail-close"))root.remove()};
    root.querySelector("[data-like]").onclick=async()=>{const {data:userData}=await supabase.auth.getUser();const user=userData?.user;if(!user)return;const existing=await supabase.from("post_likes").select("id").eq("post_id",post.id).eq("user_id",user.id).maybeSingle();if(existing.data)await supabase.from("post_likes").delete().eq("id",existing.data.id);else await supabase.from("post_likes").insert({post_id:post.id,user_id:user.id});window.showToast?.("Like aggiornato.")};
    root.querySelector("[data-comments]").onclick=()=>window.showToast?.("Apri il post dalla Home per i commenti completi.");
    root.querySelector("[data-save]").onclick=e=>toggleSave(post.id,e.currentTarget);
    root.querySelector("[data-battle]").onclick=()=>{root.remove();window.openBattleChallengeModal?.({challengedUserId:post.user_id,challengedAuthor:{username:profile?.username,name:profile?.full_name}})};
    document.body.appendChild(root);
  }

  function init(){
    const home=location.pathname.toLowerCase().endsWith("/fsocial.html");
    const profile=location.pathname.toLowerCase().endsWith("/area-personale.html");
    if(home){
      const observer=new MutationObserver(()=>{document.querySelectorAll(".post-card").forEach(x=>decoratePost(x));notifyBattleRows()});observer.observe(document.body,{childList:true,subtree:true});
      notifyBattleRows();
    }
    if(profile){
      const observer=new MutationObserver(()=>{document.querySelectorAll(".post-tile").forEach(tile=>{if(tile.dataset.fsDetail)return;tile.dataset.fsDetail="1";tile.onclick=()=>openProfilePost(tile)})});observer.observe(document.body,{childList:true,subtree:true});
      document.querySelectorAll(".post-tile").forEach(tile=>{tile.dataset.fsDetail="1";tile.onclick=()=>openProfilePost(tile)});
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();