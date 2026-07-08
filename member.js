(function () {
  'use strict';

  var api = window.GYM_API || {};
  var auth = window.GYM_AUTH || {};
  var common = window.GYM_COMMON || {};
  var config = window.GYM_CONFIG || {};
  var i18n = window.GYM_I18N || {};
  var dashboardData = null;
  var zxingReader = null;
  var scannerControls = null;
  var scannerLocked = false;
  var availableActivities = [];
  var activityGroups = {};
  var activityCategoryOrder = [
    '1 Cardio Machines',
    '2 Strength Machines',
    '3 Movement Exercises'
  ];

  function byId(id) { return common.byId(id); }
  function setText(id, value) { return common.setText(id, value); }
  function setMessage(id, message, type) { return common.setMessage(id, message, type); }
  function formatNumber(value) { return common.formatNumber(value); }
  function formatDate(value) { return common.formatDate(value); }
  function daysLeft(value) { return common.daysLeft(value); }
  function translateValue(value) { return common.translateValue ? common.translateValue('value', value) : value; }
  function t(key, params) { return i18n.t ? i18n.t(key, params) : key; }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function mapCameraError(error) {
    var message = error && error.message ? String(error.message) : '';
    var lowered = message.toLowerCase();

    if (lowered.indexOf('permission dismissed') !== -1) {
      return t('member.camera_permission_dismissed');
    }

    if (
      lowered.indexOf('notallowederror') !== -1 ||
      lowered.indexOf('permission denied') !== -1 ||
      lowered.indexOf('permission dismissed') !== -1 ||
      lowered.indexOf('denied') !== -1
    ) {
      return t('member.camera_permission_denied');
    }

    return message || t('member.camera_not_supported');
  }

  function localizeNotification(item) {
    var title = item && item.title ? String(item.title) : '';
    var message = item && item.message ? String(item.message) : '';
    var expiryMatch = message.match(/expire in (\d+) day/i);

    if (title === 'Membership expiring soon') {
      return {
        title: t('member.notification_expiring_title'),
        message: t('member.notification_expiring_message', {
          days: expiryMatch ? expiryMatch[1] : '?'
        })
      };
    }

    if (title === 'Membership not active') {
      return {
        title: t('member.notification_inactive_title'),
        message: t('member.notification_inactive_message')
      };
    }

    return {
      title: title,
      message: message
    };
  }

  function getDashboardCacheKey() {
    var session = auth.getSession();
    var prefix = (config.STORAGE_KEYS && config.STORAGE_KEYS.MEMBER_DASHBOARD_CACHE_PREFIX) || 'gym_member_dashboard_cache_';
    return prefix + (session.user_id || 'member');
  }

  function saveDashboardCache(data) {
    if (auth.saveMemberDashboardCache && auth.getSession) {
      return auth.saveMemberDashboardCache(auth.getSession(), data);
    }

    try {
      localStorage.setItem(getDashboardCacheKey(), JSON.stringify({
        cached_at: Date.now(),
        data: data
      }));
    } catch (error) {
      return null;
    }
    return true;
  }

  function loadDashboardCache() {
    var ttl = Number(config.MEMBER_CACHE_TTL_MS || (24 * 60 * 60 * 1000));
    var raw;
    var parsed;

    try {
      raw = localStorage.getItem(getDashboardCacheKey());
      if (!raw) {
        return null;
      }
      parsed = JSON.parse(raw);
      if (!parsed || !parsed.data || !parsed.cached_at) {
        return null;
      }
      if ((Date.now() - Number(parsed.cached_at)) > ttl) {
        localStorage.removeItem(getDashboardCacheKey());
        return null;
      }
      return parsed.data;
    } catch (error) {
      return null;
    }
  }

  function shortDate(value) {
    var text = String(value || '').substring(0, 10);
    if (!text) {
      return '-';
    }
    return text.substring(5).replace('-', '/');
  }

  function localDateKey(value) {
    return value.getFullYear() + '-' +
      String(value.getMonth() + 1).padStart(2, '0') + '-' +
      String(value.getDate()).padStart(2, '0');
  }

  function buildClientSevenDaySummary(logs) {
    var days = [];
    var mapped = {};
    var now = new Date();
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var index;
    var date;
    var key;

    start.setDate(start.getDate() - start.getDay());

    for (index = 0; index < 7; index += 1) {
      date = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      date.setDate(start.getDate() + index);
      key = localDateKey(date);
      mapped[key] = {
        date: key,
        calories: 0,
        duration_minutes: 0,
        activity_count: 0
      };
      days.push(mapped[key]);
    }

    (logs || []).forEach(function (log) {
      key = String(log.log_date || '').substring(0, 10);
      if (!mapped[key]) {
        return;
      }
      mapped[key].calories += Number(log.estimated_calories || 0);
      mapped[key].duration_minutes += Number(log.duration_minutes || 0);
      mapped[key].activity_count += 1;
    });

    return days;
  }

  function normalizeSummaryToCurrentWeek(summary, logs) {
    var days = buildClientSevenDaySummary(logs || []);
    var mapped = {};

    (summary || []).forEach(function (item) {
      mapped[String(item.date || '').substring(0, 10)] = item;
    });

    return days.map(function (day) {
      var serverItem = mapped[day.date];
      if (!serverItem) {
        return day;
      }
      return {
        date: day.date,
        calories: Number(serverItem.calories || 0),
        duration_minutes: Number(serverItem.duration_minutes || 0),
        activity_count: Number(serverItem.activity_count || 0)
      };
    });
  }

  function renderSevenDayCalories(summary) {
    var container = byId('weeklyCaloriesList');
    var total = 0;
    var max = 0;
    var totalActivities = 0;
    var bars = '';
    var firstLabel;
    var lastLabel;

    if (!container) {
      return;
    }

    summary = summary && summary.length ? summary : buildClientSevenDaySummary([]);
    summary.forEach(function (item) {
      total += Number(item.calories || 0);
      max = Math.max(max, Number(item.calories || 0));
      totalActivities += Number(item.activity_count || 0);
    });

    setText('sevenDayCaloriesTotal', formatNumber(total));

    summary.forEach(function (item, index) {
      var calories = Number(item.calories || 0);
      var height = max > 0 ? Math.max(7, Math.round((calories / max) * 100)) : 7;
      var isPeak = max > 0 && calories === max;

      bars +=
        '<span class="modern-chart-bar' + (isPeak ? ' is-peak' : '') + '" title="' +
        escapeHtml(shortDate(item.date) + ' - ' + formatNumber(calories) + ' cal') +
        '" style="--bar-height:' + height + '%">' +
          '<b>' + formatNumber(calories) + '</b>' +
          '<i></i>' +
          '<small>' + escapeHtml(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index] || '') + '</small>' +
        '</span>';
    });

    firstLabel = summary.length ? shortDate(summary[0].date) : '-';
    lastLabel = summary.length ? shortDate(summary[summary.length - 1].date) : '-';

    container.innerHTML =
      '<article class="modern-calorie-chart">' +
        '<div class="modern-chart-head">' +
          '<div>' +
            '<span class="modern-chart-label">7-Day Calories</span>' +
            '<strong>' + formatNumber(total) + '<em> cal</em></strong>' +
          '</div>' +
          '<div class="modern-chart-meta">' +
            '<span>' + formatNumber(totalActivities) + 'x</span>' +
            '<small>workouts</small>' +
          '</div>' +
        '</div>' +
        '<div class="modern-chart-bars" aria-label="7-day calorie progress">' + bars + '</div>' +
        '<div class="modern-chart-foot">' +
          '<span>' + escapeHtml(firstLabel) + '</span>' +
          '<strong>' + escapeHtml(lastLabel) + '</strong>' +
        '</div>' +
      '</article>';
  }

  function renderNotifications(list) {
    var container = byId('memberNotifications');
    container.innerHTML = '';

    if (!list || !list.length) {
      container.innerHTML = '<div class="info-card empty-state">' + t('member.no_notifications') + '</div>';
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

  function renderActivities(list) {
    var categorySelect = byId('activityCategorySelect');
    var machineSelect = byId('activitySelect');
    var placeholder;
    var order = activityCategoryOrder.slice();

    if (!categorySelect || !machineSelect) {
      return;
    }

    availableActivities = list || [];
    activityGroups = {};
    categorySelect.innerHTML = '';
    machineSelect.innerHTML = '';

    if (!list || !list.length) {
      placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = t('member.no_activities');
      placeholder.disabled = true;
      categorySelect.appendChild(placeholder.cloneNode(true));
      machineSelect.appendChild(placeholder);
      updateWorkoutFields();
      return;
    }

    order.forEach(function (category) {
      activityGroups[category] = [];
    });

    list.forEach(function (item) {
      var category = item.category || 'Other';
      if (!activityGroups[category]) {
        activityGroups[category] = [];
        order.push(category);
      }
      activityGroups[category].push(item);
    });

    order.forEach(function (category) {
      var option;
      if (!activityGroups[category] || !activityGroups[category].length) {
        return;
      }
      option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });

    renderMachinesForCategory(categorySelect.value);
  }

  function renderMachinesForCategory(category) {
    var machineSelect = byId('activitySelect');
    var items = activityGroups[category] || [];
    var placeholder;

    if (!machineSelect) {
      return;
    }

    machineSelect.innerHTML = '';

    if (!items.length) {
      placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = t('member.no_activities');
      placeholder.disabled = true;
      machineSelect.appendChild(placeholder);
      updateWorkoutFields();
      return;
    }

    items.forEach(function (item) {
      var option = document.createElement('option');
      option.value = item.activity_id;
      option.dataset.name = item.activity_name || '';
      option.dataset.category = item.category || '';
      option.textContent = item.activity_name;
      machineSelect.appendChild(option);
    });

    updateWorkoutFields();
  }

  function selectedActivityMeta() {
    var select = byId('activitySelect');
    var option;
    var name;
    var category;

    if (!select || select.selectedIndex < 0) {
      return { isTreadmill: false, name: '', category: '' };
    }

    option = select.options[select.selectedIndex];
    name = (option.dataset.name || option.textContent || '').toLowerCase();
    category = (option.dataset.category || '').toLowerCase();

    return {
      isTreadmill: name.indexOf('treadmill') !== -1 || category.indexOf('cardio') !== -1,
      name: name,
      category: category
    };
  }

  function setRequired(id, required) {
    var input = byId(id);
    if (input) {
      input.required = !!required;
    }
  }

  function updateWorkoutFields() {
    var meta = selectedActivityMeta();
    var strengthFields = byId('strengthWorkoutFields');
    var treadmillFields = byId('treadmillWorkoutFields');

    if (strengthFields) {
      strengthFields.hidden = meta.isTreadmill;
    }
    if (treadmillFields) {
      treadmillFields.hidden = !meta.isTreadmill;
    }

    setRequired('strengthWeightKg', !meta.isTreadmill);
    setRequired('strengthReps', !meta.isTreadmill);
    setRequired('strengthSets', !meta.isTreadmill);
    setRequired('treadmillSpeed', meta.isTreadmill);
    setRequired('treadmillIncline', meta.isTreadmill);
    setRequired('durationMinutes', meta.isTreadmill);
  }

  function renderWorkoutLogs(logs) {
    var container = byId('todayWorkoutList');
    container.innerHTML = '';

    if (!logs || !logs.length) {
      container.innerHTML = '<div class="info-card empty-state">' + t('member.no_logs_7_days') + '</div>';
      return;
    }

    logs.forEach(function (log) {
      var card = document.createElement('article');
      card.className = 'info-card workout-log-card';
      card.innerHTML =
        '<div>' +
        '<strong>' + escapeHtml(log.activity_name) + '</strong>' +
        '<p>' + t('member.log_line', {
          minutes: formatNumber(log.duration_minutes),
          calories: formatNumber(log.estimated_calories)
        }) + '</p>' +
        '<span>' + escapeHtml(log.note || '') + '</span>' +
        '</div>' +
        '<time>' + escapeHtml(formatDate(log.log_date)) + '</time>';
      container.appendChild(card);
    });
  }

  function updateCheckinState(data) {
    if (!data || !Object.prototype.hasOwnProperty.call(data, 'checked_in_today')) {
      return;
    }

    if (data.checked_in_today) {
      setMessage('memberCheckinMessage', t('member.checkin_status_done'), 'is-success');
    } else {
      setMessage('memberCheckinMessage', t('member.checkin_status_waiting'), 'is-warning');
    }
  }

  function notifyMembershipExpiry(member) {
    var left = daysLeft(member && member.end_date);
    var title;
    var body;
    var storageKey;

    if (!('Notification' in window) || !member || left > 7) {
      return;
    }

    title = left < 0 ? 'Trace Gym membership expired' : 'Trace Gym membership reminder';
    body = left < 0
      ? 'Your membership has expired. Please renew at the gym.'
      : 'Your membership will expire in ' + left + ' day(s).';
    storageKey = 'gym_expiry_notice_' + (member.member_id || 'member') + '_' + localDateKey(new Date());

    try {
      if (localStorage.getItem(storageKey)) {
        return;
      }
    } catch (error) {}

    function sendNotice() {
      try {
        new Notification(title, {
          body: body,
          tag: 'trace-gym-membership',
          icon: 'assets/trace-gym-logo.png'
        });
        localStorage.setItem(storageKey, '1');
      } catch (error) {}
    }

    if (Notification.permission === 'granted') {
      sendNotice();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(function (permission) {
        if (permission === 'granted') {
          sendNotice();
        }
      });
    }
  }

  function renderDashboard(data) {
    var member = data.member || {};
    var sevenDayLogs = data.workout_logs_7_days || data.workout_logs_today || [];
    var sevenDaySummary = normalizeSummaryToCurrentWeek(data.seven_day_activity_summary, sevenDayLogs);

    dashboardData = data;
    saveDashboardCache(data);
    setText('memberNameHeading', member.full_name || t('member.sidebar_title'));
    setText('memberStatusText', t('member.status_active_until', {
      date: formatDate(member.end_date),
      status: translateValue(member.status || 'pending')
    }));
    setText('todayCalories', formatNumber(data.calories_today));
    setText('sevenDayCaloriesTotal', formatNumber(data.calories_7_days || 0));
    setText('memberBmi', formatNumber(data.bmi));
    setText('membershipDaysLeft', formatNumber(daysLeft(member.end_date)));
    setText('trainerStatus', translateValue(member.personal_trainer || 'No'));

    renderNotifications(data.notifications || []);
    renderActivities(data.activities || []);
    renderSevenDayCalories(sevenDaySummary);
    renderWorkoutLogs(sevenDayLogs);
    updateCheckinState(data);
    notifyMembershipExpiry(member);
  }

  function loadDashboard() {
    var cached = loadDashboardCache();

    if (cached) {
      renderDashboard(cached);
      setText('memberStatusText', t('member.cached_refreshing'));
    }

    return api.getMemberDashboard(auth.getSession())
      .then(renderDashboard)
      .catch(function (error) {
        if (cached) {
          setText('memberStatusText', t('member.cached_only'));
          setMessage('workoutMessage', error && error.message ? error.message : t('member.dashboard_failed'), 'is-warning');
          return;
        }

        if (error && error.message && error.message.toLowerCase().indexOf('session expired') !== -1 && auth.clearSession) {
          auth.clearSession();
          window.location.href = 'index.html';
          return;
        }

        setText('memberStatusText', error && error.message ? error.message : t('member.dashboard_failed'));
      });
  }

  function stopMemberScanner() {
    var video = byId('memberScannerVideo');

    if (scannerControls && typeof scannerControls.stop === 'function') {
      scannerControls.stop();
    }

    scannerControls = null;
    scannerLocked = false;

    if (video) {
      video.pause();
      video.srcObject = null;
      video.hidden = true;
    }

    if (byId('startMemberScannerButton')) {
      byId('startMemberScannerButton').hidden = false;
    }

    if (byId('stopMemberScannerButton')) {
      byId('stopMemberScannerButton').hidden = true;
    }
  }

  function handleMemberCheckinScan(code) {
    if (scannerLocked) {
      return;
    }
    scannerLocked = true;
    setMessage('memberCheckinMessage', t('member.checking_in'), 'is-warning');

    api.recordMemberArrival(auth.getSession(), code)
      .then(function () {
        setMessage('memberCheckinMessage', t('member.checkin_success'), 'is-success');
        stopMemberScanner();
        return loadDashboard();
      })
      .catch(function (error) {
        var message = error && error.message ? error.message : t('member.checkin_invalid');
        scannerLocked = false;

        if (message === 'This member has already checked in today.') {
          message = t('member.checkin_already');
        } else if (message === 'This is not the gym check-in QR code.') {
          message = t('member.checkin_invalid');
        }

        setMessage('memberCheckinMessage', message, 'is-danger');
      });
  }

  function startCameraDecode(video, onResult) {
    var constraintsList = [
      {
        video: {
          facingMode: { exact: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      },
      {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      },
      {
        video: true,
        audio: false
      }
    ];

    function tryConstraint(index) {
      if (index >= constraintsList.length) {
        return Promise.reject(new Error(t('member.camera_not_supported')));
      }

      return zxingReader.decodeFromConstraints(constraintsList[index], video, function (result) {
        var code = result && typeof result.getText === 'function' ? result.getText() : '';
        if (code) {
          onResult(code);
        }
      }).catch(function (error) {
        if (index + 1 < constraintsList.length) {
          return tryConstraint(index + 1);
        }
        throw error;
      });
    }

    return tryConstraint(0);
  }

  function startMemberScanner() {
    var video = byId('memberScannerVideo');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMessage('memberCheckinMessage', t('member.camera_not_supported'), 'is-danger');
      return;
    }

    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      setMessage('memberCheckinMessage', 'Camera needs HTTPS on mobile. Open the hosted https:// website.', 'is-danger');
      return;
    }

    if (!window.ZXingBrowser || !window.ZXingBrowser.BrowserMultiFormatReader) {
      setMessage('memberCheckinMessage', t('member.camera_not_supported'), 'is-danger');
      return;
    }

    zxingReader = zxingReader || new window.ZXingBrowser.BrowserMultiFormatReader();
    video.hidden = false;
    video.setAttribute('playsinline', 'true');
    video.muted = true;
    byId('startMemberScannerButton').hidden = true;
    byId('stopMemberScannerButton').hidden = false;
    scannerLocked = false;
    setMessage('memberCheckinMessage', t('member.checkin_starting'), 'is-warning');

    startCameraDecode(video, handleMemberCheckinScan).then(function (controls) {
      scannerControls = controls;
      setMessage('memberCheckinMessage', t('member.checkin_ready'), 'is-success');
    }).catch(function (error) {
      stopMemberScanner();
      setMessage('memberCheckinMessage', mapCameraError(error), 'is-danger');
    });
  }

  function handleWorkoutSave(event) {
    var session = auth.getSession();
    var meta = selectedActivityMeta();
    var noteParts = [];
    var userNote = byId('workoutNote').value.trim();
    var sets = Number(byId('strengthSets') ? byId('strengthSets').value : 0) || 1;
    var weightKg = Number(byId('strengthWeightKg') ? byId('strengthWeightKg').value : 0) || 0;
    var reps = Number(byId('strengthReps') ? byId('strengthReps').value : 0) || 0;
    var speed = Number(byId('treadmillSpeed') ? byId('treadmillSpeed').value : 0) || 0;
    var incline = Number(byId('treadmillIncline') ? byId('treadmillIncline').value : 0) || 0;
    var treadmillMinutes = Number(byId('durationMinutes') ? byId('durationMinutes').value : 0) || 0;
    var estimatedCalories;
    var workout;

    event.preventDefault();
    setMessage('workoutMessage', t('member.saving_workout'), 'is-warning');

    if (meta.isTreadmill) {
      estimatedCalories = Math.round(speed * treadmillMinutes * (1 + (incline / 100)) * 6);
      noteParts.push('Speed: ' + speed + ' km/hr');
      noteParts.push('Incline: ' + incline + '%');
      noteParts.push('Time: ' + treadmillMinutes + ' min');
      noteParts.push('Calories: ' + estimatedCalories);
      workout = {
        activity_id: byId('activitySelect').value,
        duration_minutes: treadmillMinutes,
        estimated_calories: estimatedCalories,
        note: noteParts.concat(userNote ? [userNote] : []).join(' | ')
      };
    } else {
      estimatedCalories = Math.round(weightKg * reps * sets);
      noteParts.push('Weight: ' + weightKg + ' kg');
      noteParts.push('Reps: ' + reps);
      noteParts.push('Sets: ' + sets);
      noteParts.push('Calories: ' + estimatedCalories);
      workout = {
        activity_id: byId('activitySelect').value,
        duration_minutes: Math.max(5, sets * 5),
        estimated_calories: estimatedCalories,
        note: noteParts.concat(userNote ? [userNote] : []).join(' | ')
      };
    }

    api.recordWorkout(session, workout)
      .then(function () {
        event.target.reset();
        updateWorkoutFields();
        setMessage('workoutMessage', t('member.workout_saved'), 'is-success');
        return loadDashboard();
      })
      .catch(function (error) {
        setMessage('workoutMessage', error && error.message ? error.message : t('member.workout_failed'), 'is-danger');
      });
  }

  function init() {
    var form;

    if (!auth.protectPage('member')) {
      return;
    }

    form = byId('workoutForm');
    if (form) {
      form.addEventListener('submit', handleWorkoutSave);
    }

    if (byId('activitySelect')) {
      byId('activitySelect').addEventListener('change', updateWorkoutFields);
    }

    if (byId('activityCategorySelect')) {
      byId('activityCategorySelect').addEventListener('change', function (event) {
        renderMachinesForCategory(event.target.value);
      });
    }

    if (byId('startMemberScannerButton')) {
      byId('startMemberScannerButton').addEventListener('click', startMemberScanner);
    }

    if (byId('stopMemberScannerButton')) {
      byId('stopMemberScannerButton').addEventListener('click', stopMemberScanner);
    }

    document.addEventListener('gym-language-change', function () {
      if (dashboardData) {
        renderDashboard(dashboardData);
      }
    });

    window.addEventListener('beforeunload', stopMemberScanner);
    loadDashboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
