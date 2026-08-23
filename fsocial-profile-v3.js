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
    .fsv3-badge-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.fsv3-badge{padding:5px 8px;border:1px solid rgba(255,77,0,.25);border-radius:999px;background:rgba(255,77,0,.06);color:#ff6a32;font:900 8px Inter;letter-spacing:1px;text-transform:uppercase}.fsv3-following{background:#ff4d00!important;border-color:#ff4d00!important;color:#050505!important}.fsv3-public-grid{margin-top:14px}.fsv3-battle-stats{display:flex;gap:10px;flex-wrap:wrap;margin-top:3px}.fsv3-mini{font-size:9px;color:#777;letter-spacing:.7px;text-transform:uppercase}.fsv3-mini strong{color:#fff;font-size:12px;margin-right:3px}.fsv3-private{grid-column:1/-1;padding:55px 20px;text-align:center;border:1px solid rgba(255,255,255,.07);background:rgba(15,15,15,.35);color:#777;font-size:10px;letter-spacing:1.2px}.fsv3-follow-btn{min-height:37px;padding:0 18px;border-radius:2px;border:1px solid #ff4d00;background:#ff4d00;color:#050505;font:900 8px Inter;letter-spacing:1.5px;text-transform:uppercase}.fsv3-follow-btn.is-following{background:#151515;border-color:#333;color:#fff}.fsv3-follow-btn:disabled{opacity:.5}.fsv3-profile-link{cursor:pointer}
  `;
  document.head.appendChild(css);

  async function init(){
    const {data:auth}=await supabase.auth.getUser();
    me=auth?.user||null;
    if(!me) return;
    const targetId=viewedId||me.id;
    profile=await getProfile(targetId);
    if(!profile) return;
    const isOwn=targetId===me.id;
    const [followersRes,followingRes,postsRes,battlesRes,followRes,settingsRes]=await Promise.all([
      supabase.from('user_follows').select('follower_id',{count:'exact',head:true}).eq('following_id',targetId),
      supabase.from('user_follows').select('following_id',{count:'exact',head:true}).eq('follower_id',targetId),
      supabase.from('posts').select('id,image_url,content,product_slug,created_at').eq('user_id',targetId).order('created_at',{ascending:false}).limit(90),
      supabase.from('battles').select('id,status,winner_id,challenger_id,challenged_id').or(`challenger_id.eq.${targetId},challenged_id.eq.${targetId}`).limit(200),
      me.id===targetId?Promise.resolve({data:[] }):supabase.from('user_follows').select('following_id').eq('follower_id',me.id).eq('following_id',targetId).limit(1),
      supabase.from('profile_settings').select('is_private').eq('user_id',targetId).maybeSingle()
    ]);
    const followers=followersRes.count||0, following=followingRes.count||0, posts=postsRes.data||[];
    const battles=battlesRes.data||[];
    const wins=battles.filter(b=>b.status==='completed'&&b.winner_id===targetId).length;
    const completed=battles.filter(b=>b.status==='completed').length;
    const isFollowing=Boolean(followRes.data?.length);
    const isPrivate=Boolean(settingsRes.data?.is_private);

    applyStats({followers,following,posts:battlesRes.error?posts.length:posts.length});
    addBattleStats(wins,completed);
    if(!isOwn) addFollowButton(targetId,isFollowing);
    renderGrid(posts,isOwn||!isPrivate);
  }

  async function getProfile(id){
    const {data}=await supabase.from('profiles').select('id,username,full_name,instagram,avatar_url,bio').eq('id',id).maybeSingle();
    return data||null;
  }

  function applyStats(s){
    const values=document.querySelectorAll('.profile-stats .stat-value');
    const labels=document.querySelectorAll('.profile-stats .stat-label');
    if(values[0]) values[0].textContent=s.posts;
    if(labels[0]) labels[0].textContent='post';
    if(values[1]) values[1].textContent=s.followers;
    if(labels[1]) labels[1].textContent='follower';
    if(values[2]) values[2].textContent=s.following;
    if(labels[2]) labels[2].textContent='seguiti';
  }

  function addBattleStats(wins,completed){
    const stats=document.querySelector('.profile-stats');
    if(!stats||document.getElementById('fsv3BattleStats')) return;
    const wrap=document.createElement('div'); wrap.id='fsv3BattleStats'; wrap.className='fsv3-battle-stats';
    wrap.innerHTML=`<span class="fsv3-mini"><strong>${wins}</strong> Battle vinte</span><span class="fsv3-mini"><strong>${completed}</strong> concluse</span>`;
    stats.parentElement.appendChild(wrap);
  }

  function addFollowButton(id,isFollowing){
    const actions=document.querySelector('.actions'); if(!actions) return;
    const button=document.createElement('button'); button.className='fsv3-follow-btn'+(isFollowing?' is-following':''); button.textContent=isFollowing?'SEGUITO':'SEGUI'; button.type='button';
    button.onclick=async()=>{
      button.disabled=true;
      try{
        if(button.classList.contains('is-following')){
          const {error}=await supabase.from('user_follows').delete().eq('follower_id',me.id).eq('following_id',id); if(error)throw error;
          button.classList.remove('is-following');button.textContent='SEGUI';
        }else{
          const {error}=await supabase.from('user_follows').insert({follower_id:me.id,following_id:id}); if(error)throw error;
          button.classList.add('is-following');button.textContent='SEGUITO';
        }
      }catch(e){alert(e.message||'Operazione non riuscita.');}
      finally{button.disabled=false;}
    };
    actions.prepend(button);
  }

  function renderGrid(posts,canView){
    const grid=document.querySelector('.posts-grid'); if(!grid)return;
    if(!canView){grid.innerHTML='<div class="fsv3-private">🔒 PROFILO PRIVATO<br><span style="display:block;margin-top:7px">Segui questo profilo per vedere i contenuti.</span></div>';return;}
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
