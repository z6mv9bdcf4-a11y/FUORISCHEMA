import { supabase } from './supabase.js';

(() => {
  'use strict';
  if (window.__FSOCIAL_REPUTATION_V1__) return;
  window.__FSOCIAL_REPUTATION_V1__ = true;
  if (!location.pathname.toLowerCase().endsWith('/area-personale.html')) return;

  const esc=v=>{const d=document.createElement('div');d.textContent=v??'';return d.innerHTML};
  const css=document.createElement('style');css.textContent=`
    .fsrep{margin-top:12px;padding:14px;border:1px solid rgba(255,255,255,.07);background:linear-gradient(135deg,rgba(255,77,0,.055),rgba(255,255,255,.015));border-radius:4px}.fsrep-head{display:flex;align-items:center;justify-content:space-between;gap:15px}.fsrep-title{font:900 9px Inter;letter-spacing:1.7px;color:#aaa;text-transform:uppercase}.fsrep-score{font:900 18px Syne;color:#fff}.fsrep-score small{font:700 8px Inter;color:#777;letter-spacing:1px}.fsrep-bar{height:3px;background:#1c1c1c;margin-top:10px;overflow:hidden}.fsrep-fill{height:100%;background:#ff4d00;transition:width .5s ease}.fsbadges{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}.fsbadge{display:inline-flex;align-items:center;gap:5px;padding:6px 8px;border:1px solid rgba(255,77,0,.2);border-radius:999px;background:rgba(255,77,0,.04);color:#eee;font:800 8px Inter;letter-spacing:.7px}.fsbadge b{color:#ff6a32}.fsrep-note{margin-top:8px;color:#666;font:700 8px Inter;letter-spacing:.6px;text-transform:uppercase}
  `;document.head.appendChild(css);

  async function run(){
    const {data:auth}=await supabase.auth.getUser();const me=auth?.user;if(!me)return;
    const id=new URLSearchParams(location.search).get('id')||me.id;
    const {data:rep}=await supabase.rpc('refresh_fsocial_reputation',{p_user_id:id});
    if(!rep)return;
    const {data:badges}=await supabase.from('fsocial_user_badges').select('earned_at,fsocial_badges(code,name,description,icon)').eq('user_id',id).order('earned_at',{ascending:true});
    const anchor=document.querySelector('.profile-info');if(!anchor||document.getElementById('fsrep'))return;
    const box=document.createElement('section');box.id='fsrep';box.className='fsrep';
    const next=rep.score<100?100:rep.score<500?500:rep.score<1000?1000:Math.ceil((rep.score+1)/500)*500;
    const prev=rep.score<100?0:rep.score<500?100:rep.score<1000?500:1000;
    const pct=Math.min(100,((rep.score-prev)/Math.max(1,next-prev))*100);
    box.innerHTML=`<div class="fsrep-head"><div><div class="fsrep-title">REPUTAZIONE FSOCIAL</div><div class="fsrep-score">${rep.score} <small>PTS</small></div></div><div class="fsrep-title">${rep.battle_wins} WIN · ${rep.posts_count} POST</div></div><div class="fsrep-bar"><div class="fsrep-fill" style="width:${pct}%"></div></div><div class="fsrep-note">${rep.score>=1000?'LIVELLO ELITE':`PROSSIMO LIVELLO · ${next} PTS`}</div><div class="fsbadges">${(badges||[]).map(x=>{const b=x.fsocial_badges;return b?`<span class="fsbadge" title="${esc(b.description)}"><b>${esc(b.icon)}</b>${esc(b.name)}</span>`:''}).join('')||'<span class="fsrep-note">Nessun badge ancora conquistato</span>'}</div></section>`;
    anchor.appendChild(box);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
