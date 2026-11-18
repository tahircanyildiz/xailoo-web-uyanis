/*!
 * Xailoo Uyanış — web sitesi açılış animasyonu
 *
 * Xailoo mobil uygulamasının açılış ekranının ("Uyanış") birebir web karşılığı: simsiyah ekranda oyuncağın 8x4 LED yüzü
 * uyanır (kıvılcım, ışık izi, gözler açılır, sağa sola bakar, sevinir), XAILOO logosu ve alt yazı belirir, imza sesi çalar.
 * Zaman çizelgesi, desenler, renkler ve oranlar uygulamadaki kaynakla aynıdır:
 *   xailoo-mobile-app/src/features/splash-screen/wake/{wakeTimeline.ts, wakeGeometry.ts, WakeFace.tsx}
 *
 * Bağımlılık yok. Kullanım ve ayarlar için README.md.
 */
(function (window, document) {
  'use strict';

  // ---------------------------------------------------------------------------------------------------------------------
  // Zaman çizelgesi (ms, animasyonun ilk karesinden). Uygulamadaki WAKE_MS ile aynı.
  // ---------------------------------------------------------------------------------------------------------------------
  var MS = {
    spark: 375, line: 900, closed: 1350, half: 1650, open: 1830, left: 2130, right: 2670, happy: 3210, idle: 4350,
    logo: 3525, tagline: 4450, end: 6350, fade: 400,
  };
  var SPARK_MS = MS.line - MS.spark;
  var LINE_MS = MS.closed - MS.line;
  var CLOSED_MS = MS.half - MS.closed;
  var LINE_STEP_MS = 112.5;
  var FLASH_MS = 420;
  var LOGO_MS = MS.idle - MS.logo;
  var HOP_MS = 300;
  var TAGLINE_MS = 700;
  var BLINK_PERIOD = 3200;
  var BLINK_FROM = 1200;
  var BLINK_TO = 1320;
  // Hareketi Azalt: durağan son kare en az bu kadar görünür, sonra bu sürede söner
  var STILL_MS = 800;
  var STILL_FADE_MS = 300;
  // Ses ve logo en çok bu kadar beklenir; ilk 375 ms zaten siyah
  var READY_WAIT_MS = 1200;

  // ---------------------------------------------------------------------------------------------------------------------
  // Renkler ve ölçüler (uygulamayla aynı)
  // ---------------------------------------------------------------------------------------------------------------------
  var W = 8, H = 4, N = W * H;
  var GLOW = [65, 219, 219];    // #41dbdb  Xailoo parıltısı
  var ICE = [190, 255, 255];    // #beffff  kıvılcım / parlama
  var LIT = 0.02;
  var DEFAULT_TAGLINE = 'Her çocuğun potansiyeline inanıyoruz.';
  var STORAGE_KEY = 'xailoo-uyanis';
  var DAY_MS = 864e5;

  // Bu dosyanın klasörü: varlıklar (assets/) varsayılan olarak buradan yüklenir
  var SCRIPT_BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');

  // ---------------------------------------------------------------------------------------------------------------------
  // LED karesi: 32 parlaklık (0..1,2; 1'in üstü açılırkenki parlama) + renk (1 = buz, 0 = parıltı)
  // ---------------------------------------------------------------------------------------------------------------------
  function blank() { return { leds: new Float32Array(N), ice: new Uint8Array(N) }; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }

  // Aynı noktada en parlak değer kazanır ve rengini de o belirler
  function px(f, x, y, ice, k) {
    if (k === undefined) { k = 1; }
    if (x < 0 || x >= W || y < 0 || y >= H || !(k > 0)) { return; }
    var i = y * W + x;
    if (k > f.leds[i]) { f.leds[i] = k; f.ice[i] = ice; }
  }
  // Dikdörtgen; round ve h >= 3 ise üst/alt satır sönük (yumuşak oval göz)
  function rect(f, x0, y0, w, h, ice, k, round) {
    if (k === undefined) { k = 1; }
    for (var y = y0; y < y0 + h; y++) {
      for (var x = x0; x < x0 + w; x++) {
        var edge = round && h >= 3 && (y === y0 || y === y0 + h - 1);
        px(f, x, y, ice, edge ? k * 0.6 : k);
      }
    }
  }
  // '#' tam, 'o' yarım parlaklık
  function shape(f, rows, ice, k, dx, dy) {
    rows.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) {
        if (row[x] === '#') { px(f, x + dx, y + dy, ice, k); }
        else if (row[x] === 'o') { px(f, x + dx, y + dy, ice, k * 0.5); }
      }
    });
  }

  var EYE_X = [1, 5];
  // İki büyük göz (2 sütun × 4 satır). lid: 0 açık, 1 yarı, 2 kapalı, 3 açılırken parlama
  function bigEyes(f, ice, o) {
    o = o || {};
    var k = o.k === undefined ? 1 : o.k, dx = o.dx || 0, lid = o.lid || 0, top = 0, h = 4;
    EYE_X.forEach(function (x0) {
      var x = x0 + dx;
      if (lid === 2) { rect(f, x, top + Math.ceil(h / 2), 2, 1, ice, k * 0.85); }
      else if (lid === 1) { rect(f, x, top + 1, 2, Math.max(1, h - 2), ice, k); }
      else if (lid === 3) { rect(f, x, top, 2, h, ice, k * 1.15); }
      else { rect(f, x, top, 2, h, ice, k, true); }
    });
  }
  // Mutlu yüz (∩∩)
  var HAPPY = ['........', 'o#o..o#o', '#.#..#.#', '........'];

  // t anındaki kare
  function frameAt(t) {
    var f = blank();
    var streak = null;
    var q;
    if (t < MS.spark) {
      // karanlık
    } else if (t < MS.line) {
      // Kıvılcım: ortada açık aqua iki LED parlar, ince ışık izi büyür
      q = (t - MS.spark) / SPARK_MS;
      rect(f, 3, 2, 2, 1, 1, 0.25 + 0.75 * q);
      streak = { len: 0.55 * q, alpha: 0.55 * q, thick: 1.5 };
    } else if (t < MS.closed) {
      // Işık 112,5 ms'de bir iki yana birer LED yayılır; iz ekranı aşar
      var hw = 1 + Math.floor((t - MS.line) / LINE_STEP_MS);
      rect(f, 4 - hw, 2, hw * 2, 1, 0);
      streak = { len: 0.55 + 0.6 * (t - MS.line) / LINE_MS, alpha: 0.6, thick: 2 };
    } else if (t < MS.half) {
      // Gözler kapalı; iz sönerek kaybolur
      bigEyes(f, 0, { lid: 2 });
      streak = { len: 1.15, alpha: 0.6 * (1 - (t - MS.closed) / CLOSED_MS), thick: 2 };
    } else if (t < MS.open) {
      bigEyes(f, 0, { lid: 1 });
    } else if (t < MS.left) {
      bigEyes(f, 0, { lid: 3 });
    } else if (t < MS.right) {
      bigEyes(f, 0, { dx: -1 });
    } else if (t < MS.happy) {
      bigEyes(f, 0, { dx: 1 });
    } else if (t < MS.idle) {
      shape(f, HAPPY, 0, 1, 0, Math.floor((t - MS.happy) / HOP_MS) % 2 ? -1 : 0);
    } else {
      var b = (t - MS.idle) % BLINK_PERIOD;
      bigEyes(f, 0, { lid: b > BLINK_FROM && b < BLINK_TO ? 2 : 0 });
    }
    if (streak && !(streak.len > 0 && streak.alpha > 0)) { streak = null; }

    // Gözler açılırken merkezde kısa parlama
    var flash = t >= MS.open && t < MS.open + FLASH_MS ? 0.32 * (1 - (t - MS.open) / FLASH_MS) : 0;

    // Logo belirir; 1,05'ten 1'e iner
    var a = clamp((t - MS.logo) / LOGO_MS);
    var ease = 1 - Math.pow(1 - a, 3);
    var logo = { alpha: a, scale: 1 + 0.05 * (1 - ease) };

    // Alt yazı belirir, aşağıdan yukarı kayar, harf aralığı 0,28'den 0,1 em'e daralır
    var ta = clamp((t - MS.tagline) / TAGLINE_MS);
    var te = 1 - Math.pow(1 - ta, 3);
    var tagline = { alpha: ta, dy: 0.026 * (1 - te), spacing: 0.1 + 0.18 * (1 - te) };

    return { leds: f.leds, ice: f.ice, streak: streak, flash: flash, logo: logo, tagline: tagline };
  }

  // Hareketi Azalt: durağan son kare (açık gözler, logo, alt yazı)
  function stillFrame() {
    var f = blank();
    bigEyes(f, 0, { lid: 0 });
    return { leds: f.leds, ice: f.ice, streak: null, flash: 0, logo: { alpha: 1, scale: 1 }, tagline: { alpha: 1, dy: 0, spacing: 0.1 } };
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // Yerleşim: uygulamadaki wakeGeometry oranları. Web eki: yatay (alçak) ekranda yüz ile logo çakışmasın diye taban,
  // ekran yüksekliğinin %75'ini de aşmaz (dikey telefonda ve masaüstünde etkisi yok)
  // ---------------------------------------------------------------------------------------------------------------------
  function geometry(width, height, maxWidth) {
    var base = Math.min(width, maxWidth, height * 0.75);
    var cell = base * 0.074;
    var gapX = cell * 0.62;
    var gapY = cell * 0.7;
    var gridW = W * cell + (W - 1) * gapX;
    var gridH = H * cell + (H - 1) * gapY;
    var faceCY = height * 0.4;
    return {
      cell: cell, gapX: gapX, gapY: gapY, radius: cell * 0.42,
      x0: (width - gridW) / 2, y0: faceCY - gridH / 2, faceCY: faceCY,
      logoW: base * 0.46, logoCY: height * 0.66,
      taglineCY: height * 0.735, taglineSize: base * 0.052, taglineMaxW: width * 0.84,
    };
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // Çizim (canvas)
  // ---------------------------------------------------------------------------------------------------------------------
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  // Parlaklık > 1'de çekirdek beyaza kayar (gözler açılırken)
  function coreColor(c, v) {
    var k = Math.min(1.2, v);
    var hot = Math.max(0, k - 1) * 3.5;
    var r = c.map(function (ch) { return Math.round(Math.min(255, ch * Math.min(1, k) + (255 - ch) * hot)); });
    return 'rgb(' + r[0] + ',' + r[1] + ',' + r[2] + ')';
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawFrame(ctx, w, h, g, fr, logoImg) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    var cx = function (i) { return g.x0 + (i % W) * (g.cell + g.gapX) + g.cell / 2; };
    var cy = function (i) { return g.y0 + Math.floor(i / W) * (g.cell + g.gapY) + g.cell / 2; };

    // Işık izi: 3. satırın ortasında, yatay
    if (fr.streak) {
      var len = fr.streak.len * w;
      var sy = g.y0 + 2 * (g.cell + g.gapY) + g.cell / 2;
      var sg = ctx.createLinearGradient((w - len) / 2, 0, (w + len) / 2, 0);
      sg.addColorStop(0, rgba(ICE, 0));
      sg.addColorStop(0.5, rgba(ICE, 1));
      sg.addColorStop(1, rgba(ICE, 0));
      ctx.globalAlpha = fr.streak.alpha;
      ctx.fillStyle = sg;
      ctx.fillRect((w - len) / 2, sy - fr.streak.thick / 2, len, fr.streak.thick);
    }

    var lit = [];
    for (var i = 0; i < N; i++) { if (fr.leds[i] > LIT) { lit.push(i); } }

    // Önce bütün parıltılar, sonra çekirdekler: bir LED'in parıltısı komşunun çekirdeğini örtmez
    lit.forEach(function (i) {
      var c = fr.ice[i] ? ICE : GLOW;
      var x = cx(i), y = cy(i), r = g.cell * 1.9;
      var gr = ctx.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, rgba(c, 1));
      gr.addColorStop(1, rgba(c, 0));
      ctx.globalAlpha = Math.min(1, 0.42 * Math.min(1.2, fr.leds[i]));
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    lit.forEach(function (i) {
      var c = fr.ice[i] ? ICE : GLOW;
      ctx.fillStyle = coreColor(c, fr.leds[i]);
      roundRect(ctx, cx(i) - g.cell / 2, cy(i) - g.cell / 2, g.cell, g.cell, g.radius);
      ctx.fill();
    });

    // Gözler açılırken merkez parlaması
    if (fr.flash > 0) {
      var fg = ctx.createRadialGradient(w / 2, g.faceCY, 0, w / 2, g.faceCY, h * 0.7);
      fg.addColorStop(0, rgba(ICE, 1));
      fg.addColorStop(1, rgba(GLOW, 0));
      ctx.globalAlpha = fr.flash;
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, w, h);
    }

    // Logo
    if (fr.logo.alpha > 0 && logoImg && logoImg.complete && logoImg.naturalWidth) {
      var lw = g.logoW * fr.logo.scale;
      var lh = lw * logoImg.naturalHeight / logoImg.naturalWidth;
      ctx.globalAlpha = fr.logo.alpha;
      ctx.drawImage(logoImg, (w - lw) / 2, g.logoCY - lh / 2, lw, lh);
    }
    ctx.globalAlpha = 1;
  }

  // Alt yazının satırları: 0,1 em harf aralığıyla en çok genişliği aşarsa ortaya en yakın boşluktan iki satıra bölünür,
  // yazı küçülmez. Satırlar baştan belirlenir; belirirken açılan harf aralığı satırları yeniden kırmaz
  var measureCtx = null;
  function taglineLines(text, g, fontFamily) {
    measureCtx = measureCtx || document.createElement('canvas').getContext('2d');
    measureCtx.font = '500 ' + g.taglineSize + 'px ' + fontFamily;
    var width = measureCtx.measureText(text).width + 0.1 * g.taglineSize * text.length;
    if (width <= g.taglineMaxW) { return [text]; }
    var mid = text.length / 2, cut = -1;
    for (var i = 1; i < text.length; i++) {
      if (text[i] === ' ' && (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid))) { cut = i; }
    }
    return cut < 0 ? [text] : [text.slice(0, cut), text.slice(cut + 1)];
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // "Daha önce görüldü mü": oturum başına (session), günde bir (day) ya da her açılışta (always)
  // ---------------------------------------------------------------------------------------------------------------------
  function seenBefore(repeat) {
    try {
      if (repeat === 'always') { return false; }
      if (repeat === 'day') {
        var at = Number(window.localStorage.getItem(STORAGE_KEY));
        return at > 0 && Date.now() - at < DAY_MS;
      }
      return window.sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }
  function markSeen() {
    try { window.sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* depolama kapalı */ }
    try { window.localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (e) { /* depolama kapalı */ }
  }

  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  var SPEAKER_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06A9 9 0 0 0 14 3.23z"/></svg>';

  var running = null;

  /**
   * Animasyonu başlatır. Animasyon bitince (ya da geçilince) çözülen bir Promise döner.
   * Ayarlar README.md'de.
   */
  function start(options) {
    var o = options || {};
    if (running) { return running.promise; }
    var html = document.documentElement;
    var root = typeof o.root === 'string' ? document.querySelector(o.root) : (o.root || document.getElementById('xailoo-uyanis'));
    var freezeAt = typeof o.freezeAt === 'number' ? o.freezeAt : null;
    var repeat = o.repeat || 'session';

    // Karar: <head>'deki kısa betik verdiyse (xu-play / xu-skip) ona uyulur; yoksa burada verilir
    var play;
    if (freezeAt !== null || o.force) { play = true; }
    else if (html.classList.contains('xu-skip')) { play = false; }
    else if (html.classList.contains('xu-play')) { play = true; }
    else { play = !seenBefore(repeat); }

    if (!root || !play) {
      html.classList.remove('xu-play');
      if (root && root.parentNode) { root.parentNode.removeChild(root); }
      return Promise.resolve();
    }
    window.XailooUyanisStarted = true;
    html.classList.add('xu-play');
    html.classList.remove('xu-skip');

    var resolveDone;
    var promise = new Promise(function (resolve) { resolveDone = resolve; });
    running = { promise: promise };

    var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) && freezeAt === null;
    var assets = o.assetsPath || (SCRIPT_BASE + 'assets/');
    var maxWidth = o.maxWidth || 430;
    var text = o.tagline === undefined ? DEFAULT_TAGLINE : o.tagline;
    var wantSound = o.sound !== false && !reduced && freezeAt === null;

    // --- DOM ---
    root.innerHTML = '';
    var canvas = el('canvas', 'xu-canvas', { 'aria-hidden': 'true' });
    var tag = el('p', 'xu-tagline');
    tag.textContent = text || '';
    var skipBtn = el('button', 'xu-btn xu-skip', { type: 'button' });
    skipBtn.textContent = o.skipLabel || 'Geç';
    var soundBtn = el('button', 'xu-btn xu-sound', { type: 'button' });
    soundBtn.innerHTML = SPEAKER_SVG + '<span></span>';
    soundBtn.lastChild.textContent = o.soundLabel || 'Sesi aç';
    soundBtn.hidden = true;
    root.appendChild(canvas);
    if (text) { root.appendChild(tag); }
    root.appendChild(soundBtn);
    if (o.skippable !== false && freezeAt === null) { root.appendChild(skipBtn); }
    var ctx = canvas.getContext('2d');
    // Ses durumu (hata ayıklama için): off | loading | playing | blocked
    root.setAttribute('data-sound', wantSound ? 'loading' : 'off');

    // --- Varlıklar ---
    var logoImg = new Image();
    var logoReady = new Promise(function (resolve) {
      logoImg.onload = resolve;
      logoImg.onerror = resolve;
      setTimeout(resolve, READY_WAIT_MS);
    });
    logoImg.src = o.logoSrc || (assets + 'xailoo-logo.png');

    var audio = null;
    var audioReady = Promise.resolve();
    if (wantSound) {
      audio = new Audio();
      var aac = audio.canPlayType && audio.canPlayType('audio/mp4; codecs="mp4a.40.2"');
      audio.src = o.soundSrc || (assets + (aac === 'probably' ? 'xailoo-uyanis.m4a' : 'xailoo-uyanis.mp3'));
      audio.preload = 'auto';
      audio.volume = typeof o.volume === 'number' ? clamp(o.volume) : 1;
      audioReady = new Promise(function (resolve) {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, READY_WAIT_MS);
      });
      audio.load();
    }

    // --- Ölçü ---
    var cw = 0, ch = 0, g = null, lines = [], lastTag = '';
    function resize() {
      cw = root.clientWidth || window.innerWidth;
      ch = root.clientHeight || window.innerHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      g = geometry(cw, ch, maxWidth);
      if (text) {
        var family = window.getComputedStyle(tag).fontFamily || 'sans-serif';
        lines = taglineLines(text, g, family);
        tag.textContent = lines.join('\n');
        var lineH = g.taglineSize * 1.4;
        tag.style.fontSize = g.taglineSize + 'px';
        tag.style.lineHeight = lineH + 'px';
        tag.style.top = (g.taglineCY - lineH / 2) + 'px';
      }
      lastTag = '';
    }

    function render(fr) {
      drawFrame(ctx, cw, ch, g, fr, logoImg);
      if (text) {
        var t = fr.tagline;
        var key = t.alpha.toFixed(3) + '|' + t.dy.toFixed(4) + '|' + t.spacing.toFixed(4);
        if (key !== lastTag) {
          lastTag = key;
          tag.style.opacity = String(t.alpha);
          tag.style.letterSpacing = (t.spacing * g.taglineSize) + 'px';
          tag.style.transform = 'translateY(' + (t.dy * cw) + 'px)';
        }
      }
    }

    // --- Ses ---
    var t0 = 0, began = false, ended = false, fading = false, raf = 0, blocked = false, playing = false, pending = false;
    function elapsed() { return began ? performance.now() - t0 : 0; }
    function syncPlay(fromGesture) {
      if (!audio || ended || playing || pending) { return; }
      var sec = elapsed() / 1000;
      var dur = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 7.8;
      if (sec >= dur - 0.25) { soundBtn.hidden = true; return; }
      try { if (sec > 0.05) { audio.currentTime = sec; } } catch (e) { /* üst veri yoksa baştan çalar */ }
      var p;
      pending = true;
      try { p = audio.play(); } catch (e) { p = null; }
      var from = sec.toFixed(2);
      if (p && typeof p.then === 'function') {
        p.then(function () {
          pending = false; playing = true; soundBtn.hidden = true;
          root.setAttribute('data-sound', 'playing');
          root.setAttribute('data-sound-from', from);
        })
          .catch(function () {
            // Tarayıcı kullanıcı etkileşimi olmadan sesli oynatmaya izin vermedi: "Sesi aç" düğmesi
            pending = false;
            blocked = true;
            root.setAttribute('data-sound', 'blocked');
            if (!fromGesture && !ended) { soundBtn.hidden = false; }
          });
      } else {
        pending = false;
        playing = true;
      }
    }
    function fadeOutAudio(ms) {
      if (!audio) { return; }
      var a = audio, from = a.volume, s = performance.now();
      (function step() {
        var q = Math.min(1, (performance.now() - s) / ms);
        try { a.volume = from * (1 - q); } catch (e) { /* bazı iOS sürümlerinde volume salt okunur */ }
        if (q < 1) { requestAnimationFrame(step); } else { try { a.pause(); } catch (e) { /* yok */ } }
      })();
    }

    // --- Akış ---
    function cleanup() {
      ended = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
      html.classList.remove('xu-play');
      if (root.parentNode) { root.parentNode.removeChild(root); }
      running = null;
      try { document.dispatchEvent(new CustomEvent('xailoo-uyanis:end')); } catch (e) { /* eski tarayıcı */ }
      if (typeof o.onEnd === 'function') { o.onEnd(); }
      resolveDone();
    }
    // skipped: ziyaretçi geçti (ses kısılarak durur). Normal bitişte sesin kuyruğu (yaklaşık 1 sn) kesilmez
    function finish(skipped) {
      if (fading || ended) { return; }
      fading = true;
      soundBtn.hidden = true;
      var ms = reduced ? STILL_FADE_MS : MS.fade;
      if (skipped) { fadeOutAudio(250); }
      root.style.transitionDuration = ms + 'ms';
      root.classList.add('xu-fade');
      setTimeout(cleanup, ms);
    }

    function loop(now) {
      if (ended) { return; }
      raf = requestAnimationFrame(loop);
      var t = freezeAt !== null ? freezeAt : now - t0;
      render(frameAt(t));
      if (freezeAt === null && t >= MS.end) { finish(false); }
    }

    function begin() {
      if (began) { return; }
      began = true;
      markSeen();
      t0 = performance.now();
      if (reduced) {
        render(stillFrame());
        setTimeout(function () { finish(false); }, STILL_MS);
        return;
      }
      raf = requestAnimationFrame(loop);
      if (audio) {
        // Ses hazırsa ilk kareyle birlikte; hazır değilse hazır olunca kaldığı yerden (görüntüyle eşzamanlı) başlar
        if (audio.readyState >= 3) { syncPlay(false); }
        else { audio.addEventListener('canplaythrough', function () { if (!blocked) { syncPlay(false); } }, { once: true }); }
      }
    }

    function onResize() { resize(); if (reduced && began) { render(stillFrame()); } }
    function onKey(e) { if (e.key === 'Escape') { finish(true); } }
    // Sekme arka plana giderse animasyon geçilir (ses arka planda çalmasın)
    function onVisibility() { if (document.hidden && began) { finish(true); } }

    skipBtn.addEventListener('click', function () { finish(true); });
    soundBtn.addEventListener('click', function () { blocked = false; syncPlay(true); });
    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKey);

    resize();
    render(frameAt(0));

    Promise.all([logoReady, audioReady]).then(function () {
      if (ended) { return; }
      var go = function () {
        if (o.gate && wantSound) {
          // Kapı: ziyaretçi dokununca başlar; ses kesin çalar (dokunma, tarayıcının istediği etkileşimdir)
          var gateBtn = el('button', 'xu-btn xu-gate', { type: 'button' });
          gateBtn.textContent = o.gateLabel || 'Xailoo\'yu uyandır';
          root.appendChild(gateBtn);
          gateBtn.focus({ preventScroll: true });
          gateBtn.addEventListener('click', function () {
            gateBtn.parentNode.removeChild(gateBtn);
            begin();
            if (audio) { syncPlay(true); }
          });
        } else {
          begin();
        }
        document.addEventListener('visibilitychange', onVisibility);
      };
      // Sekme arka planda açıldıysa ziyaretçi sekmeye gelince başlar
      if (document.hidden) {
        var wait = function () {
          if (!document.hidden) { document.removeEventListener('visibilitychange', wait); go(); }
        };
        document.addEventListener('visibilitychange', wait);
      } else {
        go();
      }
    });

    running.skip = function () { finish(true); };
    return promise;
  }

  window.XailooUyanis = {
    start: start,
    /** Çalan animasyonu geçer (ses kısılarak durur) */
    skip: function () { if (running && running.skip) { running.skip(); } },
    /** Zaman çizelgesi (ms) */
    timeline: MS,
  };
})(window, document);
