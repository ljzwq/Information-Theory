/*
 * Звуки сайта:
 *  - data-sound="aura" (имя и аватарка на главной) — играет, пока не нажмут в другое место;
 *  - data-sound="result" (кнопки, которые дают результат);
 *  - переход на другую страницу сайта — звук доигрывает, потом открывается страница
 *    (кроме карточек «Открыть» на главной: они без звука).
 */
(() => {
  'use strict';

  const FILES = {
    aura: 'sounds/aura-of-letter-t.mp3',
    result: 'sounds/oh-my-god-meme.mp3',
    nav: 'sounds/faaah.mp3',
  };
  /** Дольше этого переход не ждёт, даже если звук не доиграл или не загрузился, мс. */
  const NAV_MAX_WAIT = 2500;

  const players = {};
  let current = null;
  let leaving = false;

  function player(name) {
    if (!players[name]) {
      players[name] = new Audio(FILES[name]);
      players[name].preload = 'auto';
    }
    return players[name];
  }

  function stop() {
    if (!current) return;
    current.pause();
    current.currentTime = 0;
    current = null;
  }

  /** Запускает звук с начала, остановив предыдущий. Возвращает промис play(). */
  function play(name) {
    stop();
    const audio = player(name);
    audio.currentTime = 0;
    current = audio;
    return audio.play();
  }

  /** Ссылка на страницу этого же сайта, которую открывают в той же вкладке. */
  function isSiteLink(link, e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (link.target && link.target !== '_self') return false;
    return link.origin === location.origin && /\.html$/.test(link.pathname);
  }

  function goTo(url) {
    if (leaving) return;
    leaving = true;
    const audio = player('nav');
    const go = () => location.assign(url);
    const timer = setTimeout(go, NAV_MAX_WAIT);
    audio.onended = () => {
      clearTimeout(timer);
      go();
    };
    play('nav').catch(() => {
      clearTimeout(timer);
      go();
    });
  }

  document.addEventListener('click', (e) => {
    const marked = e.target.closest('[data-sound]');
    const link = e.target.closest('a[href]');

    if (marked && marked.dataset.sound === 'aura') {
      play('aura').catch(() => {});
    } else if (marked && marked.dataset.sound === 'result') {
      play('result').catch(() => {});
    } else if (link && link.matches('.tile')) {
      // карточки «Открыть» на главной открываются сразу, без звука
      stop();
    } else if (link && isSiteLink(link, e)) {
      e.preventDefault();
      goTo(link.href);
    } else {
      // нажали мимо — глушим то, что играет
      stop();
    }
  });

  // Возврат кнопкой «Назад»: страница может восстановиться из кэша в середине перехода.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    leaving = false;
    stop();
  });

  // Загружаем заранее звуки, которые есть на этой странице, чтобы они играли без задержки.
  player('nav');
  if (document.querySelector('[data-sound="aura"]')) player('aura');
  if (document.querySelector('[data-sound="result"]')) player('result');
})();
