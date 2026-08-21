(() => {
  "use strict";

  if (window.__FUORISCHEMA_BOTTOM_NAV__) return;
  window.__FUORISCHEMA_BOTTOM_NAV__ = true;

  const path = window.location.pathname.toLowerCase();
  const isProfilePage = path.endsWith("/area-personale.html");

  const icon = (name) => {
    const paths = {
      home: '<path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>',
      search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 5 5"/>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
      user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/>',
      camera: '<path d="M4 7.5h3l1.4-2h7.2l1.4 2h3v11H4z"/><circle cx="12" cy="13" r="3.2"/>',
      heart: '<path d="M20.8 8.8c0 5.1-8.8 10.2-8.8 10.2S3.2 13.9 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ""}</g></svg>`;
  };

  const commentIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5a7.5 7.5 0 0 1-7.9 7.5c-1.2 0-2.4-.3-3.4-.8L4 20l1.4-3.7A7.2 7.2 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7z"/></g></svg>';
  const shareIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3 10.5 13.5"/><path d="m21 3-7 18-3.5-7L3 10.5z"/></g></svg>';

  const css = `
    /* =========================================================
       FUORISCHEMA / FSOCIAL — CLEAN VISUAL SYSTEM
       VISUAL ONLY: no data, auth, storage or interaction logic.
    ========================================================= */
    body{background:transparent!important;color:#f5f5f5!important}

    .topbar{
      background:rgba(5,5,5,.94)!important;
      border-bottom-color:rgba(255,255,255,.055)!important;
      box-shadow:none!important;
      backdrop-filter:blur(18px)!important;
      -webkit-backdrop-filter:blur(18px)!important;
    }
    .brand{letter-spacing:-.7px!important}
    .topbar-actions{gap:7px!important}
    .top-btn,.top-btn.primary,.top-btn.primary:hover{box-shadow:none!important}
    .top-btn.primary{background:var(--orange)!important;border-color:var(--orange)!important;color:#000!important}
    .top-btn.primary:hover{background:#fff!important;border-color:#fff!important;color:#000!important}

    /* More content, less empty space. */
    .page{padding-top:18px!important;padding-bottom:98px!important}
    .feed-shell{max-width:600px!important;padding-left:14px!important;padding-right:14px!important}
    .hero{margin-bottom:16px!important;padding:0 2px!important}
    .hero-title{font-size:29px!important;letter-spacing:-.8px!important}
    .hero-meta{letter-spacing:1.4px!important}

    .user-search-wrapper{margin-bottom:18px!important}
    .user-search-input-box{
      background:rgba(8,8,10,.60)!important;backdrop-filter:blur(28px) saturate(155%)!important;-webkit-backdrop-filter:blur(28px) saturate(155%)!important;
      border-color:rgba(255,255,255,.065)!important;
      box-shadow:none!important;
    }
    .user-search-input-box:focus-within{border-color:rgba(255,255,255,.16)!important;box-shadow:none!important}
    .search-icon{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      width:17px!important;height:17px!important;margin-right:9px!important;font-size:0!important;color:#85858c!important;
    }
    .search-icon svg{width:16px;height:16px;display:block}

    .feed-tabs{
      margin-bottom:20px!important;
      border-color:rgba(255,255,255,.065)!important;
      background:rgba(8,8,10,.60)!important;backdrop-filter:blur(28px) saturate(155%)!important;-webkit-backdrop-filter:blur(28px) saturate(155%)!important;
      box-shadow:none!important;
    }
    .tab-btn{font-size:10px!important;letter-spacing:.9px!important}
    .tab-btn.active{box-shadow:none!important}

    .create-card{
      margin-bottom:20px!important;
      background:rgba(8,8,10,.60)!important;backdrop-filter:blur(28px) saturate(155%)!important;-webkit-backdrop-filter:blur(28px) saturate(155%)!important;
      border-color:rgba(255,255,255,.065)!important;
      box-shadow:none!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
    }
    .create-card:focus-within{border-color:rgba(255,255,255,.14)!important;box-shadow:none!important}
    .photo-label{display:inline-flex!important;align-items:center!important;gap:6px!important}
    .photo-label svg{width:15px;height:15px;display:block}
    .publish-button{box-shadow:none!important}

    /* Posts are the visual priority. */
    .post-card{
      background:rgba(8,8,10,.60)!important;backdrop-filter:blur(28px) saturate(155%)!important;-webkit-backdrop-filter:blur(28px) saturate(155%)!important;
      border-color:rgba(255,255,255,.065)!important;
      box-shadow:none!important;
      overflow:hidden!important;
      margin-bottom:18px!important;
    }
    .post-card:hover{border-color:rgba(255,255,255,.10)!important;box-shadow:none!important}
    .post-header{padding:14px 16px 12px!important}
    .post-actions{gap:15px!important;padding-top:11px!important}
    .action-button{transition:color .18s ease,transform .15s ease!important}
    .action-button:hover{transform:none!important}
    .action-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important}
    .action-icon svg{width:19px;height:19px;display:block}
    .like-button .action-icon{font-size:0!important;line-height:1!important}
    .like-button .action-icon svg{width:20px;height:20px}
    .comment-count,.like-count{font-variant-numeric:tabular-nums}

    /* Remove decorative glow from ordinary UI. */
    .notif-overlay{background:rgba(0,0,0,.58)!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important}
    .notif-modal{background:rgba(8,8,10,.60)!important;backdrop-filter:blur(28px) saturate(155%)!important;-webkit-backdrop-filter:blur(28px) saturate(155%)!important;box-shadow:-18px 0 45px rgba(0,0,0,.55)!important;border-left-color:rgba(255,255,255,.065)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
    .notif-header{background:#0a0a0c!important}

    /* =========================================================
       FSOCIAL BOTTOM NAV — fixed, quiet, app-like
    ========================================================= */
    #fsocialBottomNav{
      position:fixed!important;left:0!important;right:0!important;bottom:0!important;z-index:99990!important;width:100%!important;
      height:70px!important;padding:5px 18px calc(5px + env(safe-area-inset-bottom))!important;
      background:rgba(8,8,10,.58)!important;border-top:1px solid rgba(255,255,255,.14)!important;
      box-shadow:0 -10px 30px rgba(0,0,0,.20),inset 0 1px 0 rgba(255,255,255,.10)!important;backdrop-filter:blur(30px) saturate(160%)!important;-webkit-backdrop-filter:blur(30px) saturate(160%)!important;
    }
    #fsocialBottomNav .fsbn-inner{
      width:min(600px,100%)!important;height:100%!important;margin:0 auto!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:2px!important
    }    #fsocialBottomNav .fsbn-item{
      height:100%!important;min-width:0!important;flex:1 1 0!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;
      color:#9a9aa0!important;background:transparent!important;border:0!important;font:700 9px Inter,Arial,sans-serif!important;letter-spacing:.85px!important;text-transform:uppercase!important;text-decoration:none!important;
      transition:color .18s ease,transform .15s ease!important;
    }
    #fsocialBottomNav .fsbn-item:hover,#fsocialBottomNav .fsbn-item.active{color:#fff!important}
    #fsocialBottomNav .fsbn-item:active{transform:scale(.96)!important}
    #fsocialBottomNav .fsbn-icon{width:20px!important;height:20px!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:0!important}
    #fsocialBottomNav .fsbn-icon svg{width:18px;height:18px;display:block}
    #fsocialBottomNav .fsbn-add{
      width:44px!important;height:44px!important;border-radius:50%!important;display:grid!important;place-items:center!important;
      background:var(--orange)!important;color:#000!important;font-size:21px!important;font-weight:900!important;line-height:1!important;box-shadow:0 0 12px rgba(255,77,0,.14)!important;
      transition:transform .18s ease,background-color .18s ease!important;
    }

    @media(max-width:650px){
      .page{padding-top:12px!important;padding-bottom:88px!important}
      .feed-shell{max-width:620px!important;padding-left:8px!important;padding-right:8px!important}
      .hero{margin-bottom:14px!important}
      .hero-title{font-size:27px!important}
      .user-search-wrapper{margin-bottom:15px!important}
      .feed-tabs{margin-bottom:16px!important}
      .create-card,.post-card{border-radius:14px!important}
      .post-card{margin-bottom:14px!important}
      .post-header{padding:13px 14px 11px!important}
      #fsocialBottomNav{height:68px!important;padding-left:8px!important;padding-right:8px!important}
          #fsocialBottomNav .fsbn-item{font-size:8px!important;letter-spacing:.75px!important}
      #fsocialBottomNav .fsbn-icon{width:19px!important;height:19px!important}
      #fsocialBottomNav .fsbn-icon svg{width:17px;height:17px}
      #fsocialBottomNav .fsbn-add{width:44px!important;height:44px!important}
    }

    /* Placeholder readability — visual only */
    .user-search-input::placeholder{
      color:rgba(255,255,255,.58)!important;
      opacity:1!important;
    }

    .create-card textarea::placeholder{
      color:rgba(255,255,255,.52)!important;
      opacity:1!important;
    }
  `;

  function injectStyle(){
    if(document.getElementById("fsocialBottomNavStyle")) return;
    const style=document.createElement("style");
    style.id="fsocialBottomNavStyle";
    style.textContent=css;
    document.head.appendChild(style);
  }

  function cleanUiIcons(){
    const searchIcon=document.querySelector(".search-icon");
    if(searchIcon && !searchIcon.querySelector("svg")) searchIcon.innerHTML=icon("search");

    document.querySelectorAll(".photo-label").forEach(label=>{
      if(!label.querySelector("svg")) label.innerHTML=`${icon("camera")}<span>FOTO</span>`;
    });

    document.querySelectorAll(".comment-toggle .action-icon").forEach(el=>{
      if(!el.querySelector("svg")) el.innerHTML=commentIcon;
    });

    document.querySelectorAll(".share-button .action-icon").forEach(el=>{
      if(!el.querySelector("svg")) el.innerHTML=shareIcon;
    });

    document.querySelectorAll(".like-button .action-icon").forEach(el=>{
      if(!el.querySelector("svg")) el.innerHTML=icon("heart");
    });
  }

  function styleExistingProfileNav(){
    const nav=document.querySelector(".bottom-nav");
    if(!nav) return false;
    const icons=nav.querySelectorAll(".bottom-nav-icon");
    const replacements=[icon("home"),icon("search"),null,icon("bell"),icon("user")];
    icons.forEach((el,index)=>{if(replacements[index]!==null) el.innerHTML=replacements[index];});
    const active=nav.querySelector("#navProfile");
    if(active) active.classList.add("active");
    return true;
  }

  function injectHomeNav(){
    if(!document.body || document.getElementById("fsocialBottomNav")) return;
    const nav=document.createElement("nav");
    nav.id="fsocialBottomNav";
    nav.setAttribute("aria-label","Navigazione FSocial");
    nav.innerHTML=`
      <div class="fsbn-inner">
        <a class="fsbn-item active" href="Fsocial.html" data-nav="home" aria-label="Home"><span class="fsbn-icon">${icon("home")}</span><span>HOME</span></a>
        <button class="fsbn-item" type="button" data-nav="search" aria-label="Cerca"><span class="fsbn-icon">${icon("search")}</span><span>CERCA</span></button>
        <button class="fsbn-item" type="button" data-nav="create" aria-label="Crea un post"><span class="fsbn-add">+</span></button>
        <button class="fsbn-item" type="button" data-nav="notifications" aria-label="Notifiche"><span class="fsbn-icon">${icon("bell")}</span><span>NOTIFICHE</span></button>
        <a class="fsbn-item" href="area-personale.html" data-nav="profile" aria-label="Profilo"><span class="fsbn-icon">${icon("user")}</span><span>PROFILO</span></a>
      </div>`;
    document.body.appendChild(nav);

    nav.querySelector('[data-nav="search"]').addEventListener("click",()=>{
      const input=document.querySelector(".user-search-input");
      if(input){input.focus();input.scrollIntoView({behavior:"smooth",block:"center"});}
    });
    nav.querySelector('[data-nav="create"]').addEventListener("click",()=>{
      const input=document.querySelector("textarea, [contenteditable=\"true\"]");
      if(input){input.focus();input.scrollIntoView({behavior:"smooth",block:"center"});}
    });
    nav.querySelector('[data-nav="notifications"]').addEventListener("click",()=>{
      const button=document.getElementById("navNotif");
      if(button) button.click();
    });
    if(window.supabase?.auth){
      window.supabase.auth.getUser().then(({data})=>{
        if(data?.user?.id){
          const profile=nav.querySelector('[data-nav="profile"]');
          profile.href=`area-personale.html?id=${encodeURIComponent(data.user.id)}`;
        }
      }).catch(()=>{});
    }
  }

  function init(){
    injectStyle();
    if(isProfilePage){styleExistingProfileNav();return;}
    injectHomeNav();
    cleanUiIcons();
    const observer=new MutationObserver(()=>cleanUiIcons());
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),12000);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
