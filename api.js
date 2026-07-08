(function () {
  'use strict';

  var config = window.GYM_CONFIG || {};

  function post(action, payload) {
    if (!config.API_URL || config.API_URL.indexOf('PASTE_') === 0) {
      return Promise.reject(new Error('Set your Apps Script web app URL in config.js first.'));
    }

    return fetch(config.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: action,
        payload: payload || {}
      })
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (!data || data.ok !== true) {
          throw new Error(data && data.message ? data.message : 'Request failed.');
        }
        return data.data || {};
      });
  }

  window.GYM_API = {
    registerMember: function (member) { return post('registerMember', { member: member }); },
    login: function (role, identifier, password) { return post('login', { role: role, identifier: identifier, password: password }); },
    logout: function (session) { return post('logout', session); },
    getMemberDashboard: function (session) { return post('getMemberDashboard', session); },
    getAdminDashboard: function (session, query) { return post('getAdminDashboard', Object.assign({}, session, { query: query || '' })); },
    getGymQr: function (session) { return post('getGymQr', session); },
    approveRegistration: function (session, registrationId) { return post('approveRegistration', Object.assign({}, session, { registration_id: registrationId })); },
    rejectRegistration: function (session, registrationId) { return post('rejectRegistration', Object.assign({}, session, { registration_id: registrationId })); },
    recordAttendanceByQr: function (session, qrCode) { return post('recordAttendanceByQr', Object.assign({}, session, { qr_code: qrCode })); },
    recordMemberArrival: function (session, scannedCode) { return post('recordMemberArrival', Object.assign({}, session, { scanned_code: scannedCode })); },
    recordWorkout: function (session, workout) { return post('recordWorkout', Object.assign({}, session, { workout: workout })); },
    searchMembers: function (session, query) { return post('searchMembers', Object.assign({}, session, { query: query || '' })); },
    updateMember: function (session, member) { return post('updateMember', Object.assign({}, session, { member: member })); },
    removeMember: function (session, memberId) { return post('removeMember', Object.assign({}, session, { member_id: memberId })); }
  };
})();
