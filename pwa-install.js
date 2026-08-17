/* ==========================================================================
   FUORISCHEMA — PWA INSTALLATION SYSTEM
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'fuorischema_pwa_dismissed';
  let deferredPrompt = null;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  // Se FUORISCHEMA è già installato, nasconde qualsiasi elemento
  // dedicato all'installazione.
  function hideInstallUIIfStandalone() {
    if (!isStandalone) return;

    const selectors = [
      '#pwaInstallCard',
      '#pwaInstallButton',
      '#pwaInstallLauncher',
      '.pwa-install-launcher',
      '.pwa-install-button',
      '[data-pwa-install]'
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        element.style.display = 'none';
        element.setAttribute('aria-hidden', 'true');
      });
    });

    // Nasconde anche eventuali pulsanti/link con scritto "SCARICA L'APP".
    document.querySelectorAll('a, button, [role="button"]').forEach((element) => {
      const text = (element.textContent || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

      if (
        text === "SCARICA L'APP" ||
        text === "SCARICA L’APP" ||
        text.includes("SCARICA L'APP") ||
        text.includes("SCARICA L’APP")
      ) {
        element.style.display = 'none';
        element.setAttribute('aria-hidden', 'true');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {

    // Se è già installato, non mostrare il sistema di installazione.
    hideInstallUIIfStandalone();

    if (isStandalone) return;

    const installCard = document.getElementById('pwaInstallCard');
    const closeBtn = document.getElementById('pwaInstallClose');
    const actionBtn = document.getElementById('pwaInstallAction');
    const iosSteps = document.getElementById('pwaIosSteps');
    const subtext = document.getElementById('pwaInstallSubtext');

    if (!installCard) return;

    const isDismissed = localStorage.getItem(STORAGE_KEY);

    // Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('./service-worker.js')
        .catch(err => {
          console.warn('PWA SW Registration error:', err);
        });
    }

    // iPhone / iPad
    if (isIos) {

      if (iosSteps) {
        iosSteps.style.display = 'block';
      }

      if (actionBtn) {
        actionBtn.style.display = 'none';
      }

      if (subtext) {
        subtext.textContent =
          'Segui i passaggi per installare l\'app sul tuo iPhone.';
      }

      if (!isDismissed) {
        showBanner();
      }
    }

    // Android / Chrome / Desktop
    window.addEventListener('beforeinstallprompt', (e) => {

      e.preventDefault();

      deferredPrompt = e;

      if (iosSteps) {
        iosSteps.style.display = 'none';
      }

      if (actionBtn) {
        actionBtn.style.display = 'inline-flex';
        actionBtn.textContent = 'INSTALLA ORA →';
      }

      if (subtext) {
        subtext.textContent =
          'Aggiungi l\'app sulla tua schermata Home per un accesso rapido.';
      }

      if (!isDismissed) {
        showBanner();
      }
    });

    // Pulsante INSTALLA ORA
    if (actionBtn) {

      actionBtn.addEventListener('click', async () => {

        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;

        deferredPrompt = null;

        if (outcome === 'accepted') {

          hideBanner();

          localStorage.setItem(
            STORAGE_KEY,
            'true'
          );
        }
      });
    }

    // X della card
    if (closeBtn) {

      closeBtn.addEventListener('click', () => {

        hideBanner();

        localStorage.setItem(
          STORAGE_KEY,
          'true'
        );
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

    // App installata
    window.addEventListener('appinstalled', () => {

      hideBanner();

      localStorage.setItem(
        STORAGE_KEY,
        'true'
      );

      hideInstallUIIfStandalone();
    });

  });

})();