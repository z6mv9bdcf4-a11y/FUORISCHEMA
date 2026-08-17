/* ==========================================================================
   FUORISCHEMA — PWA INSTALLATION SYSTEM
   Gestione PWA per iOS/Safari, Android/Chrome e Desktop.
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'fuorischema_pwa_dismissed';
  let deferredPrompt = null;

  // Verifica se il sito è già avviato in modalità PWA Standalone
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // Riconoscimento ambiente iOS / Safari
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  document.addEventListener('DOMContentLoaded', () => {
    // Se è già installata o l'utente ha già chiuso la card, esce
    if (isStandalone) return;

    const installCard = document.getElementById('pwaInstallCard');
    const closeBtn = document.getElementById('pwaInstallClose');
    const actionBtn = document.getElementById('pwaInstallAction');
    const iosSteps = document.getElementById('pwaIosSteps');
    const subtext = document.getElementById('pwaInstallSubtext');

    if (!installCard) return;

    // Se l'utente ha precedentemente chiuso il banner, non mostrarlo in automatico
    const isDismissed = localStorage.getItem(STORAGE_KEY);

    // Registrazione del Service Worker (conservativo)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(err => {
        console.warn('PWA SW Registration error:', err);
      });
    }

    // Configurazione interfaccia per iOS
    if (isIos) {
      if (iosSteps) iosSteps.style.display = 'block';
      if (actionBtn) actionBtn.style.display = 'none';
      if (subtext) subtext.textContent = 'Segui i passaggi per installare l\'app sul tuo iPhone.';
      if (!isDismissed) showBanner();
    }

    // Gestione Evento Native Prompt per Android / Chrome Desktop
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      if (iosSteps) iosSteps.style.display = 'none';
      if (actionBtn) {
        actionBtn.style.display = 'inline-flex';
        actionBtn.textContent = 'INSTALLA ORA →';
      }
      if (subtext) subtext.textContent = 'Aggiungi l\'app sulla tua schermata Home per un accesso rapido.';

      if (!isDismissed) showBanner();
    });

    // Azione del Pulsante Installa (Android/Chrome)
    if (actionBtn) {
      actionBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (outcome === 'accepted') {
          hideBanner();
        }
      });
    }

    // Chiusura Banner e Salvataggio Preferenza
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        hideBanner();
        localStorage.setItem(STORAGE_KEY, 'true');
      });
    }

    function showBanner() {
      setTimeout(() => {
        installCard.classList.add('visible');
      }, 2000);
    }

    function hideBanner() {
      installCard.classList.remove('visible');
    }

    // Nascondi il banner quando l'app viene installata con successo
    window.addEventListener('appinstalled', () => {
      hideBanner();
      localStorage.setItem(STORAGE_KEY, 'true');
    });
  });
})();