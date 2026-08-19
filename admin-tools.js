import { supabase } from './supabase.js';

const OWNER_EMAILS = new Set([
  'gennyesposito2000@icloud.com',
  'vincenzo.castaldo11@icloud.com'
]);

async function initOwnerTools() {
  if (window.__FUORISCHEMA_OWNER_TOOLS__) return;
  window.__FUORISCHEMA_OWNER_TOOLS__ = true;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !OWNER_EMAILS.has(String(user.email || '').toLowerCase())) return;

  const sideMenu = document.querySelector('.side-menu');
  if (!sideMenu) return;

  if (sideMenu.querySelector('[data-owner-tools]')) return;

  const box = document.createElement('div');
  box.setAttribute('data-owner-tools', 'true');
  box.className = 'menu-feature';
  box.style.marginBottom = '42px';
  box.innerHTML = `
    <div class="menu-feature-top">
      <span class="menu-feature-label">OWNER / MODERAZIONE</span>
      <span class="menu-feature-arrow">↗</span>
    </div>
    <a href="fsocial-moderazione.html" style="display:block;color:inherit;text-decoration:none">
      <span class="menu-feature-title">CENTRO MODERAZIONE</span>
      <span class="menu-feature-text">Segnalazioni, controlli e strumenti riservati ai proprietari di FUORISCHEMA.</span>
    </a>
    <button type="button" data-delete-all-posts style="
      width:100%;margin-top:18px;padding:12px 14px;border:1px solid rgba(255,59,48,.45);
      background:#120b0b;color:#ff6b61;font:800 10px Inter,Arial,sans-serif;
      letter-spacing:1.4px;text-transform:uppercase;cursor:pointer;
    ">ELIMINA TUTTI I POST</button>
    <div data-delete-status style="margin-top:8px;color:#666;font:700 9px Inter,Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;min-height:12px"></div>
  `;

  const top = sideMenu.querySelector('.menu-top');
  const firstSection = sideMenu.querySelector('.menu-section');
  if (firstSection) sideMenu.insertBefore(box, firstSection);
  else if (top?.nextSibling) sideMenu.insertBefore(box, top.nextSibling);
  else sideMenu.appendChild(box);

  const button = box.querySelector('[data-delete-all-posts]');
  const status = box.querySelector('[data-delete-status]');

  button.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const first = confirm('ATTENZIONE: questa operazione eliminerà TUTTI i post FSocial. Vuoi continuare?');
    if (!first) return;
    const second = confirm('CONFERMA FINALE: tutti i post verranno rimossi e l’operazione non può essere annullata. Procedere?');
    if (!second) return;

    button.disabled = true;
    button.style.opacity = '.5';
    status.textContent = 'ELIMINAZIONE IN CORSO...';

    const { data, error } = await supabase.rpc('admin_delete_all_posts');
    if (error) {
      console.error(error);
      status.textContent = 'ERRORE: ' + error.message;
      button.disabled = false;
      button.style.opacity = '1';
      return;
    }

    status.textContent = `${Number(data || 0)} POST ELIMINATI`;
    setTimeout(() => window.location.reload(), 700);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOwnerTools, { once: true });
} else {
  initOwnerTools();
}
