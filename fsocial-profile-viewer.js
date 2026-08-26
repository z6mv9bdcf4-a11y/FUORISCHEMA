import { supabase } from './supabase.js';

(() => {
  'use strict';
  if (window.__FSOCIAL_PROFILE_VIEWER__) return;
  window.__FSOCIAL_PROFILE_VIEWER__ = true;
  if (!location.pathname.toLowerCase().endsWith('/area-personale.html')) return;

  const esc = v => { const d = document.createElement('div'); d.textContent = v ?? ''; return d.innerHTML; };

  const css = document.createElement('style');
  css.textContent = `
    #fspv{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.78);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:none;align-items:center;justify-content:center;padding:18px}
    #fspv.open{display:flex}
    .fspv-box{width:min(620px,100%);max-height:90vh;overflow:auto;background:#0b0b0e;border:1px solid #26262b;border-radius:20px;box-shadow:0 30px 100px #000;padding:18px}
    .fspv-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
    .fspv-head strong{font:900 15px Syne;color:#fff}
    .fspv-close{border:1px solid #29292e;background:#151518;color:#aaa;width:38px;height:38px;border-radius:50%;font-size:20px}
    .fspv-media{width:100%;max-height:58vh;object-fit:contain;background:#050505;border-radius:14px}
    .fspv-copy{color:#ddd;font-size:13px;line-height:1.5;white-space:pre-wrap;margin-top:12px}
    .fspv-meta{display:flex;gap:18px;margin-top:13px}
    .fspv-meta button{border:0;background:none;color:#aaa;font-weight:800;font-size:12px}
    .fspv-meta button.liked{color:#ff4d00}
    .fspv-comments{display:grid;gap:8px;margin-top:14px}
    .fspv-comment{padding:10px;border:1px solid #202025;border-radius:12px;background:#111116}
    .fspv-comment b{font-size:10px;color:#fff}
    .fspv-comment span{display:block;color:#aaa;font-size:11px;margin-top:3px}
    @media(max-width:650px){#fspv{align-items:flex-end;padding:0}.fspv-box{max-height:90vh;border-radius:20px 20px 0 0;border-bottom:0}}
  `;
  document.head.appendChild(css);

  const root = document.createElement('div');
  root.id = 'fspv';
  root.innerHTML = '<section class="fspv-box"><div class="fspv-head"><strong>POST FSOCIAL</strong><button class="fspv-close" type="button">×</button></div><div class="fspv-body"></div></section>';
  document.body.appendChild(root);
  root.querySelector('.fspv-close').onclick = () => root.classList.remove('open');
  root.onclick = e => { if (e.target === root) root.classList.remove('open'); };

  let opening = false;

  async function resolvePostFromTile(tile) {
    const directId = tile.dataset.postId || tile.getAttribute('data-id') || tile.id?.match(/\d+/)?.[0];
    if (directId) {
      const { data } = await supabase.from('posts').select('id').eq('id', Number(directId)).maybeSingle();
      if (data?.id) return data.id;
    }

    const img = tile.querySelector('img');
    const imageUrl = img?.currentSrc || img?.src || '';
    if (!imageUrl) return null;

    const { data } = await supabase
      .from('posts')
      .select('id')
      .eq('image_url', imageUrl)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data?.id || null;
  }

  async function openPost(id) {
    const { data: p, error } = await supabase
      .from('posts')
      .select('id,user_id,content,image_url,created_at,profiles(username,full_name,avatar_url)')
      .eq('id', id)
      .maybeSingle();

    if (error || !p) {
      window.showToast?.('Post non disponibile.');
      return;
    }

    const [{ count: likes }, { count: comments }, { data: rows }, { data: likeRows }, { data: saveRows }] = await Promise.all([
      supabase.from('post_likes').select('id', { count: 'exact', head: true }).eq('post_id', id),
      supabase.from('post_comments').select('id', { count: 'exact', head: true }).eq('post_id', id),
      supabase.from('post_comments').select('content,user_id').eq('post_id', id).order('created_at', { ascending: true }),
      supabase.from('post_likes').select('user_id').eq('post_id', id),
      supabase.from('post_saves').select('id').eq('post_id', id).eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
    ]);

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    const liked = !!likeRows?.some(x => x.user_id === user?.id);
    const saved = !!saveRows?.length;
    const profile = p.profiles || {};
    const author = profile.full_name || profile.username || 'MEMBRO FUORISCHEMA';
    const username = profile.username ? '@' + profile.username : '';

    const b = root.querySelector('.fspv-body');
    b.innerHTML = `
      ${p.image_url ? `<img class="fspv-media" src="${esc(p.image_url)}" alt="Post">` : ''}
      <div style="margin-top:13px">
        <strong style="font:800 12px Inter;color:#fff">${esc(author)}</strong>
        ${username ? `<div style="margin-top:3px;color:#777;font:500 10px Inter">${esc(username)}</div>` : ''}
      </div>
      ${p.content ? `<div class="fspv-copy">${esc(p.content)}</div>` : ''}
      <div class="fspv-meta">
        <button data-like class="${liked ? 'liked' : ''}" type="button">♥ ${likes || 0}</button>
        <button data-comments type="button">💬 ${comments || 0}</button>
        <button data-save class="${saved ? 'liked' : ''}" type="button">${saved ? 'SALVATO' : 'SALVA'}</button>
        <button data-battle type="button">⚔ BATTLE</button>
      </div>
      <div class="fspv-comments">
        ${(rows || []).map(c => `<div class="fspv-comment"><b>${esc(c.profiles?.full_name || c.profiles?.username || 'UTENTE')}</b><span>${esc(c.content || '')}</span></div>`).join('') || '<div class="fspv-comment" style="color:#666">Nessun commento.</div>'}
      </div>
    `;

    root.classList.add('open');

    b.querySelector('[data-like]').onclick = async () => {
      if (!user) return;
      const existing = likeRows?.find(x => x.user_id === user.id);
      if (existing) await supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', user.id);
      else await supabase.from('post_likes').insert({ post_id: id, user_id: user.id });
      openPost(id);
    };

    b.querySelector('[data-save]').onclick = async e => {
      if (!user) return;

      const button = e.currentTarget;

      const existing = await supabase
        .from('post_saves')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing.data) {
        await supabase
          .from('post_saves')
          .delete()
          .eq('id', existing.data.id);

        button.textContent = 'SALVA';
        button.classList.remove('liked');
      } else {
        await supabase
          .from('post_saves')
          .insert({ post_id: id, user_id: user.id });

        button.textContent = 'SALVATO';
        button.classList.add('liked');
      }
    };

    b.querySelector('[data-comments]').onclick = () => {
      window.showToast?.('I commenti sono mostrati qui sotto.');
      b.querySelector('.fspv-comments')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    b.querySelector('[data-battle]').onclick = () => {
      root.classList.remove('open');
      window.openBattleChallengeModal?.({ challengedUserId: p.user_id, challengedAuthor: { username: profile.username, name: profile.full_name } });
    };
  }

  async function handleTile(tile, event) {
    if (!tile || opening) return;
    opening = true;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    try {
      const id = await resolvePostFromTile(tile);
      if (id) await openPost(id);
      else window.showToast?.('Post non disponibile.');
    } finally {
      opening = false;
    }
  }

  // Capture phase is intentional: it prevents legacy/inline tile handlers from
  // navigating directly to the image before the FSOCIAL viewer gets the click.
  document.addEventListener('click', event => {
    const tile = event.target.closest?.('.post-tile');
    if (!tile) return;
    handleTile(tile, event);
  }, true);

  function mount() {
    document.querySelectorAll('.post-tile').forEach(tile => {
      tile.dataset.fspv = '1';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
  new MutationObserver(mount).observe(document.body, { childList: true, subtree: true });
})();
