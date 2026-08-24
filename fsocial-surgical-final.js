import { supabase } from "./supabase.js";

(() => {
  "use strict";
  if (window.__FSOCIAL_SURGICAL_FINAL__) return;
  window.__FSOCIAL_SURGICAL_FINAL__ = true;

  const path = location.pathname.toLowerCase();
  const isHome = path.endsWith("/fsocial.html");
  const isProfile = path.endsWith("/area-personale.html");
  const isBattle = path.endsWith("/battle.html");
  if (!isHome && !isProfile && !isBattle) return;

  const style = document.createElement("style");
  style.id = "fsocialSurgicalFinalStyle";
  style.textContent = `
    .notif-overlay:not(.active),.profile-overlay:not(.active),.fs-safety-overlay:not(.active){display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important}
    body.modal-open{overflow:hidden}
    .fs-surgical-clean .notif-overlay:not(.active),.fs-surgical-clean .profile-overlay:not(.active),.fs-surgical-clean .fs-safety-overlay:not(.active){pointer-events:none!important}
    .post-actions{pointer-events:auto!important}
    .post-actions .action-button{pointer-events:auto!important;touch-action:manipulation!important}
    .post-secondary-actions{display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;padding:2px 14px 11px!important}
    .post-secondary-actions button{min-height:31px!important;height:31px!important;padding:0 12px!important;border:1px solid rgba(255,255,255,.10)!important;border-radius:999px!important;background:rgba(255,255,255,.035)!important;color:#aaa!important;font:900 9px Inter,Arial,sans-serif!important;letter-spacing:1px!important;text-transform:uppercase!important}
    .post-secondary-actions .fs-save-button.is-saved{color:#ff4d00!important;border-color:rgba(255,77,0,.45)!important;background:rgba(255,77,0,.08)!important}
    .post-actions .action-icon{font-size:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important}
    .post-actions .action-icon svg{width:19px!important;height:19px!important;display:block!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}
    .fs-battle-hub-live,.fs-battle-random-btn{display:none!important}
    .fs-battle-hub-votes .fs-surgical-percent~.fs-surgical-percent{display:none!important}
    .fs-battle-hub-vote{min-height:46px!important}
    .fs-surgical-vote-card{cursor:pointer!important;user-select:none!important;touch-action:manipulation!important}
    .fs-surgical-vote-card.fs-surgical-selected{outline:2px solid #ff4d00!important;outline-offset:2px!important}
    .notif-item{display:grid!important;grid-template-columns:40px minmax(0,1fr) auto!important;align-items:center!important;gap:12px!important}
    .notif-content{min-width:0!important;padding-right:52px!important}
    .notif-text{min-width:0!important;overflow-wrap:anywhere!important;word-break:break-word!important}
    .fs-notif-battle::after{right:12px!important;top:50%!important;transform:translateY(-50%)!important}
    .fs-final-public .actions,.fs-final-public .change-avatar{display:none!important}
    .section-label{color:#555!important}
    .section-label::before{background:#ff4d00!important}
    .fpv2-grid,.profile-grid,.gallery-grid{background:transparent!important;color:inherit!important}
    .fs-battle-hub-votes{overflow:visible!important}
    .fs-battle-hub-votes .fs-surgical-percent{display:block!important}
    .fs-battle-hub-votes .fs-surgical-percent~.fs-surgical-percent{display:none!important}
    @media(max-width:650px){.feed-shell{padding-left:8px!important;padding-right:8px!important}.post-card{border-radius:14px!important}.post-actions{gap:14px!important}}
  `;
  document.head.appendChild(style);

  const icons = {
    comment:'<svg viewBox="0 0 24 24"><path d="M5 5.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H11l-4.5 3v-3H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"/></svg>',
    share:'<svg viewBox="0 0 24 24"><path d="m21 3-7.2 18-3.2-7.6L3 10.2 21 3Z"/><path d="m10.6 13.4 4.9-4.9"/></svg>',
    battle:'<svg viewBox="0 0 24 24"><path d="m7 3 4 4-7 7 4 4 7-7 4 4"/><path d="m17 3-4 4 7 7-4 4-7-7"/></svg>'
  };

  function closeAccidentalOverlays(){
    document.body.classList.remove("modal-open");
    ["notifOverlay","profileOverlay","fsReportOverlay","fsBlockOverlay"].forEach(id=>{
      const el=document.getElementById(id);
      if(!el)return;
      el.classList.remove("active","open");
      if(id!=="fsReportOverlay"&&id!=="fsBlockOverlay")el.style.display="none";
      if(id==="fsReportOverlay"||id==="fsBlockOverlay")el.remove();
    });
  }

  function decorate(){
    document.documentElement.classList.add("fs-surgical-clean");
    if(isHome){
      document.querySelectorAll(".post-card").forEach(card=>{
        const actions=card.querySelector(".post-actions");
        if(!actions)return;
        let secondary=card.querySelector(".post-secondary-actions");
        if(!secondary){secondary=document.createElement("div");secondary.className="post-secondary-actions";actions.insertAdjacentElement("afterend",secondary)}
        actions.querySelectorAll(".fs-save-button,.delete-button,.owner-delete-button").forEach(btn=>secondary.appendChild(btn));
        card.querySelectorAll(".comment-toggle .action-icon").forEach(x=>{if(!x.querySelector("svg"))x.innerHTML=icons.comment});
        card.querySelectorAll(".share-button .action-icon").forEach(x=>{if(!x.querySelector("svg"))x.innerHTML=icons.share});
        card.querySelectorAll(".battle-button .action-icon").forEach(x=>{if(!x.querySelector("svg"))x.innerHTML=icons.battle});
      });
      const battleTab=document.getElementById("tabRecent");
      const isBattleFeed=!!battleTab?.classList.contains("active");
      const composer=document.querySelector(".create-card");
      if(composer)composer.toggleAttribute("hidden",isBattleFeed);
      document.querySelectorAll(".fs-battle-hub-live,.fs-battle-random-btn").forEach(x=>x.remove());
      document.querySelectorAll(".fs-battle-hub-votes").forEach(v=>{
        const ps=v.querySelectorAll(".fs-surgical-percent");
        ps.forEach((p,i)=>{if(i>0)p.remove()});
      });
    }
    if(isProfile){
      document.querySelectorAll(".fs-final-public .actions button,.fs-final-public .actions a,.fs-final-public .change-avatar").forEach(x=>x.remove());
    }
  }

  const hydratedPosts = new Set();
  async function hydrateOnePost(card){
    if(!isHome || !card || card.dataset.fsLikeHydrated === "1") return;
    const match = card.querySelector('[id^="comments-"]')?.id?.match(/^comments-(\d+)$/);
    const postId = match ? Number(match[1]) : 0;
    if(!postId || hydratedPosts.has(postId)) return;

    hydratedPosts.add(postId);
    try{
      const [{count:likeCount, error:likeError},{count:commentCount,error:commentError}]=await Promise.all([
        supabase.from("post_likes").select("id",{count:"exact",head:true}).eq("post_id",postId),
        supabase.from("post_comments").select("id",{count:"exact",head:true}).eq("post_id",postId)
      ]);
      if(likeError) throw likeError;
      if(commentError) throw commentError;
      const like=card.querySelector(".like-count");
      const comment=card.querySelector(".comment-count");
      if(like) like.textContent=String(likeCount||0);
      if(comment) comment.textContent=String(commentCount||0);
      card.dataset.fsLikeHydrated="1";
    }catch(error){
      hydratedPosts.delete(postId);
      console.warn("FSocial like/comment hydration:",error);
    }
  }

  function hydrateAllPosts(){
    if(!isHome)return;
    document.querySelectorAll(".post-card").forEach(card=>hydrateOnePost(card));
  }

  function boot(){
    closeAccidentalOverlays();
    decorate();
    hydrateAllPosts();
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{
        queued=false;
        decorate();
        hydrateAllPosts();
      });
    });
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),30000);
    if(isHome)setTimeout(hydrateAllPosts,300);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();
