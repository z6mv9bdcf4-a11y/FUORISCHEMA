import { supabase } from './supabase.js';

(() => {
  'use strict';
  if (window.__FSOCIAL_FEED_V2__) return;
  window.__FSOCIAL_FEED_V2__ = true;

  const state = { user:null, mode:'foryou', following:new Set(), saved:new Set(), seen:new Set(), loading:false };
  const $ = s => document.querySelector(s);
  const esc = v => { const d=document.createElement('div'); d.textContent=v??''; return d.innerHTML; };
  const toast = msg => typeof window.showToast === 'function' ? window.showToast(msg) : console.log(msg);

  const style=document.createElement('style');
  style.textContent=`
    .fsfeed-v2-bar{display:flex;gap:7px;padding:0 16px 12px;overflow:auto;scrollbar-width:none}.fsfeed-v2-bar::-webkit-scrollbar{display:none}.fsfeed-v2-chip{flex:0 0 auto;border:1px solid rgba(255,255,255,.09);background:#101010;color:#777;border-radius:999px;padding:8px 12px;font:900 8px Inter;letter-spacing:1.3px}.fsfeed-v2-chip.active{background:#ff4d00;color:#050505;border-color:#ff4d00}.fsfeed-v2-save{cursor:pointer}.fsfeed-v2-save.saved{color:#ff4d00}.fsfeed-v2-product{margin-top:10px;padding:11px;border:1px solid rgba(255,77,0,.18);background:linear-gradient(90deg,rgba(255,77,0,.08),transparent);font:800 9px Inter;letter-spacing:1px;text-transform:uppercase}.fsfeed-v2-product span{color:#ff6a32}.fsfeed-v2-skeleton{height:330px;margin:12px 16px;border-radius:14px;background:linear-gradient(90deg,#111 25%,#181818 37%,#111 63%);background-size:400% 100%;animation:fsfeedShimmer 1.2s infinite}@keyframes fsfeedShimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}@media(prefers-reduced-motion:reduce){.fsfeed-v2-skeleton{animation:none}}
  `;
  document.head.appendChild(style);

  async function init(){
    const {data}=await supabase.auth.getUser(); state.user=data?.user||null;
    if(!state.user) return;
    await loadGraph();
    mountChips();
    patchFeedLoader();
  }

  async function loadGraph(){
    const [f,s]=await Promise.all([
      supabase.from('user_follows').select('following_id').eq('follower_id',state.user.id),
      supabase.from('post_saves').select('post_id').eq('user_id',state.user.id)
    ]);
    (f.data||[]).forEach(x=>state.following.add(x.following_id));
    (s.data||[]).forEach(x=>state.saved.add(String(x.post_id)));
  }

  function mountChips(){
    const tabs=$('.feed-tabs'); if(!tabs||$('#fsfeedV2Bar')) return;
    const bar=document.createElement('div');bar.id='fsfeedV2Bar';bar.className='fsfeed-v2-bar';
    [['foryou','PER TE'],['following','SEGUITI'],['saved','SALVATI'],['battle','BATTLE']].forEach(([mode,label])=>{
      const b=document.createElement('button');b.type='button';b.className='fsfeed-v2-chip'+(mode==='foryou'?' active':'');b.dataset.mode=mode;b.textContent=label;
      b.onclick=()=>setMode(mode);bar.appendChild(b);
    });
    tabs.insertAdjacentElement('afterend',bar);
  }

  function setMode(mode){
    state.mode=mode;document.querySelectorAll('.fsfeed-v2-chip').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    if(mode==='battle'){ document.querySelector('#tabRecent')?.click(); return; }
    document.querySelector('#tabForYou')?.click();
    if(mode==='following') window.__FSOCIAL_FEED_MODE__='following';
    else if(mode==='saved') window.__FSOCIAL_FEED_MODE__='saved';
    else window.__FSOCIAL_FEED_MODE__='foryou';
    window.__FSOCIAL_FEED_REFRESH__?.();
  }

  function patchFeedLoader(){
    const original=window.loadFeed;
    window.__FSOCIAL_FEED_REFRESH__=async()=>{ if(typeof original==='function') await original(); };
  }

  window.__FSOCIAL_FEED_V2_STATE__=state;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
