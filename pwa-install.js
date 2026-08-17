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

  document.addEventListener('DOMContentLoaded', () => {

    const installCard = document.getElementById('pwaInstallCard');
    const closeBtn = document.getElementById('pwaInstallClose');
    const actionBtn = document.getElementById('pwaInstallAction');
    const iosSteps = document.getElementById('pwaIosSteps');
    const subtext = document.getElementById('pwaInstallSubtext');
    const openBtn = document.getElementById('pwaInstallOpen');

    if (!installCard) return;

    /* ---------------------------------------------------------------
       SERVICE WORKER
       --------------------------------------------------------------- */

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
        .catch(err => {
          console.warn('PWA SW Registration error:', err);
        });
    }

    /* ---------------------------------------------------------------
       APERTURA MANUALE DELLA CARD
       Funziona anche se l'utente aveva premuto X.
       --------------------------------------------------------------- */

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        installCard.classList.add('visible');
      });
    }

    /* ---------------------------------------------------------------
       iOS
       --------------------------------------------------------------- */

    if (isIos) {

      if (iosSteps) {
        iosSteps.style.display = 'block';
      }

      if (actionBtn) {
        actionBtn.style.display = 'none';
      }

      if (subtext) {
        subtext.textContent =
          'Aggiungi FUORISCHEMA alla schermata Home del tuo iPhone.';
      }

      /* Mostra la card automaticamente solo se non era stata chiusa */
      const isDismissed = localStorage.getItem(STORAGE_KEY);

      if (!isDismissed) {
        setTimeout(() => {
          installCard.classList.add('visible');
        }, 2000);
      }
    }

    /* ---------------------------------------------------------------
       ANDROID / CHROME / DESKTOP
       --------------------------------------------------------------- */

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
          'Aggiungi FUORISCHEMA alla schermata Home per averlo sempre con te.';
      }

      const isDismissed = localStorage.getItem(STORAGE_KEY);

      if (!isDismissed) {
        setTimeout(() => {
          installCard.classList.add('visible');
        }, 2000);
      }
    });

    /* ---------------------------------------------------------------
       PULSANTE INSTALLA
       --------------------------------------------------------------- */

    if (actionBtn) {

      actionBtn.addEventListener('click', async () => {

        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;

        deferredPrompt = null;

        if (outcome === 'accepted') {
          hideBanner();
          localStorage.setItem(STORAGE_KEY, 'true');
        }
      });
    }

    /* ---------------------------------------------------------------
       CHIUSURA CARD
       --------------------------------------------------------------- */

    if (closeBtn) {

      closeBtn.addEventListener('click', () => {

        hideBanner();

        /*
         * La X chiude SOLO la card automatica.
         * Il pulsante SCARICA L'APP rimane sempre disponibile.
         */

        localStorage.setItem(STORAGE_KEY, 'true');
      });
    }

    /* ---------------------------------------------------------------
       INSTALLAZIONE COMPLETATA
       --------------------------------------------------------------- */

    window.addEventListener('appinstalled', () => {

      hideBanner();

      localStorage.setItem(STORAGE_KEY, 'true');

      const launcher = document.getElementById('pwaInstallLauncher');

      if (launcher) {
        launcher.style.display = 'none';
      }
    });

    function hideBanner() {
      installCard.classList.remove('visible');
    }

  });

})();