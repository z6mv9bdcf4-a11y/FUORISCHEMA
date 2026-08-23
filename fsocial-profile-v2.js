import { supabase } from './supabase.js';

(() => {
  'use strict';
  if (window.__FSOCIAL_PROFILE_V2__) return;
  window.__FSOCIAL_PROFILE_V2__ = true;
  const path = window.location.pathname.toLowerCase();
  if (!path.endsWith('/area-personale.html')) return;

  const esc = value => { const d=document.createElement('div'); d.textContent=value??''; return d.innerHTML; };
  const openSheet = (title, html, after) => {
    let root=document.getElementById('fsProfileV2Sheet');
    if(!root){root=document.createElement('div');root.id='fsProfileV2Sheet';root.innerHTML='<div class="fpv2-backdrop"><section class="fpv2-sheet"><div class="fpv2-grab"></div><header><strong id="fpv2-title"></strong><button id="fpv2-close">×</button></header><div id="fpv2-body"></div></section></div>';document.body.appendChild(root);root.querySelector('#fpv2-close').onclick=()=>root.querySelector('.fpv2-backdrop').classList.remove('open');root.querySelector('.fpv2-backdrop').addEventListener('click',e=>{if(e.target.classList.contains('fpv2-backdrop'))e.target.classList.remove('open')});}
    root.querySelector('#fpv2-title').textContent=title;root.querySelector('#fpv2-body').innerHTML=html;root.querySelector('.fpv2-backdrop').classList.add('open');after?.(root);
  };
  const css=document.createElement('style');css.textContent=`
  #fsProfileV2Sheet .fpv2-backdrop{position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.62);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;visibility:hidden;transition:.22s ease}
  #fsProfileV2Sheet .fpv2-backdrop.open{opacity:1;visibility:visible}
  #fsProfileV2Sheet .fpv2-sheet{position:absolute;left:0;right:0;bottom:0;max-height:82vh;background:#0b0b0e;border:1px solid rgba(255,255,255,.1);border-bottom:0;border-radius:22px 22px 0 0;transform:translateY(105%);transition:transform .34s cubic-bezier(.16,1,.3,1);overflow:hidden}
  #fsProfileV2Sheet .open .fpv2-sheet{transform:translateY(0)}#fsProfileV2Sheet .fpv2-grab{width:38px;height:4px;background:#444;border-radius:99px;margin:9px auto 3px}
  #fsProfileV2Sheet header{display:flex;align-items:center;justify-content:space-between;padding:12px 18px 15px;border-bottom:1px solid rgba(255,255,255,.07)}#fsProfileV2Sheet header strong{font:900 16px Syne;color:#fff;letter-spacing:.2px}#fsProfileV2Sheet header button{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.08);background:#151518;color:#aaa;font-size:18px}
  #fsProfileV2Sheet #fpv2-body{padding:15px 18px calc(24px + env(safe-area-inset-bottom));overflow:auto;max-height:calc(82vh - 70px)}
  .fpv2-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.fpv2-grid a{aspect-ratio:1;background:#111;overflow:hidden}.fpv2-grid img{width:100%;height:100%;object-fit:cover}.fpv2-empty{text-align:center;padding:40px 10px;color:#666;font-size:11px;letter-spacing:1px}
  .fpv2-setting{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:15px 0;border-bottom:1px solid rgba(255,255,255,.06)}.fpv2-setting strong{display:block;color:#fff;font-size:12px}.fpv2-setting span{display:block;color:#777;font-size:10px;margin-top:4px;line-height:1.4}.fpv2-select,.fpv2-toggle{height:40px;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:#151518;color:#fff;padding:0 12px}.fpv2-toggle{width:54px;position:relative}.fpv2-toggle i{position:absolute;top:5px;left:5px;width:28px;height:28px;border-radius:50%;background:#666;transition:.2s}.fpv2-toggle.on{background:#ff4d00;border-color:#ff4d00}.fpv2-toggle.on i{left:21px;background:#050505}.fpv2-save{margin-top:16px;width:100%;height:46px;border:1px solid #ff4d00;border-radius:999px;background:#ff4d00;color:#050505;font:900 10px Inter;letter-spacing:1px;text-transform:uppercase}
  @media(min-width:700px){#fsProfileV2Sheet .fpv2-sheet{left:50%;right:auto;width:520px;transform:translate(-50%,105%);bottom:24px;border:1px solid rgba(255,255,255,.1);border-radius:22px}.fpv2-grid{gap:7px}}
  `;document.head.appendChild(css);

  async function user(){const {data}=await supabase.auth.getUser();return data?.user||null;}
  async function saved(){const u=await user();if(!u)return;const {data}=await supabase.from('post_saves').select('post_id,posts(id,image_url,content)').eq('user_id',u.id).order('created_at',{ascending:false});openSheet('SALVATI',`<div class="fpv2-grid">${(data||[]).map(x=>x.posts?.image_url?`<a href="Fsocial.html#post-${x.post_id}"><img loading="lazy" src="${esc(x.posts.image_url)}" alt=""></a>`:'').join('')||'<div class="fpv2-empty" style="grid-column:1/-1">NESSUN POST SALVATO</div>'}</div>`);}
  async function socialSettings(){const u=await user();if(!u)return;const {data}=await supabase.from('profile_settings').select('message_privacy,show_activity').eq('user_id',u.id).maybeSingle();const s=data||{message_privacy:'everyone',show_activity:true};openSheet('IMPOSTAZIONI SOCIAL',`<div class="fpv2-setting"><div><strong>Messaggi</strong><span>Chi può iniziare una conversazione con te.</span></div><select class="fpv2-select" data-message-privacy><option value="everyone" ${s.message_privacy==='everyone'?'selected':''}>TUTTI</option><option value="nobody" ${s.message_privacy==='nobody'?'selected':''}>NESSUNO</option></select></div><div class="fpv2-setting"><div><strong>Attività</strong><span>Permetti agli altri di vedere la tua attività.</span></div><button class="fpv2-toggle ${s.show_activity?'on':''}" data-toggle="activity"><i></i></button></div><button class="fpv2-save" data-save-settings>SALVA IMPOSTAZIONI</button>`,root=>{
      root.querySelectorAll('[data-toggle]').forEach(b=>b.addEventListener('click',()=>b.classList.toggle('on')));
       root.querySelectorAll('[data-toggle]').forEach(b=>b.addEventListener('click',()=>b.classList.toggle('on')));
       root.querySelector('[data-save-settings]').onclick=async()=>{const payload={user_id:u.id,show_activity:root.querySelector('[data-toggle="activity"]').classList.contains('on'),message_privacy:root.querySelector('[data-message-privacy]').value,updated_at:new Date().toISOString()};const {error}=await supabase.from('profile_settings').upsert(payload);if(error){alert(error.message);return}root.querySelector('.fpv2-save').textContent='SALVATO ✓';setTimeout(()=>root.querySelector('.fpv2-save').textContent='SALVA IMPOSTAZIONI',1200);};
  function mount(){const actions=document.querySelector('.actions');if(!actions)return; if(!document.getElementById('fsProfileSaved')){const b=document.createElement('button');b.id='fsProfileSaved';b.className='action-btn';b.textContent='SALVATI';b.onclick=saved;actions.appendChild(b)}if(!document.getElementById('fsProfileSettings')){const b=document.createElement('button');b.id='fsProfileSettings';b.className='action-btn';b.textContent='IMPOSTAZIONI SOCIAL';b.onclick=socialSettings;actions.appendChild(b)}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
