(function () {
  'use strict';

  function getI18n() {
    return window.GYM_I18N || {};
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    var element = byId(id);
    if (element) {
      element.textContent = value === undefined || value === null ? '' : String(value);
    }
  }

  function setMessage(id, message, type) {
    var element = byId(id);
    if (!element) {
      return;
    }
    element.textContent = message || '';
    element.classList.remove('is-success', 'is-warning', 'is-danger');
    if (type) {
      element.classList.add(type);
    }
  }

  function toNumber(value) {
    var number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function getLocale() {
    return getI18n().getLocale ? getI18n().getLocale() : 'en-US';
  }

  function formatNumber(value) {
    return toNumber(value).toLocaleString(getLocale(), { maximumFractionDigits: 2 });
  }

  function formatDate(value) {
    var date;
    var normalized;
    if (!value) {
      return '-';
    }
    normalized = String(value).substring(0, 10);
    date = new Date(normalized + 'T00:00:00');
    if (Number.isNaN(date.getTime())) {
      date = new Date(value);
    }
    if (Number.isNaN(date.getTime())) {
      return normalized;
    }
    return new Intl.DateTimeFormat(getLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  function daysLeft(value) {
    var target = new Date(String(value).substring(0, 10) + 'T00:00:00');
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (Number.isNaN(target.getTime())) {
      return 0;
    }
    return Math.ceil((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  }

  function translateValue(prefix, value) {
    var i18n = getI18n();
    var normalized;
    var key;

    if (value === undefined || value === null || value === '') {
      return '-';
    }

    normalized = String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    key = prefix + '.' + normalized;

    if (i18n.has && i18n.has(key)) {
      return i18n.t(key);
    }

    return value;
  }

  function renderQr(target, value, options) {
    var container = typeof target === 'string' ? byId(target) : target;
    var settings = options || {};
    var text = value ? String(value) : '';
    var size = Number(settings.size || 220);
    var scratch;
    var preferredNode;
    var image;

    if (!container) {
      return;
    }

    container.innerHTML = '';

    if (!text) {
      return;
    }

    if (window.QRCode && typeof window.QRCode === 'function') {
      scratch = document.createElement('div');
      new window.QRCode(scratch, {
        text: text,
        width: size,
        height: size,
        colorDark: settings.colorDark || '#0b1220',
        colorLight: settings.colorLight || '#ffffff',
        correctLevel: window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.M : undefined
      });

      preferredNode = scratch.querySelector('canvas') || scratch.querySelector('svg') || scratch.querySelector('img');
      if (preferredNode) {
        if (preferredNode.tagName && preferredNode.tagName.toLowerCase() === 'canvas') {
          var safeCanvas = document.createElement('canvas');
          var safeContext = safeCanvas.getContext('2d');
          safeCanvas.width = preferredNode.width || size;
          safeCanvas.height = preferredNode.height || size;
          if (safeContext) {
            safeContext.drawImage(preferredNode, 0, 0);
          }
          safeCanvas.setAttribute('role', 'img');
          safeCanvas.setAttribute('aria-label', settings.alt || 'QR code');
          container.appendChild(safeCanvas);
          return;
        }

        preferredNode = preferredNode.cloneNode(true);
        if (preferredNode.tagName && preferredNode.tagName.toLowerCase() === 'svg') {
          preferredNode.setAttribute('width', String(size));
          preferredNode.setAttribute('height', String(size));
        }
        preferredNode.removeAttribute('style');
        preferredNode.setAttribute('role', 'img');
        preferredNode.setAttribute('aria-label', settings.alt || 'QR code');
        container.appendChild(preferredNode);
        return;
      }
    }

    image = document.createElement('img');
    image.alt = settings.alt || 'QR code';
    image.addEventListener('error', function () {
      container.innerHTML = '<span class="muted-text">QR unavailable</span>';
    });
    image.src = ((window.GYM_CONFIG && window.GYM_CONFIG.QR_IMAGE_URL) || '') + encodeURIComponent(text);
    container.appendChild(image);
  }

  function ensureLoadingOverlay() {
    var overlay = byId('appLoadingOverlay');
    if (overlay) {
      return overlay;
    }
    overlay = document.createElement('div');
    overlay.id = 'appLoadingOverlay';
    overlay.className = 'app-loading-overlay';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="gold-loader" role="status" aria-live="polite">' +
        '<span class="gold-loader-ring"></span>' +
        '<strong id="appLoadingText">Loading...</strong>' +
      '</div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function showLoading(message) {
    var overlay = ensureLoadingOverlay();
    setText('appLoadingText', message || 'Loading...');
    overlay.hidden = false;
    overlay.classList.add('is-open');
    document.body.classList.add('is-loading');
  }

  function hideLoading() {
    var overlay = byId('appLoadingOverlay');
    if (!overlay) {
      return;
    }
    overlay.classList.remove('is-open');
    overlay.hidden = true;
    document.body.classList.remove('is-loading');
  }

  window.GYM_COMMON = {
    byId: byId,
    setText: setText,
    setMessage: setMessage,
    toNumber: toNumber,
    formatNumber: formatNumber,
    formatDate: formatDate,
    daysLeft: daysLeft,
    translateValue: translateValue,
    renderQr: renderQr,
    showLoading: showLoading,
    hideLoading: hideLoading
  };
})();
