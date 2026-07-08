(function () {
  'use strict';

  var deferredInstallPrompt = null;

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js').catch(function () {});
    });
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    var button = document.querySelector('[data-install-app]');
    event.preventDefault();
    deferredInstallPrompt = event;
    if (button) {
      button.hidden = false;
    }
  });

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-install-app]');
    if (!button || !deferredInstallPrompt) {
      return;
    }
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.finally(function () {
      deferredInstallPrompt = null;
      button.hidden = true;
    });
  });
})();
