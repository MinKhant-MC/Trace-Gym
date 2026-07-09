(function () {
  'use strict';

  var api = window.GYM_API || {};
  var auth = window.GYM_AUTH || {};
  var common = window.GYM_COMMON || {};
  var i18n = window.GYM_I18N || {};
  var dashboardData = null;
  var currentSearchQuery = '';
  var currentSearchResults = {};
  var dashboardRefreshTimer = null;

  function byId(id) { return common.byId(id); }
  function setText(id, value) { return common.setText(id, value); }
  function setMessage(id, message, type) { return common.setMessage(id, message, type); }
  function formatNumber(value) { return common.formatNumber(value); }
  function formatDate(value) { return common.formatDate(value); }
  function daysLeft(value) { return common.daysLeft(value); }
  function translateValue(value) { return common.translateValue ? common.translateValue('value', value) : value; }
  function renderQr(target, value, options) { return common.renderQr ? common.renderQr(target, value, options) : null; }
  function t(key, params) { return i18n.t ? i18n.t(key, params) : key; }
  function showLoading(message) { if (common.showLoading) { common.showLoading(message || 'Loading...'); } }
  function hideLoading() { if (common.hideLoading) { common.hideLoading(); } }

  function withLoading(message, promiseFactory) {
    showLoading(message || 'Loading...');
    return Promise.resolve()
      .then(promiseFactory)
      .finally(hideLoading);
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseNumber(value) {
    return Number(String(value || '').replace(/,/g, '').trim());
  }

  function convertWeightToKg(value, unit) {
    var number = parseNumber(value);
    if (!Number.isFinite(number) || number <= 0) {
      return '';
    }
    return String(Math.round((unit === 'lb' ? number * 0.45359237 : number) * 10) / 10);
  }

  function parseFeetToCm(value) {
    var text = String(value || '').trim().toLowerCase();
    var match = text.match(/^(\d+(?:\.\d+)?)\s*(?:ft|')?\s*(\d+(?:\.\d+)?)?\s*(?:in|")?$/);
    var feet;
    var inches;
    var number;
    var decimals;

    if (match) {
      feet = Math.floor(Number(match[1]));
      inches = match[2] !== undefined ? Number(match[2]) : 0;
      if (match[2] === undefined && text.indexOf('.') !== -1) {
        decimals = text.split('.')[1].replace(/\D/g, '');
        inches = Number(decimals);
        if (inches > 11) {
          number = Number(match[1]);
          return number * 30.48;
        }
      }
      return (feet * 12 + inches) * 2.54;
    }

    number = parseNumber(text);
    return Number.isFinite(number) ? number * 30.48 : NaN;
  }

  function convertHeightToCm(value, unit) {
    var number = unit === 'ft' ? parseFeetToCm(value) : parseNumber(value);
    if (!Number.isFinite(number) || number <= 0) {
      return '';
    }
    return String(Math.round(number * 10) / 10);
  }

  function localizeNotification(item) {
    var title = item && item.title ? String(item.title) : '';
    var message = item && item.message ? String(item.message) : '';
    var expiryMatch = message.match(/^(.*?) expires in (\d+) day/i);

    if (title === 'Membership expiring soon') {
      return {
        title: t('admin.notification_expiring_title'),
        message: t('admin.notification_expiring_message', {
          name: expiryMatch ? expiryMatch[1] : '',
          days: expiryMatch ? expiryMatch[2] : '?'
        })
      };
    }

    return {
      title: title,
      message: message
    };
  }

  function session() {
    return auth.getSession();
  }

  function adminCacheKey() {
    var data = session() || {};
    return 'gym_admin_dashboard_' + (data.user_id || 'default');
  }

  function loadAdminCache() {
    try {
      return JSON.parse(localStorage.getItem(adminCacheKey()) || 'null');
    } catch (error) {
      return null;
    }
  }

  function saveAdminCache(data) {
    try {
      localStorage.setItem(adminCacheKey(), JSON.stringify(data));
    } catch (error) {}
  }

  function normalizeList(value) {
    return Array.isArray(value) ? value : [];
  }

  function pickGymQrValue(payload) {
    var direct = payload.gym_checkin_qr || payload.gymCheckinQr || payload.gym_qr || payload.gymEntryQr || payload.qr_code || payload.qrCode || '';

    if (direct) {
      return direct;
    }

    return Object.keys(payload).reduce(function (found, key) {
      if (found) {
        return found;
      }

      if (/gym.*qr|qr.*gym|entry.*qr/i.test(key) && typeof payload[key] === 'string' && payload[key]) {
        return payload[key];
      }

      return '';
    }, '');
  }

  function normalizeDashboardData(data) {
    var payload = data || {};
    var stats = payload.stats || {};

    return {
      stats: {
        total_members: Number(stats.total_members || payload.total_members || 0),
        pending_count: Number(stats.pending_count || payload.pending_count || 0),
        present_today: Number(stats.present_today || payload.present_today || 0),
        expiring_soon: Number(stats.expiring_soon || payload.expiring_soon || 0),
        total_income: Number(stats.total_income || payload.total_income || 0)
      },
      monthly_income: normalizeList(payload.monthly_income || payload.monthlyIncome),
      payment_history: normalizeList(payload.payment_history || payload.payments || payload.membership_payments),
      notifications: normalizeList(payload.notifications || payload.alerts),
      pending_registrations: normalizeList(payload.pending_registrations || payload.pending || payload.registrations),
      today_attendance: normalizeList(payload.today_attendance || payload.attendance || payload.present_members),
      search_results: normalizeList(payload.search_results || payload.search || payload.members),
      all_members: normalizeList(payload.all_members || payload.active_members || payload.members),
      gym_checkin_qr: pickGymQrValue(payload)
    };
  }

  function renderMemberCards(containerId, list, emptyText, query) {
    var container = byId(containerId);
    if (!container) {
      return;
    }
    container.innerHTML = '';

    if (!list || !list.length) {
      container.innerHTML = '<div class="info-card empty-state">' + emptyText + '</div>';
      return;
    }

    list.forEach(function (item) {
      var card = document.createElement('article');
      if (item.member_id) {
        currentSearchResults[item.member_id] = item;
      }
      card.className = 'info-card member-card-row';
      card.innerHTML =
        '<div class="member-card-photo-wrap">' +
          (item.photo_data
            ? '<img class="member-card-photo" src="' + escapeHtml(item.photo_data) + '" alt="">'
            : '<div class="member-card-photo is-empty">' + escapeHtml((item.full_name || '?').charAt(0)) + '</div>') +
        '</div>' +
        '<div class="member-card-body">' +
          '<strong>' + escapeHtml(item.full_name || '-') + '</strong>' +
          '<p>' + t('admin.member_line', {
            phone: escapeHtml(item.phone || '-'),
            gender: translateValue(item.gender || ''),
            memberId: escapeHtml(item.member_id || '-')
          }) + '</p>' +
          '<span>' + t('admin.member_ends', {
            date: formatDate(item.end_date),
            days: formatNumber(daysLeft(item.end_date))
          }) + '</span>' +
          '<div class="inline-actions">' +
            '<button class="secondary-button small icon-text-button" type="button" data-edit-member="' + escapeHtml(item.member_id || '') + '">' +
              '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2.1 12s3.2-6 9.9-6 9.9 6 9.9 6-3.2 6-9.9 6-9.9-6-9.9-6Z"/><circle cx="12" cy="12" r="3"/></svg><span>' + t('admin.view_member') + '</span>' +
            '</button>' +
          '</div>' +
        '</div>';
      container.appendChild(card);
    });

    container.querySelectorAll('[data-edit-member]').forEach(function (button) {
      button.addEventListener('click', function () {
        openMemberEditModal(button.getAttribute('data-edit-member'));
      });
    });
  }

  function ensureQuickViewModal() {
    var modal = byId('quickViewModal');
    if (modal) {
      return modal;
    }

    modal = document.createElement('div');
    modal.id = 'quickViewModal';
    modal.className = 'modal-overlay';
    modal.hidden = true;
    modal.innerHTML =
      '<section class="glass-panel modal-panel rich-modal-panel">' +
        '<div class="modal-head">' +
          '<div><h2 id="quickViewTitle"></h2></div>' +
          '<button id="quickViewClose" class="icon-button" type="button" aria-label="Close">×</button>' +
        '</div>' +
        '<div id="quickViewBody" class="quick-view-body"></div>' +
      '</section>';
    document.body.appendChild(modal);
    byId('quickViewClose').addEventListener('click', closeQuickView);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) {
        closeQuickView();
      }
    });
    return modal;
  }

  function openRichView(title, html) {
    var modal = ensureQuickViewModal();
    setText('quickViewTitle', title);
    byId('quickViewBody').innerHTML = html || '<div class="info-card empty-state">' + t('admin.no_list_items') + '</div>';
    modal.classList.add('is-open');
    modal.hidden = false;
    document.body.classList.add('is-modal-open');
  }

  function openQuickView(title, rows) {
    openRichView(title, rows.map(function (row) {
      if (row.html) {
        return row.html;
      }
      return '<div class="quick-view-row"><span>' + escapeHtml(row.label) + '</span><strong>' + escapeHtml(row.value || '-') + '</strong></div>';
    }).join(''));
  }

  function closeQuickView() {
    var modal = byId('quickViewModal');
    if (modal) {
      modal.classList.remove('is-open');
      modal.hidden = true;
    }
    document.body.classList.remove('is-modal-open');
  }

  function renderNotifications(list) {
    var container = byId('adminNotifications');
    if (!container) {
      return;
    }
    container.innerHTML = '';

    if (!list || !list.length) {
      container.innerHTML = '<div class="info-card empty-state">' + t('admin.no_alerts') + '</div>';
      return;
    }

    list.forEach(function (item) {
      var localized = localizeNotification(item);
      var card = document.createElement('article');
      card.className = 'info-card';
      card.innerHTML = '<strong>' + localized.title + '</strong><p>' + localized.message + '</p>';
      container.appendChild(card);
    });
  }

  function renderPaymentHistory(list) {
    var container = byId('paymentHistoryList');
    var preview = normalizeList(list).slice(0, 5);

    if (!container) {
      return;
    }
    container.innerHTML = '';

    if (!preview.length) {
      container.innerHTML = '<div class="info-card empty-state">' + t('admin.no_payments') + '</div>';
      return;
    }

    preview.forEach(function (item) {
      var card = document.createElement('article');
      card.className = 'info-card payment-history-card';
      card.innerHTML =
        '<div>' +
          '<strong>' + escapeHtml(item.full_name || '-') + '</strong>' +
          '<p>' + t('admin.payment_line', {
            amount: formatNumber(item.amount || 0),
            months: formatNumber(item.months || 0),
            type: translateValue(item.payment_type || '')
          }) + '</p>' +
          '<span>' + t('admin.payment_period', {
            start: formatDate(item.start_date),
            end: formatDate(item.end_date)
          }) + '</span>' +
        '</div>' +
        '<time>' + formatDate(item.paid_at) + '</time>';
      container.appendChild(card);
    });
  }

  function openFullList(title, list, mapper) {
    var items = normalizeList(list);
    var html = items.length
      ? items.map(function (item, index) { return mapper(item, index); }).join('')
      : '<div class="info-card empty-state">' + t('admin.no_list_items') + '</div>';
    openRichView(title, html);
  }

  function bindFullListButtons() {
    var buttonMap = [
      {
        id: 'viewPaymentsButton',
        title: function () { return t('admin.payment_history_title'); },
        list: function () { return dashboardData ? dashboardData.payment_history : []; },
        map: paymentHistoryRow
      },
      {
        id: 'viewPaymentHistoryButton',
        title: function () { return t('admin.payment_history_title'); },
        list: function () { return dashboardData ? dashboardData.payment_history : []; },
        map: paymentHistoryRow
      },
      {
        id: 'viewNotificationsButton',
        title: function () { return t('admin.notifications_title'); },
        list: function () { return dashboardData ? dashboardData.notifications : []; },
        map: function (item, index) {
          var localized = localizeNotification(item);
          return detailCardHtml({
            title: String(index + 1) + '. ' + localized.title,
            subtitle: localized.message,
            meta: []
          });
        }
      },
      {
        id: 'viewPendingButton',
        title: function () { return t('admin.pending_title'); },
        list: function () { return dashboardData ? dashboardData.pending_registrations : []; },
        map: function (item, index) {
          return memberLikeCardHtml(item, index, true);
        }
      },
      {
        id: 'viewAttendanceButton',
        title: function () { return t('admin.attendance_title'); },
        list: function () { return dashboardData ? dashboardData.today_attendance : []; },
        map: function (item, index) {
          var member = findDashboardMember(item.member_id);
          if (member) {
            return memberLikeCardHtml(Object.assign({}, member, {
              scan_date: item.scan_date,
              scan_time: item.scan_time
            }), index, false);
          }
          return detailCardHtml({
            title: String(index + 1) + '. ' + (item.full_name || '-'),
            subtitle: item.phone || '-',
            meta: [
              { label: 'Member ID', value: item.member_id || '-' },
              { label: 'Scan Date', value: item.scan_date || '-' },
              { label: 'Scan Time', value: item.scan_time || '-' },
              { label: 'Status', value: translateValue(item.status || '') }
            ]
          });
        }
      },
      {
        id: 'viewAllMembersButton',
        title: function () { return t('admin.all_members_title'); },
        list: function () { return dashboardData ? dashboardData.all_members : []; },
        map: memberRow
      },
      {
        id: 'viewSearchButton',
        title: function () { return t('admin.search_title'); },
        list: function () { return dashboardData ? dashboardData.search_results : []; },
        map: memberRow
      }
    ];

    buttonMap.forEach(function (entry) {
      var button = byId(entry.id);
      if (!button) {
        return;
      }
      button.addEventListener('click', function () {
        openFullList(entry.title(), entry.list(), entry.map);
      });
    });
  }

  function paymentHistoryRow(item, index) {
    return detailCardHtml({
      title: String(index + 1) + '. ' + (item.full_name || '-'),
      subtitle: item.member_id || '-',
      meta: [
        { label: 'Phone', value: item.phone || '-' },
        { label: 'Type', value: translateValue(item.payment_type || '') },
        { label: 'Months', value: formatNumber(item.months || 0) },
        { label: 'Amount', value: formatNumber(item.amount || 0) },
        { label: 'Period', value: formatDate(item.start_date) + ' - ' + formatDate(item.end_date) },
        { label: 'Paid At', value: formatDate(item.paid_at) }
      ]
    });
  }

  function memberRow(item, index) {
    return memberLikeCardHtml(item, index, false);
  }

  function paymentsForMember(memberId) {
    return normalizeList(dashboardData && dashboardData.payment_history).filter(function (payment) {
      return String(payment.member_id || '') === String(memberId || '');
    });
  }

  function findDashboardMember(memberId) {
    return normalizeList(dashboardData && dashboardData.all_members).filter(function (member) {
      return String(member.member_id || '') === String(memberId || '');
    })[0] || null;
  }

  function paymentMiniHtml(memberId) {
    var payments = paymentsForMember(memberId);
    if (!payments.length) {
      return '<p class="muted-text">' + t('admin.no_payments') + '</p>';
    }
    return '<div class="mini-payment-list">' + payments.map(function (payment) {
      return '<span>' +
        '<b>' + escapeHtml(translateValue(payment.payment_type || '')) + '</b>' +
        escapeHtml(formatDate(payment.start_date) + ' - ' + formatDate(payment.end_date)) +
        '<strong>' + escapeHtml(formatNumber(payment.amount || 0)) + '</strong>' +
      '</span>';
    }).join('') + '</div>';
  }

  function detailCardHtml(options) {
    var meta = normalizeList(options.meta);
    return '<article class="rich-list-card">' +
      '<div class="rich-list-main">' +
        '<strong>' + escapeHtml(options.title || '-') + '</strong>' +
        '<p>' + escapeHtml(options.subtitle || '-') + '</p>' +
        (meta.length ? '<div class="rich-meta-grid">' + meta.map(function (row) {
          return '<span><small>' + escapeHtml(row.label) + '</small><b>' + escapeHtml(row.value || '-') + '</b></span>';
        }).join('') + '</div>' : '') +
      '</div>' +
    '</article>';
  }

  function memberLikeCardHtml(item, index, isPending) {
    var id = item.member_id || item.registration_id || '-';
    return '<article class="rich-list-card member-rich-card">' +
      '<div class="member-card-photo-wrap">' +
        (item.photo_data
          ? '<img class="member-card-photo" src="' + escapeHtml(item.photo_data) + '" alt="">'
          : '<div class="member-card-photo is-empty">' + escapeHtml((item.full_name || '?').charAt(0)) + '</div>') +
      '</div>' +
      '<div class="rich-list-main">' +
        '<strong>' + escapeHtml(String(index + 1) + '. ' + (item.full_name || '-')) + '</strong>' +
        '<p>' + escapeHtml([item.phone || '-', translateValue(item.gender || ''), id].join(' | ')) + '</p>' +
        '<div class="rich-meta-grid">' +
          '<span><small>Status</small><b>' + escapeHtml(translateValue(item.status || (isPending ? 'pending' : ''))) + '</b></span>' +
          '<span><small>Start</small><b>' + escapeHtml(formatDate(item.start_date)) + '</b></span>' +
          '<span><small>End</small><b>' + escapeHtml(formatDate(item.end_date)) + '</b></span>' +
          '<span><small>Months</small><b>' + escapeHtml(formatNumber(item.membership_months || 0)) + '</b></span>' +
          '<span><small>Total Fee</small><b>' + escapeHtml(formatNumber(item.membership_fee || 0)) + '</b></span>' +
        '</div>' +
        (!isPending ? '<div class="member-payment-history"><h3>' + escapeHtml(t('admin.payment_history_title')) + '</h3>' + paymentMiniHtml(item.member_id) + '</div>' : '') +
      '</div>' +
    '</article>';
  }

  function renderPending(list) {
    var container = byId('pendingRegistrations');
    if (!container) {
      return;
    }
    container.innerHTML = '';

    if (!list || !list.length) {
      container.innerHTML = '<div class="info-card empty-state">' + t('admin.no_pending') + '</div>';
      return;
    }

    list.forEach(function (item) {
      var card = document.createElement('article');
      card.className = 'info-card';
      card.innerHTML =
        '<strong>' + item.full_name + '</strong>' +
        '<p>' + t('admin.pending_line', {
          phone: item.phone,
          gender: translateValue(item.gender || ''),
          months: formatNumber(item.membership_months)
        }) + '</p>' +
        '<span>' + t('admin.pending_meta', {
          date: formatDate(item.start_date),
          trainer: translateValue(item.personal_trainer || 'No')
        }) + '</span>' +
        '<div class="inline-actions">' +
        '<button class="secondary-button small icon-text-button" data-view-pending="' + item.registration_id + '"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2.1 12s3.2-6 9.9-6 9.9 6 9.9 6-3.2 6-9.9 6-9.9-6-9.9-6Z"/><circle cx="12" cy="12" r="3"/></svg><span>' + t('admin.view_member') + '</span></button>' +
        '<button class="primary-button small" data-approve="' + item.registration_id + '">' + t('admin.approve') + '</button>' +
        '<button class="secondary-button small" data-reject="' + item.registration_id + '">' + t('admin.reject') + '</button>' +
        '</div>';
      container.appendChild(card);
    });

    container.querySelectorAll('[data-view-pending]').forEach(function (button) {
      button.addEventListener('click', function () {
        var id = button.getAttribute('data-view-pending');
        var item = list.filter(function (row) { return row.registration_id === id; })[0] || {};
        openQuickView(item.full_name || t('admin.pending_title'), [
          { label: 'Phone', value: item.phone },
          { label: 'Gender', value: translateValue(item.gender || '') },
          { label: 'Membership Fee', value: formatNumber(item.membership_fee) },
          { label: 'Start Date', value: formatDate(item.start_date) },
          { label: 'Months', value: formatNumber(item.membership_months) }
        ]);
      });
    });

    container.querySelectorAll('[data-approve]').forEach(function (button) {
      button.addEventListener('click', function () {
        setText('adminSummaryText', t('admin.approving_member'));
        withLoading(t('admin.approving_member'), function () {
          return api.approveRegistration(session(), button.getAttribute('data-approve'))
            .then(loadDashboard);
        })
          .catch(function (error) {
            setText('adminSummaryText', error && error.message ? error.message : t('admin.dashboard_failed'));
          });
      });
    });

    container.querySelectorAll('[data-reject]').forEach(function (button) {
      button.addEventListener('click', function () {
        setText('adminSummaryText', t('admin.rejecting_member'));
        withLoading(t('admin.rejecting_member'), function () {
          return api.rejectRegistration(session(), button.getAttribute('data-reject'))
            .then(loadDashboard);
        })
          .catch(function (error) {
            setText('adminSummaryText', error && error.message ? error.message : t('admin.dashboard_failed'));
          });
      });
    });
  }

  function renderAttendance(list) {
    var container = byId('todayAttendance');
    if (!container) {
      return;
    }
    container.innerHTML = '';

    if (!list || !list.length) {
      container.innerHTML = '<div class="info-card empty-state">' + t('admin.no_attendance') + '</div>';
      return;
    }

    list.forEach(function (item) {
      var card = document.createElement('article');
      card.className = 'info-card';
      card.innerHTML =
        '<strong>' + item.full_name + '</strong>' +
        '<p>' + item.phone + '</p>' +
        '<span>' + t('admin.scan_time', { time: item.scan_time }) + '</span>' +
        '<div class="inline-actions">' +
          '<button class="secondary-button small icon-text-button" data-view-attendance="' + escapeHtml(item.attendance_id || '') + '"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2.1 12s3.2-6 9.9-6 9.9 6 9.9 6-3.2 6-9.9 6-9.9-6-9.9-6Z"/><circle cx="12" cy="12" r="3"/></svg><span>' + t('admin.view_member') + '</span></button>' +
        '</div>';
      container.appendChild(card);
    });

    container.querySelectorAll('[data-view-attendance]').forEach(function (button) {
      button.addEventListener('click', function () {
        var id = button.getAttribute('data-view-attendance');
        var item = list.filter(function (row) { return row.attendance_id === id; })[0] || {};
        openQuickView(item.full_name || t('admin.attendance_title'), [
          { label: 'Member ID', value: item.member_id },
          { label: 'Phone', value: item.phone },
          { label: 'Scan Date', value: item.scan_date },
          { label: 'Scan Time', value: item.scan_time },
          { label: 'Status', value: translateValue(item.status || '') }
        ]);
      });
    });
  }

  function renderMonthlyIncomeChart(list) {
    var container = byId('adminIncomeChart');
    var total = 0;
    var monthTotal = 0;
    var max = 0;
    var now = new Date();
    var currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    if (!container) {
      return;
    }

    list = normalizeList(list);
    list.forEach(function (item) {
      total += Number(item.amount || 0);
      max = Math.max(max, Number(item.amount || 0));
      if (String(item.month || '') === currentMonth) {
        monthTotal += Number(item.amount || 0);
      }
    });
    setText('adminMonthFee', formatNumber(monthTotal));
    setText('adminYearFee', formatNumber(total));

    if (!list.length || total <= 0) {
      container.innerHTML = '<div class="chart-empty-state">' + t('admin.no_income') + '</div>';
      return;
    }

    container.innerHTML = list.map(function (item) {
      var value = Number(item.amount || 0);
      var height = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 8;
      var currentClass = String(item.month || '') === currentMonth ? ' is-current' : '';
      return '<div class="income-bar-item' + currentClass + '">' +
        '<div class="income-bar-track"><span style="height:' + height + '%"></span></div>' +
        '<strong>' + escapeHtml(item.label || '') + '</strong>' +
        '<small>' + formatNumber(value) + '</small>' +
      '</div>';
    }).join('');
  }

  function renderSearchResults(list, query) {
    renderMemberCards('searchResults', list, query ? t('admin.no_members') : t('admin.search_text'), query);
  }

  function renderAllMembers(list) {
    renderMemberCards('allMembersList', list, t('admin.no_members'), '');
  }

  function renderDashboard(data) {
    var normalized = normalizeDashboardData(data);

    dashboardData = normalized;
    saveAdminCache(data);
    setText('adminSummaryText', t('admin.summary'));
    setText('totalMembers', formatNumber(normalized.stats.total_members));
    setText('pendingCount', formatNumber(normalized.stats.pending_count));
    setText('presentToday', formatNumber(normalized.stats.present_today));
    setText('expiringCount', formatNumber(normalized.stats.expiring_soon));
    renderMonthlyIncomeChart(normalized.monthly_income);
    renderPaymentHistory(normalized.payment_history);
    renderNotifications(normalized.notifications);
    renderPending(normalized.pending_registrations);
    renderAttendance(normalized.today_attendance);
    currentSearchResults = {};
    renderAllMembers(normalized.all_members);
    renderSearchResults(normalized.search_results, currentSearchQuery);

    if (byId('adminGymQrName')) {
      setText('adminGymQrName', t('admin.gym_qr_name'));
    }
    if (byId('adminGymQrMeta')) {
      setText('adminGymQrMeta', t('admin.gym_qr_meta'));
    }
  }

  function loadDashboard(query) {
    currentSearchQuery = query || '';
    if (!currentSearchQuery && !dashboardData) {
      var cached = loadAdminCache();
      if (cached) {
        renderDashboard(cached);
      }
    }
    return api.getAdminDashboard(session(), query || '')
      .then(function (data) {
        renderDashboard(data);
        return data;
      })
      .catch(function (error) {
        setText('adminSummaryText', error && error.message ? error.message : t('admin.dashboard_failed'));
      });
  }

  function refreshDashboardSilently() {
    return loadDashboard(currentSearchQuery);
  }

  function scheduleDashboardRefresh() {
    if (dashboardRefreshTimer) {
      clearInterval(dashboardRefreshTimer);
    }

    dashboardRefreshTimer = window.setInterval(function () {
      refreshDashboardSilently();
    }, 15000);
  }

  function closeGymQrModal() {
    var modal = byId('gymQrModal');

    if (!modal) {
      return;
    }

    modal.classList.remove('is-open');
    modal.hidden = true;
    document.body.classList.remove('is-modal-open');
  }

  function closeMemberEditModal() {
    var modal = byId('memberEditModal');

    if (!modal) {
      return;
    }

    modal.classList.remove('is-open');
    modal.hidden = true;
    document.body.classList.remove('is-modal-open');
  }

  function setFieldValue(id, value) {
    var field = byId(id);
    if (field) {
      field.value = value === undefined || value === null ? '' : value;
    }
  }

  function openMemberEditModal(memberId) {
    var modal = byId('memberEditModal');
    var member = currentSearchResults[memberId];

    if (!modal || !member) {
      return;
    }

    setFieldValue('editMemberId', member.member_id);
    setFieldValue('editFullName', member.full_name);
    setFieldValue('editPhone', member.phone);
    setFieldValue('editEmail', member.email);
    setFieldValue('editGender', member.gender || 'Male');
    setFieldValue('editStatus', member.status || 'active');
    setFieldValue('editWeight', member.weight_kg);
    setFieldValue('editWeightUnit', 'kg');
    setFieldValue('editHeight', member.height_cm);
    setFieldValue('editHeightUnit', 'cm');
    setFieldValue('editAge', member.age);
    setFieldValue('editStartDate', String(member.start_date || '').substring(0, 10));
    setFieldValue('editMonths', member.membership_months);
    setFieldValue('editIncome', member.membership_fee);
    setFieldValue('editExtendMonths', 0);
    setFieldValue('editExtensionFee', '');
    setFieldValue('editTrainer', member.personal_trainer || 'No');
    setFieldValue('editGoalNote', member.goal_note);
    setFieldValue('editNewPassword', '');
    if (byId('editMemberPaymentHistory')) {
      byId('editMemberPaymentHistory').innerHTML = paymentMiniHtml(member.member_id);
    }
    if (byId('memberRemoveButton')) {
      byId('memberRemoveButton').setAttribute('data-member-id', member.member_id || '');
    }

    if (byId('editMemberPhotoName')) {
      setText('editMemberPhotoName', member.full_name || member.member_id || 'Member');
    }
    if (byId('editMemberExpireAlert')) {
      var left = daysLeft(member.end_date);
      setText('editMemberExpireAlert', left <= 7 ? t('admin.member_expire_alert', { days: formatNumber(left) }) : '');
    }
    if (byId('editMemberPhoto')) {
      if (member.photo_data) {
        byId('editMemberPhoto').src = member.photo_data;
        byId('editMemberPhoto').hidden = false;
      } else {
        byId('editMemberPhoto').hidden = true;
      }
    }

    setMessage('memberEditMessage', '', '');
    modal.classList.add('is-open');
    modal.hidden = false;
    document.body.classList.add('is-modal-open');
  }

  function openGymQrModal() {
    var modal = byId('gymQrModal');
    var qrValue = dashboardData && dashboardData.gym_checkin_qr ? dashboardData.gym_checkin_qr : '';

    if (!qrValue) {
      if (api.getGymQr) {
        setMessage('scannerMessage', t('admin.loading_gym_qr'), 'is-warning');
        api.getGymQr(session())
          .then(function (data) {
            dashboardData = dashboardData || {};
            dashboardData.gym_checkin_qr = pickGymQrValue(data);
            openGymQrModal();
          })
          .catch(function (error) {
            setMessage('scannerMessage', error && error.message ? error.message : t('admin.no_gym_qr'), 'is-danger');
          });
        return;
      }
      setMessage('scannerMessage', t('admin.no_gym_qr'), 'is-danger');
      return;
    }

    if (!modal) {
      return;
    }

    renderQr('adminGymQrImage', qrValue, { size: 220, alt: 'Gym entry QR code' });
    modal.classList.add('is-open');
    modal.hidden = false;
    document.body.classList.add('is-modal-open');
  }

  function bindPasswordToggles() {
    document.querySelectorAll('[data-toggle-password]').forEach(function (button) {
      button.addEventListener('click', function () {
        var input = byId(button.getAttribute('data-toggle-password'));
        var visible;
        if (!input) {
          return;
        }
        visible = input.type === 'text';
        input.type = visible ? 'password' : 'text';
        button.classList.toggle('is-visible', !visible);
        button.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
      });
    });
  }

  function bindUnitHints() {
    var heightInput = byId('editHeight');
    var heightUnit = byId('editHeightUnit');

    function updateHeightPlaceholder() {
      if (!heightInput || !heightUnit) {
        return;
      }
      heightInput.placeholder = heightUnit.value === 'ft' ? '5\'6" or 5.6' : '170';
    }

    if (heightUnit) {
      heightUnit.addEventListener('change', updateHeightPlaceholder);
      updateHeightPlaceholder();
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    loadDashboard(byId('memberSearchInput').value.trim());
  }

  function handleMemberEditSave(event) {
    var button = byId('memberEditSaveButton');
    var payload;

    event.preventDefault();
    payload = {
      member_id: byId('editMemberId').value,
      full_name: byId('editFullName').value.trim(),
      phone: byId('editPhone').value.trim(),
      email: byId('editEmail').value.trim(),
      gender: byId('editGender').value,
      status: byId('editStatus').value,
      weight_kg: convertWeightToKg(byId('editWeight').value, byId('editWeightUnit').value),
      height_cm: convertHeightToCm(byId('editHeight').value, byId('editHeightUnit').value),
      age: byId('editAge').value,
      start_date: byId('editStartDate').value,
      membership_months: byId('editMonths').value,
      membership_fee: byId('editIncome') ? byId('editIncome').value : '',
      extend_months: byId('editExtendMonths') ? byId('editExtendMonths').value : '',
      extension_fee: byId('editExtensionFee') ? byId('editExtensionFee').value : '',
      personal_trainer: byId('editTrainer').value,
      goal_note: byId('editGoalNote').value.trim(),
      new_password: byId('editNewPassword') ? byId('editNewPassword').value.trim() : ''
    };

    if (button) {
      button.disabled = true;
    }
    setMessage('memberEditMessage', t('admin.saving_member'), 'is-warning');

    withLoading(t('admin.saving_member'), function () {
      return api.updateMember(session(), payload)
        .then(function () {
          setMessage('memberEditMessage', t('admin.member_saved'), 'is-success');
          return loadDashboard(currentSearchQuery);
        });
      })
      .then(closeMemberEditModal)
      .catch(function (error) {
        setMessage('memberEditMessage', error && error.message ? error.message : t('admin.member_save_failed'), 'is-danger');
      })
      .finally(function () {
        if (button) {
          button.disabled = false;
        }
      });
  }

  function handleMemberRemove() {
    var button = byId('memberRemoveButton');
    var memberId = button ? button.getAttribute('data-member-id') : '';
    var member = dashboardData && dashboardData.all_members
      ? dashboardData.all_members.filter(function (item) { return item.member_id === memberId; })[0]
      : null;

    if (!memberId) {
      return;
    }

    if (!window.confirm(t('admin.confirm_remove_member', { name: member && member.full_name ? member.full_name : memberId }))) {
      return;
    }

    if (button) {
      button.disabled = true;
    }

    withLoading(t('admin.removing_member'), function () {
      return api.removeMember(session(), memberId)
        .then(function () {
          setMessage('memberEditMessage', t('admin.member_removed'), 'is-success');
          closeMemberEditModal();
          return loadDashboard(currentSearchQuery);
        });
    })
      .catch(function (error) {
        setMessage('memberEditMessage', error && error.message ? error.message : t('admin.remove_failed'), 'is-danger');
      })
      .finally(function () {
        if (button) {
          button.disabled = false;
        }
      });
  }

  function init() {
    if (!auth.protectPage('admin')) {
      return;
    }

    closeGymQrModal();
    closeMemberEditModal();
    bindPasswordToggles();
    bindUnitHints();
    bindFullListButtons();

    if (byId('memberSearchForm')) {
      byId('memberSearchForm').addEventListener('submit', handleSearch);
    }

    if (byId('showGymQrButton')) {
      byId('showGymQrButton').addEventListener('click', openGymQrModal);
    }

    if (byId('closeGymQrModalButton')) {
      byId('closeGymQrModalButton').addEventListener('click', closeGymQrModal);
    }

    if (byId('closeMemberEditModalButton')) {
      byId('closeMemberEditModalButton').addEventListener('click', closeMemberEditModal);
    }

    if (byId('memberEditForm')) {
      byId('memberEditForm').addEventListener('submit', handleMemberEditSave);
    }

    if (byId('memberRemoveButton')) {
      byId('memberRemoveButton').addEventListener('click', handleMemberRemove);
    }

    if (byId('gymQrModal')) {
      byId('gymQrModal').addEventListener('click', function (event) {
        if (event.target === byId('gymQrModal')) {
          closeGymQrModal();
        }
      });
    }

    if (byId('memberEditModal')) {
      byId('memberEditModal').addEventListener('click', function (event) {
        if (event.target === byId('memberEditModal')) {
          closeMemberEditModal();
        }
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeGymQrModal();
        closeMemberEditModal();
        closeQuickView();
      }
    });

    document.addEventListener('gym-language-change', function () {
      if (dashboardData) {
        renderDashboard(dashboardData);
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        refreshDashboardSilently();
      }
    });

    window.addEventListener('focus', refreshDashboardSilently);
    window.addEventListener('storage', function (event) {
      if (event.key === 'gym_admin_refresh_signal') {
        refreshDashboardSilently();
      }
    });

    window.addEventListener('beforeunload', function () {
      if (dashboardRefreshTimer) {
        clearInterval(dashboardRefreshTimer);
      }
    });

    scheduleDashboardRefresh();
    loadDashboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

