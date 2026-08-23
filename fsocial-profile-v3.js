import { supabase } from './supabase.js';

(() => {
  'use strict';
  if (window.__FSOCIAL_PROFILE_V3__) return;
  window.__FSOCIAL_PROFILE_V3__ = true;
  if (!window.location.pathname.toLowerCase().endsWith('/area-personale.html')) return;

  const esc = value => { const d=document.createElement('div'); d.textContent=value ?? ''; return d.innerHTML; };
  const params = new URLSearchParams(location.search);
  const viewedId = params.get('id');
  let me = null;
  let profile = null;

  const css = document.createElement('style');
  css.textContent = `
    .fsv3-badge-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.fsv3-badge{padding:5px 8px;border:1px solid rgba(255,77,0,.25);border-radius:999px;background:rgba(255,77,0,.06);color:#ff6a32;font:900 8px Inter;letter-spacing:1px;text-transform:uppercase}.fsv3-public-grid{margin-top:14px}.fsv3-battle-stats{display:flex;gap:10px;flex-wrap:wrap;margin-top:3px}.fsv3-mini{font-size:9px;color:#777;letter-spacing:.7px;text-transform:uppercase}.fsv3-mini strong{color:#fff;font-size:12px;margin-right:3px}.fsv3-private{grid-column:1/-1;padding:55px 20px;text-align:center;border:1px solid rgba(255,255,255,.07);background:rgba(15,15,15,.35);color:#777;font-size:10px;letter-spacing:1.2px}.fsv3-profile-link{cursor:pointer}
  `;
  document.head.appendChild(css);

  async function init(){
    const {data:auth}=await supabase.auth.getUser();
    me=auth?.user||null;
    if(!me) return;
    const targetId=viewedId||me.id;
    profile=await getProfile(targetId);
    if(!profile) return;
    const [postsRes,battlesRes]=await Promise.all([
      supabase.from('posts').select('id,image_url,content,product_slug,created_at').eq('user_id',targetId).order('created_at',{ascending:false}).limit(90),
      supabase.from('battles').select('id,status,winner_id,challenger_id,challenged_id').or(challenger_id.eq.,challenged_id.eq.).limit(200)
    ]);
    const battles=battlesRes.data||[];
    const wins=battles.filter(b=>b.status==='completed'&&b.winner_id===targetId).length;
    const completed=battles.filter(b=>b.status==='completed').length;

    applyStats({posts:posts.length});
    addBattleStats(wins,completed);
    const {data}=await supabase.from('profiles').select('id,username,full_name,instagram,avatar_url,bio').eq('id',id).maybeSingle();
    return data||null;
  }

  function applyStats(s){
    const values=document.querySelectorAll('.profile-stats .stat-value');
    const labels=document.querySelectorAll('.profile-stats .stat-label');
    if(values[0]) values[0].textContent=s.posts;
    if(labels[0]) labels[0].textContent='post';
  }

  function addBattleStats(wins,completed){
    const stats=document.querySelector('.profile-stats');
    if(!stats||document.getElementById('fsv3BattleStats')) return;
    const wrap=document.createElement('div'); wrap.id='fsv3BattleStats'; wrap.className='fsv3-battle-stats';
    wrap.innerHTML=`<span class="fsv3-mini"><strong>${wins}</strong> Battle vinte</span><span class="fsv3-mini"><strong>${completed}</strong> concluse</span>`;
    stats.parentElement.appendChild(wrap);
  }


  function renderGrid(posts){
    const grid=document.querySelector('.posts-grid'); if(!grid)return;
    if(!posts.length){grid.innerHTML='<div class="empty-posts"><strong>Nessun contenuto</strong><span>Questo profilo non ha ancora pubblicato.</span></div>';return;}
    grid.innerHTML='';
    posts.forEach(p=>{
      const tile=document.createElement('a'); tile.className='post-tile'; tile.href=`Fsocial.html#post-${encodeURIComponent(p.id)}`;
      tile.innerHTML=p.image_url?`<img src="${esc(p.image_url)}" loading="lazy" alt="">`:`<div class="text-only"><div class="post-text">${esc(p.content||'POST')}</div></div>`;
      grid.appendChild(tile);
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
