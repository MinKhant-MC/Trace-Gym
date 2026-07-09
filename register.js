(function () {
  'use strict';

  var api = window.GYM_API || {};
  var common = window.GYM_COMMON || {};
  var i18n = window.GYM_I18N || {};
  var photoDataUrl = '';
  var photoStream = null;

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
    var phone = byId('phone').value.trim();
    return {
      full_name: byId('fullName').value.trim(),
      phone: phone,
      email: byId('email').value.trim(),
      nrc: phone,
      password: byId('memberPassword').value,
      password_confirm: byId('memberPasswordConfirm').value,
      gender: byId('gender').value,
      age: byId('age').value,
      weight_kg: convertWeightToKg(byId('weightKg').value, byId('weightUnit').value),
      height_cm: convertHeightToCm(byId('heightCm').value, byId('heightUnit').value),
      start_date: byId('startDate').value,
      membership_months: byId('membershipMonths').value,
      membership_fee: byId('incomeAmount').value,
      personal_trainer: byId('personalTrainer').value,
      goal_note: byId('trainerNotes').value.trim(),
      photo_data: photoDataUrl
    };
  }

  function stopPhotoCamera() {
    if (photoStream) {
      photoStream.getTracks().forEach(function (track) { track.stop(); });
    }
    photoStream = null;
    if (byId('photoCameraPreview')) {
      byId('photoCameraPreview').hidden = true;
      byId('photoCameraPreview').srcObject = null;
    }
    if (byId('capturePhotoButton')) {
      byId('capturePhotoButton').hidden = true;
    }
  }

  function setPhotoPreview(dataUrl) {
    var preview = byId('photoPreview');
    var placeholder = byId('photoPlaceholder');

    photoDataUrl = dataUrl || '';
    if (preview) {
      preview.src = photoDataUrl;
      preview.hidden = !photoDataUrl;
    }
    if (placeholder) {
      placeholder.hidden = Boolean(photoDataUrl);
    }
    if (byId('retakePhotoButton')) {
      byId('retakePhotoButton').hidden = !photoDataUrl;
    }
    setMessage('photoMessage', photoDataUrl ? t('register.photo_ready') : '', photoDataUrl ? 'is-success' : '');
  }

  function canvasFromImage(image, maxSize, quality) {
    var canvas = byId('photoCanvas') || document.createElement('canvas');
    var scale = Math.min(1, maxSize / Math.max(image.videoWidth || image.naturalWidth, image.videoHeight || image.naturalHeight));
    var width = Math.max(1, Math.round((image.videoWidth || image.naturalWidth) * scale));
    var height = Math.max(1, Math.round((image.videoHeight || image.naturalHeight) * scale));
    var context;

    canvas.width = width;
    canvas.height = height;
    context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality || 0.55);
  }

  function compactPhotoData(image) {
    var attempts = [
      { size: 360, quality: 0.58 },
      { size: 280, quality: 0.5 },
      { size: 220, quality: 0.42 }
    ];
    var result = '';
    var index;

    for (index = 0; index < attempts.length; index += 1) {
      result = canvasFromImage(image, attempts[index].size, attempts[index].quality);
      if (result.length < 45000) {
        return result;
      }
    }

    return result;
  }

  function handlePhotoFile(file) {
    var reader;
    var image;

    if (!file) {
      return;
    }

    reader = new FileReader();
    reader.onload = function () {
      image = new Image();
      image.onload = function () {
        stopPhotoCamera();
        setPhotoPreview(compactPhotoData(image));
      };
      image.onerror = function () {
        setMessage('photoMessage', t('register.photo_failed'), 'is-danger');
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function startPhotoCamera() {
    var video = byId('photoCameraPreview');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !video) {
      setMessage('photoMessage', t('register.camera_not_supported'), 'is-danger');
      return;
    }

    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      setMessage('photoMessage', 'Camera needs HTTPS on mobile. Open the hosted https:// website.', 'is-danger');
      return;
    }

    stopPhotoCamera();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' } }, audio: false })
      .then(function (stream) {
        photoStream = stream;
        video.srcObject = stream;
        video.hidden = false;
        video.play();
        if (byId('capturePhotoButton')) {
          byId('capturePhotoButton').hidden = false;
        }
        setMessage('photoMessage', t('register.camera_ready'), 'is-success');
      })
      .catch(function () {
        setMessage('photoMessage', t('register.camera_failed'), 'is-danger');
      });
  }

  function capturePhoto() {
    var video = byId('photoCameraPreview');
    if (!video || !video.srcObject) {
      setMessage('photoMessage', t('register.open_camera_first'), 'is-danger');
      return;
    }
    setPhotoPreview(compactPhotoData(video));
    stopPhotoCamera();
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
      setMessage('photoMessage', t('register.photo_required'), 'is-danger');
      return;
    }

    if (payload.photo_data.length > 50000) {
      setMessage('registerMessage', t('register.photo_too_large'), 'is-danger');
      setMessage('photoMessage', t('register.photo_too_large'), 'is-danger');
      return;
    }

    button.disabled = true;
    setMessage('registerMessage', t('register.submitting'), 'is-warning');

    api.registerMember(payload)
      .then(function (data) {
        event.target.reset();
        setPhotoPreview('');
        stopPhotoCamera();
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
      byId('photoUpload').addEventListener('change', function (event) {
        handlePhotoFile(event.target.files && event.target.files[0]);
      });
    }
    if (byId('choosePhotoButton')) {
      byId('choosePhotoButton').addEventListener('click', function () {
        byId('photoUpload').click();
      });
    }
    if (byId('startCameraButton')) {
      byId('startCameraButton').addEventListener('click', startPhotoCamera);
    }
    if (byId('capturePhotoButton')) {
      byId('capturePhotoButton').addEventListener('click', capturePhoto);
    }
    if (byId('retakePhotoButton')) {
      byId('retakePhotoButton').addEventListener('click', function () {
        setPhotoPreview('');
        if (byId('photoUpload')) {
          byId('photoUpload').value = '';
        }
      });
    }

    window.addEventListener('beforeunload', stopPhotoCamera);

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
