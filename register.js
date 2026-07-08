(function () {
  'use strict';

  var api = window.GYM_API || {};
  var common = window.GYM_COMMON || {};
  var i18n = window.GYM_I18N || {};
  var photoDataUrl = '';

  function byId(id) { return common.byId(id); }
  function setMessage(id, message, type) { return common.setMessage(id, message, type); }
  function t(key, params) { return i18n.t ? i18n.t(key, params) : key; }

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

  function collectForm() {
    return {
      full_name: byId('fullName').value.trim(),
      phone: byId('phone').value.trim(),
      email: byId('email').value.trim(),
      nrc: byId('nrc').value.trim(),
      password: byId('memberPassword').value,
      password_confirm: byId('memberPasswordConfirm').value,
      gender: byId('gender').value,
      age: byId('age').value,
      weight_kg: convertWeightToKg(byId('weightKg').value, byId('weightUnit').value),
      height_cm: convertHeightToCm(byId('heightCm').value, byId('heightUnit').value),
      start_date: byId('startDate').value,
      membership_months: byId('membershipMonths').value,
      personal_trainer: byId('personalTrainer').value,
      goal_note: byId('trainerNotes').value.trim(),
      photo_data: photoDataUrl
    };
  }

  function stopCamera() {
  }

  function setPreview(dataUrl) {
    var preview = byId('photoPreview');
    var placeholder = byId('photoPlaceholder');
    var retakeButton = byId('retakePhotoButton');

    photoDataUrl = dataUrl || '';

    if (!preview || !placeholder) {
      return;
    }

    if (photoDataUrl) {
      preview.src = photoDataUrl;
      preview.hidden = false;
      placeholder.hidden = true;
      if (retakeButton) {
        retakeButton.hidden = false;
      }
    } else {
      preview.removeAttribute('src');
      preview.hidden = true;
      placeholder.hidden = false;
      if (retakeButton) {
        retakeButton.hidden = true;
      }
    }
  }

  function drawToSizedCanvas(source, callback) {
    var canvas = byId('photoCanvas');
    var context;
    var width;
    var height;
    var maxSize = 720;
    var scale;

    if (!canvas) {
      callback('');
      return;
    }

    width = source.videoWidth || source.naturalWidth || source.width;
    height = source.videoHeight || source.naturalHeight || source.height;

    if (!width || !height) {
      callback('');
      return;
    }

    scale = Math.min(1, maxSize / Math.max(width, height));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context = canvas.getContext('2d');
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    callback(canvas.toDataURL('image/jpeg', 0.82));
  }

  function handleFileChange(event) {
    var file = event.target.files && event.target.files[0];
    var reader;
    var image;

    if (!file) {
      return;
    }

    reader = new FileReader();
    reader.onload = function (loadEvent) {
      image = new Image();
      image.onload = function () {
        drawToSizedCanvas(image, function (dataUrl) {
          setPreview(dataUrl);
          setMessage('photoMessage', t('register.photo_ready'), 'is-success');
        });
      };
      image.src = loadEvent.target.result;
    };
    reader.readAsDataURL(file);
  }

  function openPhotoPicker() {
    if (byId('photoUpload')) {
      byId('photoUpload').click();
    }
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
    var heightInput = byId('heightCm');
    var heightUnit = byId('heightUnit');

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

  function handleSubmit(event) {
    var payload = collectForm();
    var button = byId('registerButton');

    event.preventDefault();

    if (payload.password !== payload.password_confirm) {
      setMessage('registerMessage', t('register.password_mismatch'), 'is-danger');
      return;
    }

    if (!payload.photo_data) {
      setMessage('registerMessage', t('register.photo_required'), 'is-danger');
      return;
    }

    button.disabled = true;
    setMessage('registerMessage', t('register.submitting'), 'is-warning');

    api.registerMember(payload)
      .then(function (data) {
        event.target.reset();
        stopCamera();
        setPreview('');
        setMessage('photoMessage', '', '');
        try {
          localStorage.setItem('gym_admin_refresh_signal', String(Date.now()));
        } catch (storageError) {}
        if (byId('startDate')) {
          byId('startDate').value = new Date().toISOString().slice(0, 10);
        }
        setMessage('registerMessage', ((data && data.message) || t('register.success')) + ' ' + t('register.pending_notice'), 'is-success');
      })
      .catch(function (error) {
        setMessage('registerMessage', error && error.message ? error.message : t('register.failed'), 'is-danger');
      })
      .finally(function () {
        button.disabled = false;
      });
  }

  function init() {
    var form = byId('registrationForm');
    var startDate = byId('startDate');

    if (startDate && !startDate.value) {
      startDate.value = new Date().toISOString().slice(0, 10);
    }

    if (form) {
      form.addEventListener('submit', handleSubmit);
    }

    bindPasswordToggles();
    bindUnitHints();

    if (byId('photoUpload')) {
      byId('photoUpload').addEventListener('change', handleFileChange);
    }

    if (byId('choosePhotoButton')) {
      byId('choosePhotoButton').addEventListener('click', openPhotoPicker);
    }

    if (byId('retakePhotoButton')) {
      byId('retakePhotoButton').addEventListener('click', function () {
        setPreview('');
        openPhotoPicker();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
