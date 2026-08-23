import { supabase } from './supabase.js';

(() => {
  'use strict';
  if (window.__FSOCIAL_V2__) return;
  window.__FSOCIAL_V2__ = true;
  const path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/fsocial.html')) return;

  document.body.classList.add('fs-v2');
  document.documentElement.style.setProperty('--fs-v2-ready', '1');

  const state = { user: null, profiles: new Map(), following: new Set(), saved: new Set(), stories: [], activeConversation: null, messageChannel: null };
  const esc = value => { const d = document.createElement('div'); d.textContent = value ?? ''; return d.innerHTML; };
  const initials = (name='U') => String(name).trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase() || 'U';
  const icon = name => ({
    heart:'<svg viewBox="0 0 24 24"><path d="M20.8 8.8c0 5.1-8.8 10.2-8.8 10.2S3.2 13.9 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z"/></svg>',
    bookmark:'<svg viewBox="0 0 24 24"><path d="M6 4.8A2.8 2.8 0 0 1 8.8 2h6.4A2.8 2.8 0 0 1 18 4.8V22l-6-3.8L6 22Z"/></svg>',
    message:'<svg viewBox="0 0 24 24"><path d="M20 11.5a7.5 7.5 0 0 1-7.9 7.5c-1.2 0-2.4-.3-3.4-.8L4 20l1.4-3.7A7.2 7.2 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7Z"/></svg>',
    plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'
  }[name] || '');

  const sheetRoot = document.createElement('div');
  sheetRoot.innerHTML = `
    <div class="fs-v2-sheet-backdrop" id="fsV2SheetBackdrop" aria-hidden="true">
      <section class="fs-v2-sheet" role="dialog" aria-modal="true">
        <div class="fs-v2-sheet-grab"></div>
        <header class="fs-v2-sheet-head"><strong class="fs-v2-sheet-title" id="fsV2SheetTitle">FSOCIAL</strong><button class="fs-v2-close" id="fsV2SheetClose" aria-label="Chiudi">×</button></header>
        <div class="fs-v2-sheet-body" id="fsV2SheetBody"></div>
      </section>
    </div>
    <div class="fs-v2-dialog-backdrop" id="fsV2DialogBackdrop" aria-hidden="true">
      <div class="fs-v2-story-viewer"><button class="fs-v2-story-close" id="fsV2StoryClose">×</button><div class="fs-v2-story-progress"><i></i></div><img id="fsV2StoryImage" alt="Story"></div>
    </div>`;
  document.body.appendChild(sheetRoot);
  const backdrop = document.getElementById('fsV2SheetBackdrop');
  const body = document.getElementById('fsV2SheetBody');
  const title = document.getElementById('fsV2SheetTitle');
  const dialog = document.getElementById('fsV2DialogBackdrop');

  function lock(open){ document.body.classList.toggle('modal-open', open); }
  function openSheet(name, html, after){ title.textContent = name; body.innerHTML = html; backdrop.classList.add('is-open'); backdrop.setAttribute('aria-hidden','false'); lock(true); after?.(); }
  function closeSheet(){ backdrop.classList.remove('is-open'); backdrop.setAttribute('aria-hidden','true'); lock(false); state.messageChannel?.unsubscribe?.(); state.messageChannel = null; }
  document.getElementById('fsV2SheetClose').onclick = closeSheet;
  backdrop.addEventListener('click', e => { if(e.target === backdrop) closeSheet(); });
  document.getElementById('fsV2StoryClose').onclick = () => { dialog.classList.remove('is-open'); dialog.setAttribute('aria-hidden','true'); lock(false); };

  async function auth(){
    const { data } = await supabase.auth.getUser();
    state.user = data?.user || null;
    return state.user;
  }

  async function loadProfile(id){
    if(!id || state.profiles.has(id)) return state.profiles.get(id);
    const { data } = await supabase.from('profiles').select('id,username,full_name,avatar_url').eq('id', id).maybeSingle();
    if(data) state.profiles.set(id,data);
    return data;
  }

  async function hydrateSocialState(){
    if(!state.user) return;
    const [follows, saves] = await Promise.all([
      supabase.from('user_follows').select('following_id').eq('follower_id', state.user.id),
      supabase.from('post_saves').select('post_id').eq('user_id', state.user.id)
    ]);
    state.following = new Set((follows.data||[]).map(x=>x.following_id));
    state.saved = new Set((saves.data||[]).map(x=>String(x.post_id)));
  }

  async function toggleFollow(userId, button){
    if(!state.user) return toast('ACCEDI','Accedi per seguire le persone.');
    if(userId === state.user.id) return;
    const was = state.following.has(userId);
    state.following[was ? 'delete' : 'add'](userId);
    renderFollowButton(button,userId);
    const result = was
      ? await supabase.from('user_follows').delete().eq('follower_id',state.user.id).eq('following_id',userId)
      : await supabase.from('user_follows').insert({follower_id:state.user.id,following_id:userId});
    if(result.error){ state.following[was ? 'add' : 'delete'](userId); renderFollowButton(button,userId); toast('ERRORE','Non è stato possibile aggiornare il follow.'); return; }
    if(!was) await supabase.from('notifications').insert({user_id:userId,actor_id:state.user.id,type:'follow',post_id:0,is_read:false}).then(()=>{});
  }
  function renderFollowButton(button,id){ if(!button) return; const yes=state.following.has(id); button.classList.toggle('is-following',yes); button.textContent=yes?'SEGUITO':'SEGUI'; }

  async function toggleSave(postId, button){
    if(!state.user) return toast('ACCEDI','Accedi per salvare i post.');
    const key=String(postId), was=state.saved.has(key);
    state.saved[was?'delete':'add'](key); button.classList.toggle('is-saved',!was); button.setAttribute('aria-pressed',String(!was));
    const result=was?await supabase.from('post_saves').delete().eq('post_id',postId).eq('user_id',state.user.id):await supabase.from('post_saves').insert({post_id:postId,user_id:state.user.id});
    if(result.error){state.saved[was?'add':'delete'](key);button.classList.toggle('is-saved',was);button.setAttribute('aria-pressed',String(was));toast('ERRORE','Salvataggio non riuscito.');}
  }

  let toastTimer;
  function toast(label,message){
    if(window.FSNotifications?.notify) return window.FSNotifications.notify(label,message);
    let el=document.getElementById('fsV2Toast');
    if(!el){el=document.createElement('div');el.id='fsV2Toast';el.style.cssText='position:fixed;left:50%;bottom:92px;transform:translate(-50%,12px);z-index:100001;padding:11px 15px;border:1px solid rgba(255,77,0,.3);border-radius:999px;background:rgba(8,8,10,.95);color:#fff;font:800 10px Inter;letter-spacing:1px;opacity:0;transition:.2s ease;pointer-events:none';document.body.appendChild(el)}
    el.textContent=message?`${label} · ${message}`:label; el.style.opacity='1';el.style.transform='translate(-50%,0)';clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.style.opacity='0';el.style.transform='translate(-50%,12px)'},2500);
  }

  async function loadStories(){
    if(!state.user) return;
    const {data,error}=await supabase.from('stories').select('id,user_id,media_url,media_type,created_at,expires_at').gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(40);
    if(error) return;
    const ids=[...new Set((data||[]).map(s=>s.user_id))];
    if(ids.length){const {data:profiles}=await supabase.from('profiles').select('id,username,full_name,avatar_url').in('id',ids);(profiles||[]).forEach(p=>state.profiles.set(p.id,p));}
    state.stories=data||[]; renderStories();
  }
  function renderStories(){
    const shell=document.querySelector('.feed-shell'); if(!shell || document.getElementById('fsV2StoryRail')) return;
    const rail=document.createElement('div'); rail.id='fsV2StoryRail'; rail.className='fs-v2-story-rail';
    const own=`<button class="fs-v2-story is-self" data-create-story><div class="fs-v2-story-avatar"><div>${state.user?.user_metadata?.full_name?initials(state.user.user_metadata.full_name):'TU'}<b class="fs-v2-story-add">+</b></div></div><span>LA TUA</span></button>`;
    rail.innerHTML=own+state.stories.map(s=>{const p=state.profiles.get(s.user_id)||{};return `<button class="fs-v2-story" data-story-id="${esc(s.id)}"><div class="fs-v2-story-avatar"><div>${p.avatar_url?`<img src="${esc(p.avatar_url)}" alt="">`:esc(initials(p.full_name||p.username))}</div></div><span>${esc(p.username||'UTENTE')}</span></button>`}).join('');
    const anchor=shell.querySelector('.hero')?.nextElementSibling; shell.insertBefore(rail,anchor||shell.firstChild);
    rail.querySelector('[data-create-story]')?.addEventListener('click',createStory);
    rail.querySelectorAll('[data-story-id]').forEach(b=>b.addEventListener('click',()=>openStory(b.dataset.storyId)));
  }
  function openStory(id){
    const s=state.stories.find(x=>String(x.id)===String(id)); if(!s) return;
    document.getElementById('fsV2StoryImage').src=s.media_url; dialog.classList.add('is-open'); dialog.setAttribute('aria-hidden','false'); lock(true);
    if(state.user && s.user_id!==state.user.id) supabase.from('story_views').upsert({story_id:s.id,viewer_id:state.user.id}).then(()=>{});
  }
  async function createStory(){
    if(!state.user) return toast('ACCEDI','Accedi per pubblicare una story.');
    const input=document.createElement('input'); input.type='file'; input.accept='image/*'; input.onchange=async()=>{
      const file=input.files?.[0]; if(!file) return;
      if(file.size>12*1024*1024) return toast('FILE TROPPO GRANDE','Massimo 12 MB.');
      toast('STORY','Caricamento…');
      const ext=(file.name.split('.').pop()||'jpg').toLowerCase(); const path=`${state.user.id}/${crypto.randomUUID()}.${ext}`;
      const upload=await supabase.storage.from('story-images').upload(path,file,{upsert:false,contentType:file.type||'image/jpeg'});
      if(upload.error) return toast('ERRORE',upload.error.message);
      const {data:url}=supabase.storage.from('story-images').getPublicUrl(path);
      const insert=await supabase.from('stories').insert({user_id:state.user.id,media_url:url.publicUrl,media_type:file.type||'image/jpeg'});
      if(insert.error) return toast('ERRORE',insert.error.message);
      toast('PUBBLICATA','La tua story è online.'); await loadStories();
    }; input.click();
  }

  async function openPeopleSearch(){
    openSheet('CERCA PERSONE',`<input class="fs-v2-search" id="fsV2PeopleSearch" placeholder="Cerca username o nome…" autocomplete="off"><div class="fs-v2-list" id="fsV2PeopleList"><div class="fs-v2-empty">INIZIA A CERCARE</div></div>`,()=>{
      const input=document.getElementById('fsV2PeopleSearch'); input.focus(); let timer;
      input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>searchPeople(input.value),180)});
    });
  }
  async function searchPeople(q){
    const list=document.getElementById('fsV2PeopleList'); if(!list) return; q=q.trim(); if(q.length<2){list.innerHTML='<div class="fs-v2-empty">DIGITA ALMENO 2 CARATTERI</div>';return;}
    const {data}=await supabase.from('profiles').select('id,username,full_name,avatar_url').or(`username.ilike.%${q}%,full_name.ilike.%${q}%`).limit(20);
    if(!data?.length){list.innerHTML='<div class="fs-v2-empty">NESSUN UTENTE</div>';return;}
    data.forEach(p=>state.profiles.set(p.id,p));
    list.innerHTML=data.map(p=>`<div class="fs-v2-person"><div class="fs-v2-person-avatar">${p.avatar_url?`<img src="${esc(p.avatar_url)}" alt="">`:esc(initials(p.full_name||p.username))}</div><div class="fs-v2-person-main"><strong>${esc(p.full_name||p.username||'Utente')}</strong><span>@${esc(p.username||'—')}</span></div>${p.id!==state.user?.id?`<button class="fs-v2-follow" data-follow="${esc(p.id)}">${state.following.has(p.id)?'SEGUITO':'SEGUI'}</button>`:''}</div>`).join('');
    list.querySelectorAll('[data-follow]').forEach(b=>b.addEventListener('click',()=>toggleFollow(b.dataset.follow,b)));
  }

  async function openMessages(){
    if(!state.user) return toast('ACCEDI','Accedi per usare i messaggi.');
    const {data:members}=await supabase.from('conversation_members').select('conversation_id').eq('user_id',state.user.id);
    const ids=(members||[]).map(x=>x.conversation_id); let rows=[];
    if(ids.length){const {data:convs}=await supabase.from('conversation_members').select('conversation_id,user_id,profiles(id,username,full_name,avatar_url)').in('conversation_id',ids).neq('user_id',state.user.id); rows=convs||[];}
    const grouped=new Map(); rows.forEach(r=>{if(!grouped.has(r.conversation_id))grouped.set(r.conversation_id,r.profiles)});
    openSheet('MESSAGGI',`<div class="fs-v2-list">${[...grouped.entries()].map(([cid,p])=>`<button class="fs-v2-conversation" data-conversation="${cid}"><div class="fs-v2-person-avatar">${p?.avatar_url?`<img src="${esc(p.avatar_url)}" alt="">`:esc(initials(p?.full_name||p?.username))}</div><div class="fs-v2-conversation-copy"><strong>${esc(p?.full_name||p?.username||'Utente')}</strong><span>@${esc(p?.username||'—')}</span></div></button>`).join('')||'<div class="fs-v2-empty">NESSUNA CONVERSAZIONE<br><small>Cerca una persona e premi MESSAGGIO.</small></div>'}</div>`,()=>{
      body.querySelectorAll('[data-conversation]').forEach(b=>b.addEventListener('click',()=>openConversation(b.dataset.conversation,grouped.get(b.dataset.conversation))));
    });
  }
  async function openConversation(conversationId,person){
    const {data:messages}=await supabase.from('messages').select('id,sender_id,body,created_at').eq('conversation_id',conversationId).order('created_at',{ascending:true}).limit(100);
    openSheet(`@${person?.username||'MESSAGGI'}`,`<div class="fs-v2-chat"><div class="fs-v2-chat-messages" id="fsV2ChatMessages">${(messages||[]).map(m=>`<div class="fs-v2-bubble ${m.sender_id===state.user.id?'mine':''}">${esc(m.body)}</div>`).join('')}</div><form class="fs-v2-chat-compose" id="fsV2ChatForm"><input id="fsV2ChatInput" maxlength="4000" placeholder="Scrivi un messaggio…" autocomplete="off"><button aria-label="Invia">↑</button></form></div>`,()=>{
      const list=document.getElementById('fsV2ChatMessages'); list.scrollTop=list.scrollHeight;
      document.getElementById('fsV2ChatForm').addEventListener('submit',sendMessage);
      state.messageChannel=supabase.channel(`fsocial-chat-${conversationId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`conversation_id=eq.${conversationId}`},payload=>{if(payload.new.sender_id!==state.user.id)addBubble(payload.new.body,false)}).subscribe();
    });
    async function sendMessage(e){e.preventDefault();const input=document.getElementById('fsV2ChatInput');const text=input.value.trim();if(!text)return;input.value='';const {error}=await supabase.from('messages').insert({conversation_id:conversationId,sender_id:state.user.id,body:text});if(error)toast('ERRORE',error.message);else addBubble(text,true)}
    function addBubble(text,mine){const list=document.getElementById('fsV2ChatMessages');if(!list)return;list.insertAdjacentHTML('beforeend',`<div class="fs-v2-bubble ${mine?'mine':''}">${esc(text)}</div>`);list.scrollTop=list.scrollHeight}
  }

  async function addPostEnhancements(){
    const cards=document.querySelectorAll('.post-card');
    for(const card of cards){
      const postId=card.dataset.postId||card.querySelector('[data-post-id]')?.dataset.postId||card.querySelector('[id^="comments-"]')?.id?.replace('comments-','');
      if(!postId || card.dataset.fsV2Ready) continue; card.dataset.fsV2Ready='1';
      const save=document.createElement('button'); save.className='action-button fs-v2-save fs-v2-touch'; save.type='button'; save.title='Salva'; save.setAttribute('aria-label','Salva post'); save.innerHTML=icon('bookmark'); save.classList.toggle('is-saved',state.saved.has(String(postId))); save.setAttribute('aria-pressed',String(state.saved.has(String(postId)))); save.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleSave(Number(postId),save)});
      const actions=card.querySelector('.post-actions'); if(actions) actions.appendChild(save);
      const owner=await supabase.from('posts').select('user_id,product_slug').eq('id',postId).maybeSingle();
      if(owner.data?.user_id){
        const profile=await loadProfile(owner.data.user_id);
        const header=card.querySelector('.post-header');
        if(header && owner.data.user_id!==state.user?.id && !header.querySelector('[data-follow]')){const b=document.createElement('button');b.className='fs-v2-follow';b.dataset.follow=owner.data.user_id;renderFollowButton(b,owner.data.user_id);b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleFollow(owner.data.user_id,b)});header.appendChild(b)}
        if(owner.data.product_slug){renderProduct(card,owner.data.product_slug)}
        if(profile) card.dataset.ownerId=profile.id;
      }
    }
  }
  function renderProduct(card,slug){
    if(card.querySelector('.fs-v2-product'))return;
    const product=window.FUORISCHEMA_PRODUCTS?.[slug]; if(!product)return;
    const a=document.createElement('a');a.className='fs-v2-product';a.href=`prodotto.html?id=${encodeURIComponent(product.id)}`;a.innerHTML=`<img src="${esc(product.image)}" alt=""><div><small>SHOP THE LOOK</small><strong>${esc(product.name)}</strong><span>${esc(product.brand)} · ${esc(product.category)}</span></div><b>↗</b>`;card.appendChild(a);
  }

  function wireTopbar(){
    const actions=document.querySelector('.topbar-actions'); if(!actions || actions.querySelector('[data-fs-v2-messages]')) return;
    const b=document.createElement('button');b.type='button';b.dataset.fsV2Messages='1';b.className='notif-btn fs-v2-touch';b.setAttribute('aria-label','Messaggi');b.innerHTML=icon('message');b.addEventListener('click',openMessages);actions.insertBefore(b,actions.firstChild);
  }
  function wireSearch(){
    const search=document.querySelector('.user-search-input'); const bottom=document.querySelector('#fsocialBottomNav [data-nav="search"]'); if(bottom){bottom.onclick=e=>{e.preventDefault();openPeopleSearch();}} if(search){search.addEventListener('focus',()=>{});}
  }
  function wireProductCatalog(){
    if(document.querySelector('script[data-fsocial-products]'))return;
    const s=document.createElement('script');s.src='products.js';s.dataset.fsocialProducts='1';document.head.appendChild(s);
  }
  function motion(){
    document.addEventListener('pointerdown',e=>{const target=e.target.closest('button,a,.action-button');if(target)target.classList.add('fs-v2-touch')},{passive:true});
  }
  async function init(){
    await auth(); await hydrateSocialState(); wireProductCatalog(); wireTopbar(); wireSearch(); await loadStories(); await addPostEnhancements();
    const feed=document.getElementById('feed'); if(feed){const observer=new MutationObserver(()=>{addPostEnhancements()});observer.observe(feed,{childList:true,subtree:true});window.addEventListener('beforeunload',()=>observer.disconnect(),{once:true});}
    if(state.user){state.messageChannel=supabase.channel('fsocial-notifications-v2').on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${state.user.id}`},payload=>{document.getElementById('notifButton')?.animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:320});}).subscribe();}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
