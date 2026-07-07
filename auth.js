(function () {
  'use strict';

  var config = window.GYM_CONFIG || {};
  var api = window.GYM_API || {};
  var i18n = window.GYM_I18N || {};
  var keys = (config && config.STORAGE_KEYS) || {};

  function byId(id) {
    return document.getElementById(id);
  }

  function pageName() {
    return document.body ? document.body.getAttribute('data-page') || '' : '';
  }

  function setMessage(id, message, type) {
    if (window.GYM_COMMON && window.GYM_COMMON.setMessage) {
      window.GYM_COMMON.setMessage(id, message, type);
    }
  }

  function t(key, params) {
    return i18n.t ? i18n.t(key, params) : key;
  }

  function saveSession(data) {
    localStorage.setItem(keys.SESSION_TOKEN, data.session_token || '');
    localStorage.setItem(keys.USER_ROLE, data.role || '');
    localStorage.setItem(keys.USER_ID, data.user_id || '');
    localStorage.setItem(keys.DISPLAY_NAME, data.display_name || '');
  }

  function getSession() {
    return {
      session_token: localStorage.getItem(keys.SESSION_TOKEN) || '',
      role: localStorage.getItem(keys.USER_ROLE) || '',
      user_id: localStorage.getItem(keys.USER_ID) || '',
      display_name: localStorage.getItem(keys.DISPLAY_NAME) || ''
    };
  }

  function clearSession() {
    clearMemberCache();
    localStorage.removeItem(keys.SESSION_TOKEN);
    localStorage.removeItem(keys.USER_ROLE);
    localStorage.removeItem(keys.USER_ID);
    localStorage.removeItem(keys.DISPLAY_NAME);
  }

  function clearMemberCache() {
    var prefix = keys.MEMBER_DASHBOARD_CACHE_PREFIX || 'gym_member_dashboard_cache_';
    var removals = [];
    var index;
    var keyName;

    for (index = 0; index < localStorage.length; index += 1) {
      keyName = localStorage.key(index);
      if (keyName && keyName.indexOf(prefix) === 0) {
        removals.push(keyName);
      }
    }

    removals.forEach(function (item) {
      localStorage.removeItem(item);
    });
  }

  function getMemberDashboardCacheKey(session) {
    var prefix = keys.MEMBER_DASHBOARD_CACHE_PREFIX || 'gym_member_dashboard_cache_';
    var targetSession = session || getSession();
    return prefix + (targetSession.user_id || 'member');
  }

  function saveMemberDashboardCache(session, data) {
    if (!data) {
      return false;
    }

    try {
      localStorage.setItem(getMemberDashboardCacheKey(session), JSON.stringify({
        cached_at: Date.now(),
        data: data
      }));
      return true;
    } catch (error) {
      return false;
    }
  }

  function redirectForRole(role) {
    window.location.href = role === 'admin' ? 'admin.html' : 'member.html';
  }

  function protectPage(expectedRole) {
    var session = getSession();
    if (!session.session_token) {
      window.location.href = 'index.html';
      return false;
    }
    if (expectedRole && session.role !== expectedRole) {
      redirectForRole(session.role || 'member');
      return false;
    }
    return true;
  }

  function bindRoleToggle() {
    var buttons = document.querySelectorAll('#loginRoleToggle button');
    var hidden = byId('loginRole');

    function updatePlaceholders() {
      var identifier = byId('loginIdentifier');
      var password = byId('loginPassword');
      var isAdmin = hidden && hidden.value === 'admin';

      if (identifier) {
        identifier.placeholder = isAdmin ? t('login.placeholder_admin_identifier') : t('login.placeholder_member_identifier');
      }
      if (password) {
        password.placeholder = isAdmin ? t('login.placeholder_admin_password') : t('login.placeholder_member_password');
      }
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        buttons.forEach(function (item) {
          item.classList.remove('is-active');
        });
        button.classList.add('is-active');
        if (hidden) {
          hidden.value = button.getAttribute('data-role') || 'member';
        }
        updatePlaceholders();
      });
    });

    updatePlaceholders();
    document.addEventListener('gym-language-change', updatePlaceholders);
  }

  function handleLogin(event) {
    var role = byId('loginRole') ? byId('loginRole').value : 'member';
    var identifier = byId('loginIdentifier') ? byId('loginIdentifier').value.trim() : '';
    var password = byId('loginPassword') ? byId('loginPassword').value.trim() : '';
    var button = byId('loginButton');

    event.preventDefault();

    if (!identifier || !password) {
      setMessage('loginMessage', t('login.fill_fields'), 'is-danger');
      return;
    }

    if (button) {
      button.disabled = true;
    }
    setMessage('loginMessage', t('login.signing_in'), 'is-warning');

    api.login(role, identifier, password)
      .then(function (data) {
        saveSession(data);
        setMessage('loginMessage', t('login.success'), 'is-success');
        if ((data.role || role) === 'member' && api.getMemberDashboard) {
          setMessage('loginMessage', t('login.downloading_data'), 'is-warning');
          return api.getMemberDashboard(getSession())
            .then(function (dashboard) {
              saveMemberDashboardCache(getSession(), dashboard);
            })
            .catch(function () {
              return null;
            })
            .then(function () {
              redirectForRole(data.role || role);
            });
        }
        redirectForRole(data.role || role);
        return null;
      })
      .catch(function (error) {
        setMessage('loginMessage', error && error.message ? error.message : t('login.failed'), 'is-danger');
      })
      .finally(function () {
        if (button) {
          button.disabled = false;
        }
      });
  }

  function bindLogout() {
    var button = byId('logoutButton');
    if (!button) {
      return;
    }
    button.addEventListener('click', function () {
      var session = getSession();
      var finish = function () {
        clearSession();
        window.location.href = 'index.html';
      };

      if (!api.logout) {
        finish();
        return;
      }

      api.logout(session).catch(function () {
        return null;
      }).finally(finish);
    });
  }

  function init() {
    var page = pageName();
    var form = byId('loginForm');

    if (page === 'login' && getSession().session_token) {
      redirectForRole(getSession().role || 'member');
      return;
    }

    if (form) {
      bindRoleToggle();
      form.addEventListener('submit', handleLogin);
    }

    if (page === 'member') {
      protectPage('member');
    }
    if (page === 'admin') {
      protectPage('admin');
    }

    bindLogout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GYM_AUTH = {
    getSession: getSession,
    protectPage: protectPage,
    clearSession: clearSession,
    saveMemberDashboardCache: saveMemberDashboardCache
  };
})();
