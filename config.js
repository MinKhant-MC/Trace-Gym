(function () {
  'use strict';

  window.GYM_CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbzj7lTJmvKBfj3kT4aOm7QDgy_HsKHgxo0BCBU8gKE93aiXfZ9YECFGBxTlq8hRjZ6D/exec',
    QR_IMAGE_URL: 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=',
    MEMBER_CACHE_TTL_MS: 7 * 24 * 60 * 60 * 1000,
    STORAGE_KEYS: {
      SESSION_TOKEN: 'gym_session_token',
      USER_ROLE: 'gym_user_role',
      USER_ID: 'gym_user_id',
      DISPLAY_NAME: 'gym_display_name',
      MEMBER_DASHBOARD_CACHE_PREFIX: 'gym_member_dashboard_cache_'
    }
  };
})();
