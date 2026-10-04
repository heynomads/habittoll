// habittoll.com: the "Worth it?" ticket to try, and objects that settle in as they scroll into view.
// Every page reads the same without it.
(() => {
  const revealed = document.querySelectorAll('.reveal');
  // Shown at once wherever there's no viewport to watch (a hidden tab, a renderer): never left invisible.
  if ('IntersectionObserver' in window && window.innerHeight > 0) {
    const watch = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        watch.unobserve(entry.target);
      }
    }, { threshold: 0.3, rootMargin: '0px 0px -6% 0px' });
    revealed.forEach((el) => watch.observe(el));
  } else {
    revealed.forEach((el) => el.classList.add('is-in'));
  }

  // "I'll pay when it's worth it.": press and hold until the ink fills it (HoldToCommitButton, 1.4 s). A keyboard or
  // VoiceOver press completes it at once, like the app's accessibility action.
  const hold = document.querySelector('[data-hold]');
  if (hold) {
    const label = hold.querySelector('.hold-label');
    const duration = 1400;
    let timers = [];
    const stop = () => {
      timers.forEach(clearTimeout);
      timers = [];
      if (hold.hasAttribute('data-done')) return;
      hold.removeAttribute('data-holding');
      hold.removeAttribute('data-half');
    };
    const complete = () => {
      timers.forEach(clearTimeout);
      timers = [];
      hold.removeAttribute('data-holding');
      hold.setAttribute('data-done', '');
      label.textContent = hold.dataset.doneLabel;
    };
    hold.addEventListener('pointerdown', (event) => {
      if (hold.hasAttribute('data-done') || event.button > 0) return;
      try { hold.setPointerCapture(event.pointerId); } catch { /* still works without the capture */ }
      hold.setAttribute('data-holding', '');
      timers.push(setTimeout(() => hold.setAttribute('data-half', ''), duration / 2));
      timers.push(setTimeout(complete, duration));
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => hold.addEventListener(type, stop));
    hold.addEventListener('contextmenu', (event) => event.preventDefault());
    hold.addEventListener('click', (event) => {
      if (event.detail === 0 && !hold.hasAttribute('data-done')) complete();
    });
  }

  // The pay screen's ticket: "Not worth it" stamps it and counts the walk-away, "Pay" stamps it PAID, as in the app.
  const demo = document.querySelector('[data-demo]');
  if (!demo) return;
  const words = JSON.parse(demo.dataset.strings);
  const title = demo.querySelector('.result-title');
  const line = demo.querySelector('.result-line');
  const time = demo.querySelector('.stub-time');
  const again = demo.querySelector('[data-reset]');
  // Printed like the app's stub: "4 OCT AT 15:36".
  const locale = { en: 'en-GB', de: 'de-DE', es: 'es-ES' }[document.documentElement.lang] || 'en-GB';
  const day = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
  const clock = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  let walkedAway = 0;

  demo.addEventListener('click', (event) => {
    const choice = event.target.closest('[data-choice]');
    if (choice) {
      const kind = choice.dataset.choice;
      if (kind === 'walked') {
        walkedAway += 1;
        title.textContent = words.walked[0];
        line.textContent = walkedAway === 1 ? words.walked[1] : words.walked[2].replace('{n}', walkedAway);
      } else {
        title.textContent = words.paid[0];
        line.textContent = words.paid[1];
      }
      const now = new Date();
      time.textContent = `${day.format(now).replace('.', '')} ${words.at} ${clock.format(now)}`;
      demo.dataset.state = kind;
      again.focus({ preventScroll: true });
      return;
    }
    if (event.target.closest('[data-reset]')) {
      demo.dataset.state = 'offer';
      demo.querySelector('[data-choice="walked"]').focus({ preventScroll: true });
    }
  });
})();
