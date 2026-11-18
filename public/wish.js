/*
  WISH PAGE BEHAVIOUR (animation and music only, nothing is sent to the server)

  1. Floating confetti behind the card (its shape follows the occasion)
  2. "Open Surprise": start the music, confetti burst, swap the cover for the card
  3. Photos pop in as you scroll to them
  4. Music: mute button, and it steps aside while a video plays
*/
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLORS = ['var(--a1)', 'var(--a2)', 'var(--a3)', 'var(--text)'];

  // Which confetti shapes each decoration uses ('' = a plain little rectangle).
  var SHAPES = {
    bunting: ['', '', 'dot'],
    hearts:  ['heart', 'heart', 'heart', 'dot'],
    stars:   ['spark', 'spark', 'dot'],
    flowers: ['petal', 'petal', 'dot']
  };
  var shapes = SHAPES[document.body.dataset.decoration] || SHAPES.bunting;

  function rand(min, max) { return min + Math.random() * (max - min); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function shapeClass() { var s = pick(shapes); return s ? ' ' + s : ''; }

  // ----- 1. Ambient confetti -----
  var sky = document.getElementById('sky');
  if (sky && !reduceMotion) {
    for (var i = 0; i < 26; i++) {
      var dur = rand(14, 30);
      var el = document.createElement('span');
      el.className = 'confetti' + shapeClass();
      el.style.cssText =
        '--x:' + rand(0, 100).toFixed(1) + '%;' +
        '--s:' + rand(6, 12).toFixed(1) + 'px;' +
        '--c:' + pick(COLORS) + ';' +
        '--dur:' + dur.toFixed(1) + 's;' +
        '--delay:-' + rand(0, dur).toFixed(1) + 's;' + // negative: they start mid-fall
        '--sway:' + rand(-80, 80).toFixed(0) + 'px;' +
        '--rot:' + rand(300, 900).toFixed(0) + 'deg;';
      sky.appendChild(el);
    }
  }

  // ----- 4. Music -----
  // The <audio> and the button only exist when the wish has music.
  var music = document.getElementById('music');
  var musicBtn = document.getElementById('musicBtn');
  var wantMusic = true;        // becomes false when the person turns it off themselves
  var resumeAfterVideo = false;
  var fadeTimer = null;
  var VOLUME = 0.6;

  function showButton(on) {
    if (!musicBtn) return;
    musicBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    musicBtn.setAttribute('aria-label', on ? 'Turn the music off' : 'Turn the music on');
    musicBtn.classList.toggle('playing', on);
  }

  function anyVideoPlaying() {
    return Array.prototype.some.call(document.querySelectorAll('video'), function (v) {
      return !v.paused && !v.ended;
    });
  }

  function startMusic() {
    if (!music || !wantMusic) return;
    clearInterval(fadeTimer);
    music.volume = 0;
    var attempt = music.play();
    // If the browser refuses, just show the button as "off"; tapping it will play.
    if (attempt && attempt.catch) attempt.catch(function () { showButton(false); });
    showButton(true);
    // Fade the volume in over about 1.5 seconds so it never starts with a jolt.
    var volume = 0;
    fadeTimer = setInterval(function () {
      volume = Math.min(VOLUME, volume + 0.04);
      music.volume = volume;
      if (volume >= VOLUME) clearInterval(fadeTimer);
    }, 100);
  }

  function stopMusic() {
    if (!music) return;
    clearInterval(fadeTimer);
    music.pause();
    showButton(false);
  }

  if (musicBtn) {
    musicBtn.addEventListener('click', function () {
      if (music.paused) { wantMusic = true; resumeAfterVideo = false; startMusic(); }
      else { wantMusic = false; stopMusic(); }
    });
  }

  // While a video plays, pause the music; bring it back afterwards (if still wanted).
  document.addEventListener('play', function (event) {
    if (event.target.tagName !== 'VIDEO') return;
    document.querySelectorAll('video').forEach(function (v) { if (v !== event.target) v.pause(); }); // one video at a time
    if (music && !music.paused) { resumeAfterVideo = true; stopMusic(); }
  }, true); // "true" = capture: the play event doesn't bubble, so we listen on the way down

  function maybeResume(event) {
    if (event.target.tagName !== 'VIDEO') return;
    if (resumeAfterVideo && wantMusic && !anyVideoPlaying()) { resumeAfterVideo = false; startMusic(); }
  }
  document.addEventListener('pause', maybeResume, true);
  document.addEventListener('ended', maybeResume, true);

  // Do not keep playing in a tab or app the person has left.
  var pausedByLeaving = false;
  document.addEventListener('visibilitychange', function () {
    if (!music) return;
    if (document.hidden && !music.paused) { pausedByLeaving = true; music.pause(); }
    else if (!document.hidden && pausedByLeaving) {
      pausedByLeaving = false;
      if (wantMusic && !anyVideoPlaying()) music.play().catch(function () { showButton(false); });
    }
  });

  // ----- 2. Open Surprise -----
  var cover = document.getElementById('cover');
  var surprise = document.getElementById('surprise');
  var openBtn = document.getElementById('openBtn');

  function burst(fromEl) {
    var box = fromEl.getBoundingClientRect();
    var cx = box.left + box.width / 2;
    var cy = box.top + box.height / 2;
    var layer = document.createElement('div');
    layer.className = 'burst';
    layer.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 70; i++) {
      var angle = rand(-Math.PI, 0);          // shoot upward, in a fan
      var power = rand(120, 380);
      var p = document.createElement('span');
      p.className = 'piece' + shapeClass();
      p.style.cssText =
        '--x:' + cx.toFixed(0) + 'px;--y:' + cy.toFixed(0) + 'px;' +
        '--s:' + rand(7, 13).toFixed(1) + 'px;' +
        '--c:' + pick(COLORS) + ';' +
        '--dx:' + (Math.cos(angle) * power).toFixed(0) + 'px;' +
        '--dy:' + (Math.sin(angle) * power).toFixed(0) + 'px;' +
        '--rot:' + rand(-720, 720).toFixed(0) + 'deg;';
      layer.appendChild(p);
    }
    document.body.appendChild(layer);
    setTimeout(function () { layer.remove(); }, 2200);
  }

  function showSurprise() {
    cover.hidden = true;
    surprise.hidden = false;
    surprise.classList.add('reveal');
    if (musicBtn) musicBtn.hidden = false;
    window.scrollTo(0, 0);
    watchPhotos();
  }

  if (openBtn) {
    openBtn.addEventListener('click', function () {
      openBtn.disabled = true; // no double clicks
      // Start the music RIGHT HERE, inside the tap. Browsers only allow sound that
      // starts from a tap, so this must not wait for the animation to finish.
      startMusic();
      if (reduceMotion) return showSurprise();
      burst(openBtn);
      cover.classList.add('closing');
      setTimeout(showSurprise, 450);
    });
  }

  // ----- 3. Photos pop in as they scroll into view -----
  function watchPhotos() {
    var photos = document.querySelectorAll('.photo');
    if (!('IntersectionObserver' in window)) {
      photos.forEach(function (p) { p.classList.add('in'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    photos.forEach(function (p) { observer.observe(p); });
  }
})();
