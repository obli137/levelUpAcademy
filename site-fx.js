/* levelUp Academy · animaciones del sitio (reveal al scrollear, luz que sigue al cursor, detalles). */
(function () {
  if (window.__lvfx) return;
  window.__lvfx = 1;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var EASE = 'cubic-bezier(.2,.7,.2,1)';
  var GRID = 52;
  var seen = new WeakSet();
  var spot = null;

  function show(el) {
    var d = +el.dataset.fxDelay || 0;
    el.animate(
      [{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }],
      { duration: 800, delay: d, easing: EASE, fill: 'backwards' }
    );
    el.style.opacity = '';
  }

  var io = reduce ? null : new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      show(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

  function setupSpot(root) {
    if (spot || !fine || reduce) return;
    spot = document.createElement('div');
    spot.setAttribute('aria-hidden', 'true');
    spot.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;';
    var glow = document.createElement('div');
    glow.style.cssText = 'position:absolute;inset:0;background:radial-gradient(circle 460px at var(--mx) var(--my),rgba(255,255,255,.07),rgba(255,255,255,.02) 45%,transparent 72%);';
    var lines = document.createElement('div');
    lines.style.cssText = 'position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.2) 1px,transparent 1px);background-size:' + GRID + 'px ' + GRID + 'px;' +
      '-webkit-mask-image:radial-gradient(circle 300px at var(--mx) var(--my),#000 0%,rgba(0,0,0,.35) 45%,transparent 100%);mask-image:radial-gradient(circle 300px at var(--mx) var(--my),#000 0%,rgba(0,0,0,.35) 45%,transparent 100%);';
    spot.appendChild(glow);
    spot.appendChild(lines);
    document.body.insertBefore(spot, document.body.firstChild);

    var tx = innerWidth * 0.82, ty = 140, x = tx, y = ty, raf = 0;
    function tick() {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      spot.style.setProperty('--mx', x.toFixed(1) + 'px');
      spot.style.setProperty('--my', y.toFixed(1) + 'px');
      lines.style.backgroundPosition = '0 ' + (-(window.scrollY % GRID)) + 'px';
      raf = (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) ? requestAnimationFrame(tick) : 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }
    addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; kick(); }, { passive: true });
    addEventListener('scroll', kick, { passive: true });
    kick();
  }

  function scan() {
    var root = document.querySelector('[data-screen-label]');
    if (!root) return;
    setupSpot(root);
    if (reduce) return;

    root.querySelectorAll('[data-fx="pulse"]').forEach(function (el) {
      if (seen.has(el)) return;
      seen.add(el);
      el.animate(
        [{ boxShadow: '0 0 0 0 rgba(255,59,48,.6)' }, { boxShadow: '0 0 0 10px rgba(255,59,48,0)' }],
        { duration: 1800, iterations: Infinity, easing: 'ease-out' }
      );
    });

    root.querySelectorAll('[data-fx="bar"]').forEach(function (el, i) {
      if (seen.has(el)) return;
      seen.add(el);
      var target = parseFloat(el.style.width) || 0;
      var delay = 700 + i * 160, dur = 1200;
      el.animate(
        [{ width: '0%' }, { width: target + '%' }],
        { duration: dur, delay: delay, easing: EASE, fill: 'backwards' }
      );
      var row = el.parentNode && el.parentNode.parentNode;
      var num = row && row.lastElementChild;
      if (!num || num.children.length || !/^\d+%$/.test(num.textContent.trim())) return;
      var t0 = performance.now() + delay;
      num.textContent = '0%';
      (function step(now) {
        var p = Math.min(1, Math.max(0, (now - t0) / dur));
        var k = 1 - Math.pow(1 - p, 3);
        num.textContent = Math.round(target * k) + '%';
        if (p < 1) requestAnimationFrame(step);
        else num.textContent = target + '%';
      })(performance.now());
    });

    var secs = root.querySelectorAll('main > section, footer > div');
    secs.forEach(function (s, si) {
      var isHero = si === 0 && s.parentNode.tagName === 'MAIN';
      var kids = [].slice.call(s.children);
      var items = [];
      if (isHero && kids[0] && kids[0].tagName === 'DIV' && kids[0].children.length > 1 && getComputedStyle(kids[0]).display === 'flex') {
        [].forEach.call(kids[0].children, function (c) { items.push([c, 0]); });
        kids.slice(1).forEach(function (k) { items.push([k, 0]); });
      } else {
        kids.forEach(function (k) {
          var n = k.children.length;
          if (getComputedStyle(k).display === 'grid' && n > 1 && n <= 12) {
            [].forEach.call(k.children, function (c, i) { items.push([c, i * 70]); });
          } else {
            items.push([k, 0]);
          }
        });
      }
      items.forEach(function (it, i) {
        var el = it[0];
        if (seen.has(el)) return;
        seen.add(el);
        if (isHero) { el.dataset.fxDelay = 60 + i * 90; show(el); return; }
        if (el.getBoundingClientRect().top < innerHeight * 0.92) return;
        el.dataset.fxDelay = it[1];
        el.style.opacity = '0';
        io.observe(el);
      });
    });
  }

  var pending = 0;
  function queue() {
    if (pending) return;
    pending = requestAnimationFrame(function () { pending = 0; scan(); });
  }
  new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState !== 'loading') queue();
  else document.addEventListener('DOMContentLoaded', queue);
})();
