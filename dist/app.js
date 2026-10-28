(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  // Static content is readable if JavaScript or observers are unavailable.
  if ('IntersectionObserver' in window) {
    document.body.classList.add('js-motion');
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    $$('.reveal').forEach((element) => revealObserver.observe(element));

    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          $$('[data-nav]').forEach((link) => {
            if (link.dataset.nav === entry.target.id) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          });
        }
      });
    }, { rootMargin: '-15% 0px -55% 0px' });
    ['home', 'menu', 'place', 'questions'].forEach((id) => navObserver.observe(document.getElementById(id)));

    const morningScene = $('.hero-scene');
    if (morningScene) {
      let sceneVisible = false;
      const syncSceneMotion = () => morningScene.classList.toggle('scene-active', sceneVisible && !document.hidden);
      const sceneObserver = new IntersectionObserver(([entry]) => {
        sceneVisible = entry.isIntersecting;
        syncSceneMotion();
      });
      sceneObserver.observe(morningScene);
      document.addEventListener('visibilitychange', syncSceneMotion);
    }
  }

  const mobileNav = $('#mobile-nav');
  const menuToggle = $('.menu-toggle');
  const bookingDialog = $('#booking-dialog');
  const form = $('#booking-form');
  const formView = $('#booking-form-view');
  const result = $('#booking-result');
  const dateInput = $('#visit-date');
  const timeInput = $('#visit-time');
  const nameInput = $('#guest-name');
  const guestsInput = $('#guest-count');
  const submit = $('.form-submit');
  let pendingBooking;
  let lastBookTrigger;
  let reservation = null;
  const lockScroll = () => document.body.classList.toggle('modal-open', !!document.querySelector('dialog[open]'));

  function closeMenu() { mobileNav.classList.remove('is-open'); mobileNav.close(); }
  menuToggle.addEventListener('click', () => {
    mobileNav.showModal();
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Закрыть меню');
    lockScroll();
    requestAnimationFrame(() => mobileNav.classList.add('is-open'));
  });
  $('[data-close-menu]').addEventListener('click', closeMenu);
  mobileNav.addEventListener('close', () => {
    mobileNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Открыть меню');
    lockScroll();
  });
  $$('nav a', mobileNav).forEach((link) => link.addEventListener('click', closeMenu));
  $('.mobile-nav-top a').addEventListener('click', closeMenu);

  function moscowNow() {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const value = (type) => parts.find((part) => part.type === type).value;
    return { day: `${value('year')}-${value('month')}-${value('day')}`, minutes: Number(value('hour')) * 60 + Number(value('minute')) };
  }
  function addDays(isoDay, days) {
    const date = new Date(`${isoDay}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }
  function updateDateBounds() {
    const now = moscowNow();
    dateInput.min = now.day;
    dateInput.max = addDays(now.day, 30);
    return now;
  }
  function updateTimes() {
    const now = updateDateBounds();
    const previous = timeInput.value;
    const fragment = document.createDocumentFragment();
    for (let minutes = 8 * 60; minutes <= 20 * 60 + 30; minutes += 30) {
      const value = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
      const option = new Option(value, value);
      option.disabled = dateInput.value === now.day && minutes < now.minutes + 30;
      fragment.append(option);
    }
    timeInput.replaceChildren(fragment);
    const available = [...timeInput.options].filter((option) => !option.disabled);
    if (!available.length) {
      timeInput.replaceChildren(new Option('На сегодня времени нет', ''));
    } else {
      const keep = available.find((option) => option.value === previous);
      timeInput.value = keep ? keep.value : (available.find((option) => option.value === '18:00') || available[0]).value;
    }
    updateSummary();
  }
  function dateLabel(value) {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' }).format(new Date(`${value}T12:00:00Z`));
  }
  function updateSummary() {
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(dateInput.value);
    $('#form-summary').textContent = validDate && timeInput.value
      ? `${dateLabel(dateInput.value)} · ${timeInput.value} · ${guestsInput.options[guestsInput.selectedIndex].text} · на полтора часа`
      : 'Выберите дату и доступное время для вашего визита.';
  }
  function clearError(input, id) { input.removeAttribute('aria-invalid'); document.getElementById(id).textContent = ''; }
  function setError(input, id, message) { input.setAttribute('aria-invalid', 'true'); document.getElementById(id).textContent = message; }
  function resetSubmit() { submit.disabled = false; submit.removeAttribute('aria-busy'); $('span', submit).textContent = 'Создать демобронь'; }
  function showForm() {
    formView.hidden = false;
    result.hidden = true;
    bookingDialog.setAttribute('aria-labelledby', 'dialog-title');
    resetSubmit();
  }

  $$('[data-book]').forEach((button) => button.addEventListener('click', () => {
    lastBookTrigger = button;
    $$('dialog[open]').forEach((dialog) => dialog.close());
    const now = updateDateBounds();
    if (!dateInput.value || dateInput.value < now.day) dateInput.value = now.minutes >= 20 * 60 ? addDays(now.day, 1) : now.day;
    updateTimes();
    if (!reservation) showForm();
    bookingDialog.showModal();
    lockScroll();
  }));
  $$('[data-close-book]').forEach((button) => button.addEventListener('click', (event) => { event.preventDefault(); bookingDialog.close(); }));
  bookingDialog.addEventListener('close', () => {
    clearTimeout(pendingBooking);
    resetSubmit();
    lockScroll();
    if (lastBookTrigger && !lastBookTrigger.closest('dialog:not([open])')) lastBookTrigger.focus({ preventScroll: true });
    else $('.hero-button').focus({ preventScroll: true });
  });
  bookingDialog.addEventListener('click', (event) => {
    if (event.target !== bookingDialog) return;
    const bounds = bookingDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) bookingDialog.close();
  });
  dateInput.addEventListener('change', () => { clearError(dateInput, 'date-error'); clearError(timeInput, 'time-error'); updateTimes(); });
  timeInput.addEventListener('change', () => { clearError(timeInput, 'time-error'); updateSummary(); });
  nameInput.addEventListener('input', () => clearError(nameInput, 'name-error'));
  guestsInput.addEventListener('change', updateSummary);

  const seats = { window: 'У окна', hall: 'В зале', shared: 'Общий стол' };
  function ticketField(title, content) {
    const wrapper = document.createElement('div');
    const dt = document.createElement('dt'); dt.textContent = title;
    const dd = document.createElement('dd'); dd.textContent = content;
    wrapper.append(dt, dd); return wrapper;
  }
  function showSuccess(data) {
    result.innerHTML = '<div class="result-symbol" aria-hidden="true">✓</div><p class="eyebrow">Только демонстрация</p><h2 id="result-title" tabindex="-1">Демобронь готова.</h2><p class="result-description"></p><div class="reservation-ticket"><dl></dl></div><p>Настоящий столик не зарезервирован. Данные никуда не отправлялись.</p><div class="result-actions"><button class="button" id="result-done">Готово <svg class="icon" aria-hidden="true" focusable="false"><use href="#arrow"/></svg></button><button class="text-button" id="cancel-reservation">Отменить демобронь</button></div>';
    $('.result-description', result).textContent = `${data.name}, так могло бы выглядеть подтверждение вашего визита.`;
    const dl = $('dl', result);
    dl.append(ticketField('Ваше имя', data.name), ticketField('Дата и время', `${dateLabel(data.date)}, ${data.time}`), ticketField('Гости', String(data.guests)), ticketField('Место', seats[data.seat]));
    $('.result-actions', result).style.marginTop = '24px';
    formView.hidden = true;
    result.hidden = false;
    bookingDialog.setAttribute('aria-labelledby', 'result-title');
    $('#result-done').addEventListener('click', () => bookingDialog.close());
    $('#cancel-reservation').addEventListener('click', cancelReservation);
    $('#result-title').focus();
  }
  function cancelReservation() {
    reservation = null;
    result.innerHTML = '<div class="result-symbol" aria-hidden="true">↶</div><h2 id="cancel-title" tabindex="-1">Демобронь отменена.</h2><p>Можно выбрать другой день или вернуться к меню. Никаких сообщений и звонков не будет.</p><div class="result-actions"><button class="button" id="book-again">Выбрать другую дату <svg class="icon" aria-hidden="true" focusable="false"><use href="#arrow"/></svg></button><button class="text-button" id="return-to-site">Вернуться на сайт</button></div>';
    $('.result-actions', result).style.marginTop = '24px';
    bookingDialog.setAttribute('aria-labelledby', 'cancel-title');
    $('#book-again').addEventListener('click', () => { showForm(); dateInput.focus(); });
    $('#return-to-site').addEventListener('click', () => bookingDialog.close());
    $('#cancel-title').focus();
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    const now = updateDateBounds();
    clearError(dateInput, 'date-error'); clearError(timeInput, 'time-error'); clearError(nameInput, 'name-error');
    const name = nameInput.value.trim();
    if (!dateInput.value) setError(dateInput, 'date-error', 'Выберите день визита.');
    else if (dateInput.value < now.day || dateInput.value > dateInput.max) setError(dateInput, 'date-error', 'Выберите дату в ближайшие 30 дней.');
    const [hour, minute] = timeInput.value.split(':').map(Number);
    const timeMinutes = hour * 60 + minute;
    if (!timeInput.value || (dateInput.value === now.day && timeMinutes < now.minutes + 30) || timeMinutes < 480 || timeMinutes > 1230) setError(timeInput, 'time-error', 'Выберите доступное время. На сегодня мест может не быть.');
    if (name.length < 2 || name.length > 40) setError(nameInput, 'name-error', 'Введите имя от 2 до 40 символов. Можно вымышленное.');
    const invalid = $('[aria-invalid="true"]', form);
    if (invalid) { invalid.focus(); return; }
    const data = { name, date: dateInput.value, time: timeInput.value, guests: guestsInput.value, seat: $('input[name="seat"]:checked', form).value };
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    $('span', submit).textContent = 'Готовим демоподтверждение';
    // Simulated response only. No fetch, storage, cookies, email or network request.
    pendingBooking = setTimeout(() => { reservation = data; resetSubmit(); showSuccess(data); }, 600);
  });

  // Image failure has a composed fallback, never an empty broken thumbnail.
  function showImageFallback(img) {
    if (img.nextElementSibling?.classList.contains('image-fallback')) return;
    const caption = document.createElement('p');
    caption.className = 'image-fallback';
    caption.textContent = 'Изображение не загрузилось. Обновите страницу.';
    img.hidden = true;
    img.after(caption);
    img.addEventListener('load', () => {
      img.hidden = false;
      caption.remove();
    }, { once: true });
  }
  document.addEventListener('error', (event) => {
    if (event.target instanceof HTMLImageElement) showImageFallback(event.target);
  }, true);
  $$('img').filter((img) => img.complete && !img.naturalWidth).forEach(showImageFallback);
})();
