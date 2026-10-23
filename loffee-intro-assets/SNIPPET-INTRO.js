// Loffee intro: append at the end of the existing script.js; do not replace existing code.
(() => {
  const intro = document.getElementById('loffeeIntro');
  if (!intro) return;
  const skip = document.getElementById('loffeeIntroSkip');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let alreadySeen = false;
  try { alreadySeen = sessionStorage.getItem('loffeeIntroSeen') === '1'; } catch (_) {}
  const finish = () => {
    intro.classList.add('is-leaving');
    try { sessionStorage.setItem('loffeeIntroSeen', '1'); } catch (_) {}
    window.setTimeout(() => intro.remove(), 1050);
  };
  if (alreadySeen || reducedMotion) {
    intro.remove();
    return;
  }
  skip?.addEventListener('click', finish);
  window.setTimeout(finish, 3800);
})();
