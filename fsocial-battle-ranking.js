import { supabase } from './supabase.js';

(() => {
  'use strict';
  if (window.__FSOCIAL_BATTLE_RANKING__) return;
  window.__FSOCIAL_BATTLE_RANKING__ = true;
  if (!window.location.pathname.toLowerCase().endsWith('/area-personale.html')) return;

  const esc = value => { const d=document.createElement('div'); d.textContent=value ?? ''; return d.innerHTML; };
  const openSheet = (title, html) => {
    let root=document.getElementById('fsProfileV2Sheet');
    if(!root){
      root=document.createElement('div');
      root.id='fsProfileV2Sheet';
      root.innerHTML='<div class="fpv2-backdrop"><section class="fpv2-sheet"><div class="fpv2-grab"></div><header><strong id="fpv2-title"></strong><button id="fpv2-close">×</button></header><div id="fpv2-body"></div></section></div>';
      document.body.appendChild(root);
      root.querySelector('#fpv2-close').onclick=()=>root.querySelector('.fpv2-backdrop').classList.remove('open');
      root.querySelector('.fpv2-backdrop').addEventListener('click',e=>{if(e.target.classList.contains('fpv2-backdrop'))e.target.classList.remove('open')});
    }
    root.querySelector('#fpv2-title').textContent=title;
    root.querySelector('#fpv2-body').innerHTML=html;
    root.querySelector('.fpv2-backdrop').classList.add('open');
  };

  const style=document.createElement('style');
  style.textContent=`
    .fpv2-ranking-tabs{display:flex;gap:7px;margin-bottom:12px}.fpv2-ranking-tab{flex:1;height:38px;border:1px solid rgba(255,255,255,.08);border-radius:999px;background:#111116;color:#777;font:900 9px Inter;letter-spacing:1px}.fpv2-ranking-tab.active{background:#ff4d00;border-color:#ff4d00;color:#050505}
    .fpv2-ranking-list{display:grid;gap:7px}.fpv2-ranking-row{display:grid;grid-template-columns:34px 1fr auto;align-items:center;gap:10px;padding:10px 11px;border:1px solid rgba(255,255,255,.07);border-radius:15px;background:#111116}.fpv2-ranking-row.me{border-color:rgba(255,77,0,.45)}.fpv2-ranking-pos{font:900 12px Syne;color:#ff4d00;text-align:center}.fpv2-ranking-name{min-width:0}.fpv2-ranking-name strong{display:block;color:#fff;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fpv2-ranking-name span{display:block;color:#666;font-size:9px;margin-top:3px}.fpv2-ranking-score{font:900 11px Inter;color:#fff;text-align:right}.fpv2-ranking-score small{display:block;color:#666;font-size:8px;margin-top:2px}
  `;
  document.head.appendChild(style);

  async function loadBoard(type){
    const table=type==='weekly'?'fsocial_battle_weekly_rankings':'fsocial_battle_rankings';
    const {data,error}=await supabase.from(table).select('*').order(type==='weekly'?'weekly_rank':'global_rank',{ascending:true}).limit(50);
    if(error) return `<div class="fpv2-empty">${esc(error.message)}</div>`;
    if(!data?.length) return '<div class="fpv2-empty">NESSUN CONTENDENTE ANCORA</div>';
    const ids=data.map(x=>x.user_id);
    const {data:profiles,error:profileError}=await supabase.from('profiles').select('id,username,full_name,avatar_url').in('id',ids);
    if(profileError) return `<div class="fpv2-empty">${esc(profileError.message)}</div>`;
    const map=new Map((profiles||[]).map(p=>[p.id,p]));
    const me=(await supabase.auth.getUser()).data?.user?.id;
    return `<div class="fpv2-ranking-list">${data.map(x=>{const p=map.get(x.user_id)||{};const rank=type==='weekly'?x.weekly_rank:x.global_rank;const name=p.full_name||p.username||'UTENTE';const score=type==='weekly'?x.wins:x.wins;const sub=type==='weekly'?`${x.battles} Battle · ${x.win_rate}% win rate`:`${x.wins} vittorie · ${x.win_rate}% win rate`;return `<a class="fpv2-ranking-row ${x.user_id===me?'me':''}" href="area-personale.html?id=${encodeURIComponent(x.user_id)}"><div class="fpv2-ranking-pos">#${rank}</div><div class="fpv2-ranking-name"><strong>${esc(name)}</strong><span>${esc(sub)}</span></div><div class="fpv2-ranking-score">${score}<small>WIN</small></div></a>`}).join('')}</div>`;
  }

  async function ranking(){
    const body=`<div class="fpv2-ranking-tabs"><button class="fpv2-ranking-tab active" data-board="global">GLOBALE</button><button class="fpv2-ranking-tab" data-board="weekly">SETTIMANA</button></div><div data-ranking-body><div class="fpv2-empty">CARICAMENTO…</div></div>`;
    openSheet('RANKING BATTLE',body);
    const root=document.getElementById('fsProfileV2Sheet');
    const render=async type=>{root.querySelector('[data-ranking-body]').innerHTML='<div class="fpv2-empty">CARICAMENTO…</div>';root.querySelectorAll('.fpv2-ranking-tab').forEach(b=>b.classList.toggle('active',b.dataset.board===type));root.querySelector('[data-ranking-body]').innerHTML=await loadBoard(type)};
    root.querySelectorAll('.fpv2-ranking-tab').forEach(b=>b.addEventListener('click',()=>render(b.dataset.board)));
    render('global');
  }

  const wait=()=>{const actions=document.querySelector('.actions');if(!actions){requestAnimationFrame(wait);return;}if(document.getElementById('fsProfileRanking'))return;const b=document.createElement('button');b.id='fsProfileRanking';b.className='action-btn';b.textContent='RANKING';b.onclick=ranking;actions.appendChild(b)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait,{once:true});else wait();
})();
