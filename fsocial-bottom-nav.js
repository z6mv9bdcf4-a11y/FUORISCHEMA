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
      camera: '<path d="M4 7.5h3l1.4-2h7.2l1.4 2h3v11H4z"/><circle cx="12" cy="13" r="3.2"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ""}</g></svg>`;
  };

  const css = `
    body{background:#050505!important;color:#f5f5f5!important}
    .topbar{background:rgba(5,5,5,.90)!important;border-bottom-color:rgba(255,255,255,.055)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important}
    .brand{letter-spacing:-.7px!important}
    .top-btn,.top-btn.primary,.top-btn.primary:hover{box-shadow:none!important}
    .page{padding-top:24px!important}
    .feed-shell{max-width:540px!important}
    .hero{margin-bottom:18px!important}
    .hero-title{font-size:30px!important;letter-spacing:-.9px!important}
    .hero-meta{letter-spacing:1.5px!important}
    .user-search-input-box{background:#0b0b0d!important;border-color:rgba(255,255,255,.065)!important;box-shadow:none!important}
    .user-search-input-box:focus-within{border-color:rgba(255,255,255,.18)!important;box-shadow:none!important}
    .search-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:17px!important;height:17px!important;margin-right:9px!important;font-size:0!important;color:#8e8e93!important}
    .search-icon svg{width:16px;height:16px;display:block}
    .feed-tabs{border-color:rgba(255,255,255,.065)!important;background:#09090b!important}
    .tab-btn.active{box-shadow:none!important}
    .create-card{background:#0b0b0d!important;border-color:rgba(255,255,255,.065)!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
    .create-card:focus-within{border-color:rgba(255,255,255,.16)!important;box-shadow:none!important}
    .photo-label{display:inline-flex!important;align-items:center!important;gap:6px!important}
    .photo-label svg{width:15px;height:15px;display:block}
    .post-card{background:#0b0b0d!important;border-color:rgba(255,255,255,.065)!important;box-shadow:none!important}
    .post-card:hover{border-color:rgba(255,255,255,.11)!important;box-shadow:none!important}
    .post-actions{gap:14px!important}
    .action-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important}
    .action-icon svg{width:19px;height:19px;display:block}
    .notif-overlay{background:rgba(0,0,0,.58)!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important}
    .notif-modal{background:#0a0a0c!important;box-shadow:-18px 0 45px rgba(0,0,0,.55)!important;border-left-color:rgba(255,255,255,.065)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
    .notif-header{background:#0b0b0d!important}
    #fsocialBottomNav{height:72px;background:rgba(8,8,10,.96)!important;border-top:1px solid rgba(255,255,255,.065)!important;box-shadow:0 -10px 28px rgba(0,0,0,.28)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important}
    #fsocialBottomNav .fsbn-inner{gap:2px!important}
    #fsocialBottomNav .fsbn-item{color:#74747a!important;font-size:9px!important;font-weight:800!important;letter-spacing:.9px!important}
    #fsocialBottomNav .fsbn-item:hover,#fsocialBottomNav .fsbn-item.active{color:#fff!important}
    #fsocialBottomNav .fsbn-icon{width:20px!important;height:20px!important;font-size:0!important;display:flex!important;align-items:center!important;justify-content:center!important}
    #fsocialBottomNav .fsbn-icon svg{width:18px;height:18px;display:block}
    #fsocialBottomNav .fsbn-add{box-shadow:0 0 14px rgba(255,77,0,.18)!important;width:46px!important;height:46px!important}
    @media(max-width:650px){.page{padding-top:16px!important}.feed-shell{padding-left:10px!important;padding-right:10px!important}.hero-title{font-size:27px!important}.create-card,.post-card{border-radius:14px!important}#fsocialBottomNav{height:68px!important}}
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
      if(el.querySelector("svg")) return;
      el.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5a7.5 7.5 0 0 1-7.9 7.5c-1.2 0-2.4-.3-3.4-.8L4 20l1.4-3.7A7.2 7.2 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7z"/></g></svg>';
    });

    document.querySelectorAll(".share-button .action-icon").forEach(el=>{
      if(el.querySelector("svg")) return;
      el.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3 10.5 13.5"/><path d="m21 3-7 18-3.5-7L3 10.5z"/></g></svg>';
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
