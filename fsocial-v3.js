import { supabase } from './supabase.js';

(() => {
  'use strict';
  if (window.__FSOCIAL_V3__) return;
  window.__FSOCIAL_V3__ = true;
  if (!window.location.pathname.toLowerCase().endsWith('/fsocial.html')) return;

  const state = {
    user: null,
    products: {},
    selectedProduct: null,
    saved: new Set(),
    following: new Set(),
    mode: 'all'
  };

  const esc = value => {
    const d = document.createElement('div');
    d.textContent = value ?? '';
    return d.innerHTML;
  };

  const getProductUrl = id => `prodotto.html?id=${encodeURIComponent(id)}`;

  function ensureStyle() {
    if (document.getElementById('fsocialV3Styles')) return;
    const style = document.createElement('style');
    style.id = 'fsocialV3Styles';
    style.textContent = `
      .fs-v3-product-chip{display:inline-flex;align-items:center;gap:7px;margin-top:9px;padding:7px 10px;border:1px solid rgba(255,77,0,.24);border-radius:999px;background:rgba(255,77,0,.07);color:#fff;font:800 9px Inter,Arial,sans-serif;letter-spacing:.55px;text-transform:uppercase;cursor:pointer;transition:transform .18s cubic-bezier(.16,1,.3,1),border-color .18s ease,background .18s ease}
      .fs-v3-product-chip:hover{border-color:rgba(255,77,0,.55);background:rgba(255,77,0,.12)}
      .fs-v3-product-chip:active{transform:scale(.97)}
      .fs-v3-product-card{display:flex;align-items:center;gap:12px;margin:0 14px 14px;padding:11px 12px;border:1px solid rgba(255,77,0,.23);border-radius:14px;background:linear-gradient(135deg,rgba(255,77,0,.10),rgba(255,255,255,.025));color:#fff;text-decoration:none;transition:transform .18s cubic-bezier(.16,1,.3,1),border-color .18s ease}
      .fs-v3-product-card:hover{border-color:rgba(255,77,0,.52);transform:translateY(-1px)}
      .fs-v3-product-card:active{transform:scale(.985)}
      .fs-v3-product-card img{width:54px;height:54px;flex:0 0 54px;object-fit:cover;border-radius:10px;background:#111}
      .fs-v3-product-copy{min-width:0;flex:1}.fs-v3-product-kicker{font-size:8px;font-weight:900;letter-spacing:1.5px;color:#ff4d00;text-transform:uppercase}.fs-v3-product-name{margin-top:3px;font-size:12px;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fs-v3-product-brand{margin-top:3px;color:#8d8d94;font-size:9px;font-weight:700}.fs-v3-product-arrow{font-size:17px;color:#ff4d00}
      .fs-v3-follow{min-height:30px;padding:0 10px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.035);color:#fff;font:800 8px Inter,Arial,sans-serif;letter-spacing:.8px;text-transform:uppercase;transition:all .18s cubic-bezier(.16,1,.3,1)}
      .fs-v3-follow.is-following{background:#ff4d00;border-color:#ff4d00;color:#050505}
      .fs-v3-save{margin-left:auto!important;width:36px!important;height:36px!important;padding:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;color:#8d8d94!important;font-size:17px!important;border-radius:50%!important}
      .fs-v3-save.is-saved{color:#ff4d00!important;background:rgba(255,77,0,.08)!important}
      .fs-v3-mode{display:flex;gap:7px;margin:-16px 0 18px;padding:3px;border:1px solid rgba(255,255,255,.10);border-radius:999px;background:rgba(8,8,10,.42);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
      .fs-v3-mode button{flex:1;min-height:31px;border-radius:999px;color:#777;font:800 8px Inter,Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;transition:all .18s ease}.fs-v3-mode button.active{background:#fff;color:#050505}
      .fs-v3-picker-backdrop,.fs-v3-saved-backdrop{position:fixed;inset:0;z-index:100002;background:rgba(0,0,0,.66);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:none;align-items:flex-end;justify-content:center;padding:0}
      .fs-v3-picker-backdrop.is-open,.fs-v3-saved-backdrop.is-open{display:flex}
      .fs-v3-panel{width:min(560px,100%);max-height:min(82vh,760px);overflow:hidden;border:1px solid rgba(255,255,255,.10);border-bottom:0;border-radius:24px 24px 0 0;background:rgba(10,10,12,.97);box-shadow:0 -30px 100px rgba(0,0,0,.55);animation:fsV3Up .32s cubic-bezier(.16,1,.3,1)}
      @keyframes fsV3Up{from{transform:translateY(25px);opacity:.3}to{transform:translateY(0);opacity:1}}
      .fs-v3-panel-head{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid rgba(255,255,255,.08)}.fs-v3-panel-head strong{font:900 15px Syne,Arial;color:#fff;letter-spacing:-.2px}.fs-v3-panel-head button{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.08);color:#aaa;background:rgba(255,255,255,.035)}
      .fs-v3-panel-body{padding:14px 16px 24px;overflow:auto;max-height:calc(min(82vh,760px) - 70px)}
      .fs-v3-search{width:100%;height:44px;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:#111114;color:#fff;padding:0 13px;outline:0}.fs-v3-search:focus{border-color:rgba(255,77,0,.45)}
      .fs-v3-product-list{display:grid;grid-template-columns:1fr;gap:8px;margin-top:10px}.fs-v3-product-option{display:flex;align-items:center;gap:11px;width:100%;padding:9px;border:1px solid rgba(255,255,255,.06);border-radius:13px;background:rgba(255,255,255,.025);color:#fff;text-align:left;transition:all .16s ease}.fs-v3-product-option:hover{border-color:rgba(255,77,0,.35);background:rgba(255,77,0,.06)}.fs-v3-product-option img{width:48px;height:48px;object-fit:cover;border-radius:9px;background:#111}.fs-v3-product-option-copy{min-width:0;flex:1}.fs-v3-product-option-copy strong{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fs-v3-product-option-copy span{display:block;color:#777;font-size:9px;margin-top:3px}.fs-v3-product-option-check{color:#ff4d00;font-size:16px;opacity:.2}.fs-v3-product-option.is-selected{border-color:rgba(255,77,0,.55);background:rgba(255,77,0,.09)}.fs-v3-product-option.is-selected .fs-v3-product-option-check{opacity:1}
      .fs-v3-selected{display:flex;align-items:center;gap:9px;margin:10px 0 0;padding:8px 10px;border:1px solid rgba(255,77,0,.22);border-radius:12px;background:rgba(255,77,0,.06)}.fs-v3-selected img{width:36px;height:36px;object-fit:cover;border-radius:7px}.fs-v3-selected-copy{min-width:0;flex:1}.fs-v3-selected-copy strong{display:block;font-size:10px}.fs-v3-selected-copy span{display:block;color:#777;font-size:8px;margin-top:2px}.fs-v3-selected button{color:#ff8060;font-size:12px}
      .fs-v3-saved-list{display:grid;gap:9px}.fs-v3-saved-item{display:flex;align-items:center;gap:11px;padding:10px;border:1px solid rgba(255,255,255,.07);border-radius:13px;background:rgba(255,255,255,.025);color:#fff}.fs-v3-saved-item img{width:52px;height:52px;object-fit:cover;border-radius:9px;background:#111}.fs-v3-saved-copy{min-width:0;flex:1}.fs-v3-saved-copy strong{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fs-v3-saved-copy span{display:block;color:#777;font-size:9px;margin-top:3px}.fs-v3-empty{padding:30px 12px;text-align:center;color:#666;font-size:10px;letter-spacing:.8px}
      .fs-v3-create-product{display:inline-flex;align-items:center;gap:6px;padding:7px 11px;border:1px solid rgba(255,77,0,.24);border-radius:999px;background:rgba(255,77,0,.06);color:#ff6a32;font:800 9px Inter,Arial,sans-serif;letter-spacing:.55px;text-transform:uppercase;cursor:pointer}.fs-v3-create-product.is-selected{background:#ff4d00;color:#050505;border-color:#ff4d00}
      @media(min-width:700px){.fs-v3-picker-backdrop,.fs-v3-saved-backdrop{align-items:center;padding:24px}.fs-v3-panel{border-bottom:1px solid rgba(255,255,255,.10);border-radius:24px}}
    `;
    document.head.appendChild(style);
  }

  async function initProducts(){
    try {
      if (!window.FUORISCHEMA_PRODUCTS) await import('./products.js');
      state.products = window.FUORISCHEMA_PRODUCTS || {};
    } catch (error) {
      console.warn('FSocial product catalog unavailable:', error);
    }
  }

  async function initUserState(){
    const { data } = await supabase.auth.getUser();
    state.user = data?.user || null;
    if (!state.user) return;
    const [savedRes, followingRes] = await Promise.all([
      supabase.from('post_saves').select('post_id').eq('user_id', state.user.id),
      supabase.from('user_follows').select('following_id').eq('follower_id', state.user.id)
    ]);
    state.saved = new Set((savedRes.data || []).map(row => String(row.post_id)));
    state.following = new Set((followingRes.data || []).map(row => row.following_id));
  }

  function createPanel(className, title, bodyHtml) {
    const backdrop = document.createElement('div');
    backdrop.className = className;
    backdrop.innerHTML = `<section class="fs-v3-panel" role="dialog" aria-modal="true"><header class="fs-v3-panel-head"><strong>${esc(title)}</strong><button type="button" data-close>×</button></header><div class="fs-v3-panel-body">${bodyHtml}</div></section>`;
    backdrop.addEventListener('click', e => { if (e.target === backdrop || e.target.closest('[data-close]')) backdrop.classList.remove('is-open'); });
    document.body.appendChild(backdrop);
    return backdrop;
  }

  let productPicker = null;
  function openProductPicker() {
    if (!productPicker) {
      productPicker = createPanel('fs-v3-picker-backdrop', 'TAGGA PRODOTTO', '<input class="fs-v3-search" placeholder="Cerca prodotto, brand o categoria…"><div class="fs-v3-product-list"></div>');
      const input = productPicker.querySelector('.fs-v3-search');
      input.addEventListener('input', () => renderProductOptions(input.value));
    }
    productPicker.classList.add('is-open');
    renderProductOptions(productPicker.querySelector('.fs-v3-search').value || '');
    productPicker.querySelector('.fs-v3-search').focus();
  }

  function renderProductOptions(query='') {
    if (!productPicker) return;
    const list = productPicker.querySelector('.fs-v3-product-list');
    const q = query.trim().toLowerCase();
    const items = Object.values(state.products).filter(p => !q || `${p.name} ${p.brand} ${p.category} ${p.type}`.toLowerCase().includes(q)).slice(0, 30);
    list.innerHTML = items.length ? items.map(p => `<button type="button" class="fs-v3-product-option ${state.selectedProduct?.id === p.id ? 'is-selected' : ''}" data-product-id="${esc(p.id)}"><img src="${esc(p.image)}" alt=""><span class="fs-v3-product-option-copy"><strong>${esc(p.name)}</strong><span>${esc(p.brand)} · ${esc(p.category)}</span></span><span class="fs-v3-product-option-check">✓</span></button>`).join('') : '<div class="fs-v3-empty">NESSUN PRODOTTO</div>';
    list.querySelectorAll('[data-product-id]').forEach(button => button.addEventListener('click', () => {
      const product = state.products[button.dataset.productId];
      state.selectedProduct = state.selectedProduct?.id === product?.id ? null : product;
      updateCreateProductUI();
      productPicker.classList.remove('is-open');
    }));
  }

  function updateCreateProductUI() {
    const tools = document.querySelector('.create-tools');
    if (!tools) return;
    let chip = document.getElementById('fsV3CreateProduct');
    if (!chip) {
      chip = document.createElement('button');
      chip.id = 'fsV3CreateProduct';
      chip.type = 'button';
      chip.className = 'fs-v3-create-product';
      chip.addEventListener('click', openProductPicker);
      tools.appendChild(chip);
    }
    if (state.selectedProduct) {
      chip.classList.add('is-selected');
      chip.textContent = `✓ ${state.selectedProduct.brand} · ${state.selectedProduct.name}`;
      chip.title = 'Clicca per cambiare prodotto';
    } else {
      chip.classList.remove('is-selected');
      chip.textContent = '＋ PRODOTTO';
      chip.title = 'Collega un prodotto FUORISCHEMA';
    }
  }

  function addProductCard(article, product) {
    if (!product || article.querySelector('.fs-v3-product-card')) return;
    const anchor = document.createElement('a');
    anchor.className = 'fs-v3-product-card';
    anchor.href = getProductUrl(product.id);
    anchor.innerHTML = `<img src="${esc(product.image)}" alt=""><span class="fs-v3-product-copy"><span class="fs-v3-product-kicker">SHOP THIS PRODUCT</span><strong class="fs-v3-product-name">${esc(product.name)}</strong><span class="fs-v3-product-brand">${esc(product.brand)} · ${esc(product.category)}</span></span><span class="fs-v3-product-arrow">→</span>`;
    const comments = article.querySelector('.comments');
    if (comments) article.insertBefore(anchor, comments); else article.appendChild(anchor);
  }

  async function hydratePostCommerce() {
    const articles = [...document.querySelectorAll('#feed .post-card')];
    if (!articles.length) return;
    const postIds = articles.map(a => a.querySelector('[id^="comments-"]')?.id?.replace('comments-', '')).filter(Boolean);
    if (!postIds.length) return;
    const { data } = await supabase.from('posts').select('id,user_id,product_slug').in('id', postIds);
    const byId = new Map((data || []).map(row => [String(row.id), row]));
    articles.forEach(article => {
      const id = article.querySelector('[id^="comments-"]')?.id?.replace('comments-', '');
      const row = byId.get(String(id));
      if (!row) return;
      article.dataset.userId = row.user_id;
      if (row.product_slug && state.products[row.product_slug]) addProductCard(article, state.products[row.product_slug]);
      addFollowButton(article, row.user_id);
      addSaveButton(article, row.id);
    });
    applyFeedMode();
  }

  function addFollowButton(article, userId) {
    if (!state.user || !userId || userId === state.user.id || article.querySelector('.fs-v3-follow')) return;
    const header = article.querySelector('.post-header');
    if (!header) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `fs-v3-follow ${state.following.has(userId) ? 'is-following' : ''}`;
    button.textContent = state.following.has(userId) ? 'SEGUITO' : 'SEGUI';
    button.addEventListener('click', async e => {
      e.preventDefault(); e.stopPropagation();
      const following = state.following.has(userId);
      button.disabled = true;
      const result = following
        ? await supabase.from('user_follows').delete().eq('follower_id', state.user.id).eq('following_id', userId)
        : await supabase.from('user_follows').insert({ follower_id: state.user.id, following_id: userId });
      button.disabled = false;
      if (result.error) return window.showToast?.('Errore nel follow.');
      if (following) state.following.delete(userId); else state.following.add(userId);
      button.classList.toggle('is-following', !following);
      button.textContent = !following ? 'SEGUITO' : 'SEGUI';
      applyFeedMode();
    });
    const date = header.querySelector('.post-date');
    header.insertBefore(button, date || null);
  }

  function addSaveButton(article, postId) {
    if (article.querySelector('.fs-v3-save')) return;
    const actions = article.querySelector('.post-actions');
    if (!actions) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `action-button fs-v3-save ${state.saved.has(String(postId)) ? 'is-saved' : ''}`;
    button.setAttribute('aria-label', 'Salva post');
    button.setAttribute('aria-pressed', String(state.saved.has(String(postId))));
    button.innerHTML = state.saved.has(String(postId)) ? '★' : '☆';
    button.addEventListener('click', async e => {
      e.preventDefault(); e.stopPropagation();
      if (!state.user) return window.showToast?.('Devi essere loggato.');
      const key = String(postId);
      const wasSaved = state.saved.has(key);
      state.saved[wasSaved ? 'delete' : 'add'](key);
      button.classList.toggle('is-saved', !wasSaved);
      button.setAttribute('aria-pressed', String(!wasSaved));
      button.innerHTML = !wasSaved ? '★' : '☆';
      const result = wasSaved
        ? await supabase.from('post_saves').delete().eq('post_id', postId).eq('user_id', state.user.id)
        : await supabase.from('post_saves').insert({ post_id: postId, user_id: state.user.id });
      if (result.error) {
        state.saved[wasSaved ? 'add' : 'delete'](key);
        button.classList.toggle('is-saved', wasSaved);
        button.setAttribute('aria-pressed', String(wasSaved));
        button.innerHTML = wasSaved ? '★' : '☆';
        window.showToast?.('Salvataggio non riuscito.');
      }
    });
    actions.appendChild(button);
  }

  function addModeSwitcher() {
    if (document.getElementById('fsV3Mode')) return;
    const tabs = document.querySelector('.feed-tabs');
    if (!tabs) return;
    const mode = document.createElement('div');
    mode.id = 'fsV3Mode';
    mode.className = 'fs-v3-mode';
    mode.innerHTML = `<button type="button" class="active" data-mode="all">TUTTI</button><button type="button" data-mode="following">SEGUITI</button><button type="button" data-mode="saved">SALVATI</button>`;
    tabs.after(mode);
    mode.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
      state.mode = button.dataset.mode;
      mode.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b === button));
      if (state.mode === 'saved') openSavedPanel();
      applyFeedMode();
    }));
  }

  function applyFeedMode() {
    const articles = document.querySelectorAll('#feed .post-card');
    articles.forEach(article => {
      const userId = article.dataset.userId;
      const postId = article.querySelector('[id^="comments-"]')?.id?.replace('comments-', '');
      let visible = true;
      if (state.mode === 'following') visible = Boolean(userId && state.following.has(userId));
      if (state.mode === 'saved') visible = Boolean(postId && state.saved.has(String(postId)));
      article.style.display = visible ? '' : 'none';
    });
  }

  let savedPanel = null;
  function openSavedPanel() {
    if (!savedPanel) {
      savedPanel = createPanel('fs-v3-saved-backdrop', 'SALVATI', '<div class="fs-v3-saved-list"></div>');
    }
    savedPanel.classList.add('is-open');
    renderSavedPanel();
  }

  async function renderSavedPanel() {
    if (!savedPanel) return;
    const list = savedPanel.querySelector('.fs-v3-saved-list');
    const ids = [...state.saved].slice(0, 60);
    if (!ids.length) { list.innerHTML = '<div class="fs-v3-empty">NESSUN POST SALVATO</div>'; return; }
    const { data } = await supabase.from('posts').select('id,user_id,content,image_url,product_slug,created_at').in('id', ids).order('created_at', { ascending: false });
    if (!data?.length) { list.innerHTML = '<div class="fs-v3-empty">NESSUN POST SALVATO</div>'; return; }
    const rows = await Promise.all(data.map(async post => {
      const { data: profile } = await supabase.from('profiles').select('username,full_name,avatar_url').eq('id', post.user_id).maybeSingle();
      return { post, profile };
    }));
    list.innerHTML = rows.map(({post, profile}) => `<a class="fs-v3-saved-item" href="#post-${esc(post.id)}"><img src="${esc(post.image_url || state.products[post.product_slug]?.image || 'images/icon-192.png')}" alt=""><span class="fs-v3-saved-copy"><strong>${esc(profile?.username ? '@'+profile.username : profile?.full_name || 'POST')}</strong><span>${esc(post.content || state.products[post.product_slug]?.name || 'Contenuto FUORISCHEMA')}</span></span><span>→</span></a>`).join('');
    list.querySelectorAll('a').forEach(link => link.addEventListener('click', () => savedPanel.classList.remove('is-open')));
  }

  async function publishWithProduct(button) {
    if (!state.user) return window.showToast?.('Devi essere loggato.');
    const contentEl = document.getElementById('postContent');
    const imageInput = document.getElementById('postImageInput');
    const preview = document.getElementById('postImagePreview');
    const previewImage = document.getElementById('previewImage');
    const status = document.getElementById('postStatus');
    const file = imageInput?.files?.[0] || null;
    const content = contentEl?.value.trim() || '';
    if (!content && !file) return window.showToast?.('Scrivi qualcosa o aggiungi una foto.');

    button.disabled = true;
    if (status) status.textContent = 'Pubblicazione...';
    let uploadedPath = null;
    try {
      let imageUrl = null;
      if (file) {
        const image = await new Promise((resolve, reject) => {
          const img = new Image(); const url = URL.createObjectURL(file);
          img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
          img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Impossibile leggere la foto.')); };
          img.src = url;
        });
        const maxSize = 1600;
        const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Impossibile preparare la foto.');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .80));
        if (!blob) throw new Error('Impossibile comprimere la foto.');
        const id = crypto.randomUUID();
        uploadedPath = `${state.user.id}/${id}.jpg`;
        const upload = await supabase.storage.from('post-images').upload(uploadedPath, blob, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' });
        if (upload.error) throw upload.error;
        imageUrl = supabase.storage.from('post-images').getPublicUrl(uploadedPath).data.publicUrl;
      }
      const postData = { user_id: state.user.id, content };
      if (imageUrl) postData.image_url = imageUrl;
      if (state.selectedProduct?.id) postData.product_slug = state.selectedProduct.id;
      const result = await supabase.from('posts').insert(postData);
      if (result.error) throw result.error;

      if (contentEl) contentEl.value = '';
      if (imageInput) imageInput.value = '';
      if (previewImage) previewImage.src = '';
      if (preview) preview.classList.remove('active');
      state.selectedProduct = null;
      updateCreateProductUI();
      if (status) status.textContent = 'Pubblicato.';
      window.showToast?.('Post pubblicato 🔥');
      document.getElementById('tabForYou')?.click();
    } catch (error) {
      if (uploadedPath) await supabase.storage.from('post-images').remove([uploadedPath]).catch(() => {});
      console.error('FSocial V3 publish error:', error);
      if (status) status.textContent = 'Errore';
      window.showToast?.(error?.message || 'Errore durante la pubblicazione.');
    } finally {
      button.disabled = false;
    }
  }

  function installPublishOverride() {
    const button = document.getElementById('publishButton');
    if (!button || button.dataset.fsV3Bound) return;
    button.dataset.fsV3Bound = '1';
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      publishWithProduct(button);
    }, true);
  }

  function installProductTagButton() {
    updateCreateProductUI();
  }

  function installTopbarSaved() {
    const actions = document.querySelector('.topbar-actions');
    if (!actions || document.getElementById('fsV3SavedTop')) return;
    const button = document.createElement('button');
    button.id = 'fsV3SavedTop'; button.type = 'button'; button.className = 'top-btn'; button.textContent = 'SALVATI';
    button.addEventListener('click', openSavedPanel);
    actions.insertBefore(button, actions.firstChild);
  }

  function watchFeed() {
    const feed = document.getElementById('feed');
    if (!feed) return;
    const observer = new MutationObserver(() => {
      clearTimeout(watchFeed.timer);
      watchFeed.timer = setTimeout(hydratePostCommerce, 90);
    });
    observer.observe(feed, { childList: true, subtree: true });
    setTimeout(hydratePostCommerce, 300);
  }

  function init() {
    ensureStyle();
    initProducts().then(() => {
      initUserState().then(() => {
        addModeSwitcher();
        installPublishOverride();
        installProductTagButton();
        installTopbarSaved();
        watchFeed();
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
