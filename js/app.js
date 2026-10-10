'use strict';

/* =========================================================
   Koç Takip — öğrenci & antrenman takibi
   Tüm veriler cihazda (localStorage) tutulur.
   ========================================================= */

const STORE_KEY = 'koc-takip.v1';

/* ---------- Küçük yardımcılar ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = (o) => JSON.parse(JSON.stringify(o));
const norm = (s) => String(s || '').trim().toLocaleLowerCase('tr-TR');

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => toISO(new Date());
const addDays = (s, n) => { const d = fromISO(s); d.setDate(d.getDate() + n); return toISO(d); };
const weekStart = (s) => { const d = fromISO(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toISO(d); };
const daysBetween = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 86400000);
const fmtDate = (s, o = { day: 'numeric', month: 'short' }) => fromISO(s).toLocaleDateString('tr-TR', o);
const DAY_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function relDays(s) {
  const n = daysBetween(s, today());
  if (n === 0) return 'Bugün';
  if (n === 1) return 'Dün';
  if (n < 0) return `${-n} gün sonra`;
  if (n < 7) return `${n} gün önce`;
  if (n < 30) return `${Math.floor(n / 7)} hafta önce`;
  return `${Math.floor(n / 30)} ay önce`;
}
const num = (v, d = 1) => {
  if (v === '' || v == null || isNaN(v)) return '–';
  const f = 10 ** d;
  return (Math.round(v * f) / f).toLocaleString('tr-TR');
};
const parseNum = (s) => {
  const t = String(s ?? '').trim().replace(',', '.');
  if (t === '') return '';
  const n = Number(t);
  return isNaN(n) ? '' : n;
};
const inVal = (v) => (v === '' || v == null ? '' : String(v).replace('.', ','));
const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toLocaleUpperCase('tr-TR');

const ICON = {
  chev: '<svg class="chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 6 9 12l6 6"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15 6 9 12l6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  alert: '<svg viewBox="0 0 24 24"><path d="M12 3 2 20h20zM12 10v4M12 17v.5"/></svg>',
  ticket: '<svg viewBox="0 0 24 24"><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2z"/><path d="M14 6v12" stroke-dasharray="2 2"/></svg>',
  users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.8a3.3 3.3 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.4 3.5 5.2"/></svg>',
  dumbbell: '<svg viewBox="0 0 24 24"><path d="M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12"/></svg>',
  history: '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7M8 21v-7h8v7"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M12 4v11m0 0-4-4m4 4 4-4M4 19h16"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M12 20V9m0 0-4 4m4-4 4 4M4 5h16"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/></svg>',
};

/* ---------- Egzersiz kütüphanesi ---------- */
const DEFAULT_EXERCISES = [
  ['Squat', 'strength'], ['Front Squat', 'strength'], ['Bench Press', 'strength'], ['Incline Bench Press', 'strength'],
  ['Deadlift', 'strength'], ['Romanian Deadlift', 'strength'], ['Overhead Press', 'strength'], ['Barbell Row', 'strength'],
  ['Lat Pulldown', 'strength'], ['Barfiks (Pull-up)', 'strength'], ['Seated Cable Row', 'strength'], ['Leg Press', 'strength'],
  ['Hip Thrust', 'strength'], ['Lunge', 'strength'], ['Bulgarian Split Squat', 'strength'], ['Leg Curl', 'strength'],
  ['Leg Extension', 'strength'], ['Dumbbell Press', 'strength'], ['Incline Dumbbell Press', 'strength'], ['Dumbbell Shoulder Press', 'strength'],
  ['Lateral Raise', 'strength'], ['Face Pull', 'strength'], ['Biceps Curl', 'strength'], ['Hammer Curl', 'strength'],
  ['Triceps Pushdown', 'strength'], ['Dips', 'strength'], ['Şınav (Push-up)', 'strength'], ['Calf Raise', 'strength'],
  ['Kettlebell Swing', 'strength'], ['Goblet Squat', 'strength'], ['Cable Crunch', 'strength'], ['Hanging Leg Raise', 'strength'],
  ['Koşu Bandı', 'cardio'], ['Koşu (Açık Hava)', 'cardio'], ['Bisiklet', 'cardio'], ['Assault Bike', 'cardio'],
  ['Kürek (Rowing)', 'cardio'], ['Eliptik', 'cardio'], ['Merdiven (Stair)', 'cardio'], ['İp Atlama', 'cardio'],
  ['HIIT', 'cardio'], ['Yürüyüş (Eğimli)', 'cardio'], ['Yüzme', 'cardio'],
];

/* ---------- Veri katmanı ---------- */
function blankDB() {
  return { version: 1, coachName: '', students: [], sessions: [], metrics: [], templates: [], customExercises: [], lastBackup: null };
}
function loadDB() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return Object.assign(blankDB(), JSON.parse(raw));
  } catch (e) { console.error(e); }
  return blankDB();
}
let db = loadDB();
function persist() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); }
  catch (e) { toast('Kaydedilemedi — depolama dolu olabilir.'); }
}

const getStudent = (id) => db.students.find((s) => s.id === id);
const getSession = (id) => db.sessions.find((s) => s.id === id);
const getTemplate = (id) => db.templates.find((t) => t.id === id);
const bySessDesc = (a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0);
const sessionsOf = (sid) => db.sessions.filter((s) => s.studentIds.includes(sid)).sort(bySessDesc);
const activeStudents = () => db.students.filter((s) => !s.archived).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
const studentNames = (ids) => ids.map((id) => getStudent(id)?.name || 'Silinmiş').join(', ');

function exerciseLibrary() {
  const map = new Map();
  for (const [name, kind] of DEFAULT_EXERCISES) map.set(norm(name), { name, kind });
  for (const e of db.customExercises) map.set(norm(e.name), e);
  for (const s of db.sessions) for (const e of s.exercises) if (!map.has(norm(e.name))) map.set(norm(e.name), { name: e.name, kind: e.kind });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

/* Paket: öğrencinin son paketi aktif paket sayılır */
function pkgInfo(st) {
  const p = st.packages?.length ? st.packages[st.packages.length - 1] : null;
  if (!p) return null;
  const used = db.sessions.filter((s) => s.packageIds?.[st.id] === p.id).length;
  return { p, used, left: p.total - used };
}
function lastSessionDate(sid) {
  const s = sessionsOf(sid)[0];
  return s ? s.date : null;
}

function exSummary(ex) {
  if (ex.kind === 'cardio') {
    const c = ex.cardio || {};
    return [c.min !== '' && c.min != null ? `${num(c.min)} dk` : '', c.km ? `${num(c.km, 2)} km` : '', c.intensity ? `yoğ. ${c.intensity}/10` : '', c.hr ? `${c.hr} nabız` : ''].filter(Boolean).join(' · ');
  }
  const sets = (ex.sets || []).filter((s) => s.reps !== '' || s.weight !== '');
  if (!sets.length) return '';
  const groups = [];
  for (const s of sets) {
    const g = groups[groups.length - 1];
    if (g && g.reps === s.reps && g.weight === s.weight) g.n++;
    else groups.push({ reps: s.reps, weight: s.weight, n: 1 });
  }
  return groups.map((g) => `${g.n}×${g.reps === '' ? '?' : g.reps}${g.weight !== '' && g.weight !== 0 ? ` @ ${num(g.weight, 2)}kg` : ''}`).join(', ');
}
function cardioMinutes(sessions) {
  let m = 0;
  for (const s of sessions) for (const e of s.exercises) if (e.kind === 'cardio' && e.cardio?.min) m += Number(e.cardio.min) || 0;
  return m;
}
function sessionTitle(s) {
  if (s.title) return s.title;
  const names = s.exercises.map((e) => e.name);
  if (!names.length) return 'Seans';
  return names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3}` : '');
}
function sessionMeta(s) {
  const st = s.exercises.filter((e) => e.kind === 'strength').length;
  const cm = cardioMinutes([s]);
  return [st ? `${st} egzersiz` : '', cm ? `${num(cm)} dk kardiyo` : ''].filter(Boolean).join(' · ');
}

/* ---------- UI altyapısı ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2400);
}
function openSheet(title, body) {
  $('#sheet-title').textContent = title;
  $('#sheet-body').innerHTML = body;
  $('#sheet').hidden = false;
  document.body.style.overflow = 'hidden';
  const f = $('#sheet-body [autofocus]');
  if (f && window.matchMedia('(hover: hover)').matches) f.focus();
}
function closeSheet() {
  $('#sheet').hidden = true;
  document.body.style.overflow = '';
}
function topbar(title, { back, right = '', sub = '' } = {}) {
  return `<header class="topbar">
    ${back ? `<a class="icon-btn" href="${back}" aria-label="Geri">${ICON.back}</a>` : ''}
    <div style="flex:1;min-width:0">${sub ? `<div class="eyebrow">${esc(sub)}</div>` : ''}<h1>${esc(title)}</h1></div>
    ${right}
  </header>`;
}
function emptyState(icon, title, text, actions = '') {
  return `<div class="empty"><div class="ico">${icon}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${actions}</div>`;
}

/* ---------- Grafik (tek seri çizgi) ---------- */
const charts = new Map();
let chartSeq = 0;
function niceTicks(min, max, count = 4) {
  if (min === max) { const p = Math.abs(min) * 0.1 || 1; min -= p; max += p; }
  const step0 = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const n = step0 / mag;
  const step = (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const out = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(+v.toFixed(6));
  return out;
}
function lineChart(points, { unit = '', digits = 1 } = {}) {
  if (!points.length) return '<p class="muted small">Grafik için veri yok.</p>';
  // Grafik genişliği gerçek ekran genişliğine eşit: yazılar her cihazda gerçek piksel boyutunda kalır.
  const W = Math.round(Math.min(720, Math.max(280, (document.getElementById('view')?.clientWidth || 390) - 66)));
  const H = 200, L = 40, R = 14, T = 20, B = 26;
  const xs = points.map((p) => fromISO(p.date).getTime());
  const ys = points.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const ticks = niceTicks(Math.min(...ys), Math.max(...ys));
  const y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const sx = (x) => (x1 === x0 ? (L + W - R) / 2 : L + ((x - x0) / (x1 - x0)) * (W - L - R));
  const sy = (y) => T + (1 - (y - y0) / (y1 - y0 || 1)) * (H - T - B);
  const pts = points.map((p, i) => ({ ...p, cx: sx(xs[i]), cy: sy(p.y) }));
  const id = 'c' + ++chartSeq;
  charts.set(id, { pts, unit, digits, W, H, T, B });
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join('');
  const area = pts.length > 1 ? `${path}L${pts[pts.length - 1].cx.toFixed(1)},${H - B}L${pts[0].cx.toFixed(1)},${H - B}Z` : '';
  const xl = [pts[0]];
  if (pts.length > 2) xl.push(pts[Math.floor((pts.length - 1) / 2)]);
  if (pts.length > 1) xl.push(pts[pts.length - 1]);
  const last = pts[pts.length - 1];
  const lblX = Math.min(Math.max(last.cx, L + 20), W - R - 4);
  return `<div class="chart" data-chart="${id}">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="İlerleme grafiği">
      <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity="0.22"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></linearGradient></defs>
      <g class="grid">${ticks.map((t) => `<line x1="${L}" x2="${W - R}" y1="${sy(t)}" y2="${sy(t)}"/>`).join('')}</g>
      <g class="axis">
        ${ticks.map((t) => `<text x="${L - 8}" y="${sy(t) + 4}" text-anchor="end">${num(t, digits)}</text>`).join('')}
        ${xl.map((p, i) => `<text x="${p.cx}" y="${H - 5}" text-anchor="${xl.length > 1 && i === 0 ? 'start' : i === xl.length - 1 && xl.length > 1 ? 'end' : 'middle'}">${fmtDate(p.date)}</text>`).join('')}
      </g>
      ${area ? `<path class="area" d="${area}"/>` : ''}
      <path class="line" d="${path}"/>
      ${pts.map((p) => `<circle class="dot" cx="${p.cx}" cy="${p.cy}" r="4"/>`).join('')}
      <text class="lbl" x="${lblX}" y="${Math.max(last.cy - 12, 12)}" text-anchor="end">${num(last.y, digits)}${unit ? ' ' + unit : ''}</text>
      <line class="cross" y1="${T}" y2="${H - B}" x1="0" x2="0" visibility="hidden"/>
      <circle class="hover-dot" r="6" visibility="hidden"/>
      <rect x="0" y="0" width="${W}" height="${H}" fill="transparent" class="hit"/>
    </svg>
    <div class="tip" hidden></div>
  </div>`;
}
function bindCharts() {
  for (const el of $$('[data-chart]')) {
    const c = charts.get(el.dataset.chart);
    if (!c) continue;
    const svg = $('svg', el), cross = $('.cross', el), dot = $('.hover-dot', el), tip = $('.tip', el);
    const show = (ev) => {
      const r = svg.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * c.W;
      let best = c.pts[0];
      for (const p of c.pts) if (Math.abs(p.cx - x) < Math.abs(best.cx - x)) best = p;
      cross.setAttribute('x1', best.cx); cross.setAttribute('x2', best.cx); cross.setAttribute('visibility', 'visible');
      dot.setAttribute('cx', best.cx); dot.setAttribute('cy', best.cy); dot.setAttribute('visibility', 'visible');
      tip.innerHTML = `<b>${num(best.y, c.digits)}${c.unit ? ' ' + c.unit : ''}</b><span>${fmtDate(best.date, { day: 'numeric', month: 'long', year: 'numeric' })}${best.sub ? ' · ' + esc(best.sub) : ''}</span>`;
      tip.hidden = false;
      const px = (best.cx / c.W) * r.width;
      const tw = tip.offsetWidth;
      tip.style.left = Math.min(Math.max(px, tw / 2), r.width - tw / 2) + 'px';
      tip.style.top = Math.max((best.cy / c.H) * r.height - tip.offsetHeight - 14, -10) + 'px';
    };
    const hide = () => { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); };
    svg.addEventListener('pointermove', show);
    svg.addEventListener('pointerdown', show);
    svg.addEventListener('pointerleave', hide);
  }
}

/* =========================================================
   GÖRÜNÜMLER
   ========================================================= */

/* ---------- Bu Hafta ---------- */
function viewHome(params) {
  const ref = params.get('w') || today();
  const ws = weekStart(ref), we = addDays(ws, 6);
  const pws = addDays(ws, -7), pwe = addDays(ws, -1);
  const cur = db.sessions.filter((s) => s.date >= ws && s.date <= we);
  const prev = db.sessions.filter((s) => s.date >= pws && s.date <= pwe);
  const isThisWeek = ws === weekStart(today());
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
  const name = db.coachName ? db.coachName : 'Hocam';

  if (!db.students.length) {
    return topbar(`${greet}, ${name}`, { sub: fmtDate(today(), { weekday: 'long', day: 'numeric', month: 'long' }) }) +
      `<div class="card">${emptyState(ICON.users, 'Hoş geldin', 'İlk öğrencini ekle, ardından seanslarını kaydetmeye başla. Tüm veriler bu cihazda saklanır.',
        `<div class="btn-row" style="max-width:420px;margin:0 auto"><button class="btn btn-primary" data-act="add-student">${ICON.plus}Öğrenci ekle</button><button class="btn" data-act="demo">Örnek verilerle dene</button></div>`)}</div>`;
  }

  const uniq = (arr) => new Set(arr.flatMap((s) => s.studentIds)).size;
  const delta = (a, b) => {
    const d = a - b;
    if (!d) return `<span>önceki hafta ${num(b, 0)}</span>`;
    return `<span class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'}${num(Math.abs(d), 0)}</span><span>önceki ${num(b, 0)}</span>`;
  };
  const stat = (k, v, b) => `<div class="stat"><div class="k">${k}</div><div class="v">${num(v, 0)}</div><div class="d">${delta(v, b)}</div></div>`;

  const counts = [...Array(7)].map((_, i) => cur.filter((s) => s.date === addDays(ws, i)).length);
  const max = Math.max(1, ...counts);
  const days = counts.map((n, i) => {
    const d = addDays(ws, i);
    return `<div class="day ${d === today() ? 'today' : ''}"><div class="n">${n || ''}</div><div class="bar ${n ? '' : 'zero'}" style="height:${(n / max) * 70}%"></div><div class="l">${DAY_SHORT[i]}</div></div>`;
  }).join('');

  // Uyarılar
  const alerts = [];
  if (isThisWeek) {
    for (const st of activeStudents()) {
      const pi = pkgInfo(st);
      if (pi && pi.left <= 0) alerts.push({ cls: 'danger', icon: ICON.ticket, st, text: 'Paketi bitti', sort: 0 });
      else if (pi && pi.left <= 2) alerts.push({ cls: 'warn', icon: ICON.ticket, st, text: `Pakette ${pi.left} ders kaldı`, sort: 1 });
    }
    for (const st of activeStudents()) {
      const last = lastSessionDate(st.id);
      const gap = last ? daysBetween(last, today()) : daysBetween(toISO(new Date(st.createdAt || Date.now())), today());
      if (gap >= 14) alerts.push({ cls: 'accent', icon: ICON.clock, st, text: last ? `${gap} gündür gelmedi` : 'Henüz seansı yok', sort: 2 });
    }
    alerts.sort((a, b) => a.sort - b.sort);
  }
  const backupDue = db.sessions.length > 0 && (!db.lastBackup || daysBetween(db.lastBackup.slice(0, 10), today()) >= 7);

  const byDay = {};
  for (const s of cur.sort(bySessDesc)) (byDay[s.date] ||= []).push(s);

  return `
    ${topbar(`${greet}, ${name}`, { sub: fmtDate(today(), { weekday: 'long', day: 'numeric', month: 'long' }) })}
    <div class="week-nav">
      <a class="icon-btn" href="#/?w=${addDays(ws, -7)}" aria-label="Önceki hafta">${ICON.left}</a>
      <div class="label">${isThisWeek ? 'Bu hafta' : fmtDate(ws, { day: 'numeric', month: 'long' }) + ' haftası'}<small>${fmtDate(ws)} – ${fmtDate(we)}</small></div>
      ${isThisWeek ? '<span class="icon-btn" style="visibility:hidden"></span>' : `<a class="icon-btn" href="#/?w=${addDays(ws, 7)}" aria-label="Sonraki hafta">${ICON.right}</a>`}
    </div>
    <div class="stats">
      ${stat('Ders', cur.length, prev.length)}
      ${stat('Öğrenci', uniq(cur), uniq(prev))}
      ${stat('Kardiyo dk', cardioMinutes(cur), cardioMinutes(prev))}
    </div>
    <div class="card" style="margin-top:12px;padding-bottom:12px">
      <div class="section-head" style="margin:0"><h2 style="font-size:15px">Günlere göre ders</h2>${!isThisWeek ? `<a class="link" href="#/" style="color:var(--accent);font-size:14px;font-weight:600">Bu haftaya dön</a>` : ''}</div>
      <div class="days">${days}</div>
    </div>

    ${backupDue ? `<div class="section"><a class="card alert accent" href="#/settings" style="display:flex"><div class="ico">${ICON.shield}</div><div style="flex:1"><b>Yedek alma zamanı</b><div class="small text-2">${db.lastBackup ? 'Son yedek ' + relDays(db.lastBackup.slice(0, 10)).toLocaleLowerCase('tr-TR') : 'Henüz hiç yedek alınmadı'}. Telefon kaybolursa veriler gider.</div></div>${ICON.chev}</a></div>` : ''}

    ${alerts.length ? `<div class="section"><div class="section-head"><h2>Dikkat</h2></div><div class="list">
      ${alerts.map((a) => `<a class="row alert ${a.cls}" href="#/student/${a.st.id}"><div class="ico">${a.icon}</div><div class="main"><div class="title">${esc(a.st.name)}</div><div class="meta">${a.text}</div></div>${ICON.chev}</a>`).join('')}
    </div></div>` : ''}

    <div class="section">
      <div class="section-head"><h2>${isThisWeek ? 'Bu haftanın seansları' : 'Haftanın seansları'}</h2><a class="link" href="#/session/new">+ Seans</a></div>
      ${cur.length ? `<div class="list">${Object.keys(byDay).map((d) => `<div class="group-label">${fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}</div>${byDay[d].map(sessionRow).join('')}`).join('')}</div>`
        : `<div class="card">${emptyState(ICON.dumbbell, 'Bu hafta seans yok', 'Alttaki + düğmesiyle ilk seansı kaydet.')}</div>`}
    </div>`;
}

function sessionRow(s, opts = {}) {
  const d = fromISO(s.date);
  const group = s.studentIds.length > 1;
  return `<a class="row" href="#/session/${s.id}">
    <div class="date-badge"><b>${d.getDate()}</b><span>${d.toLocaleDateString('tr-TR', { month: 'short' })}</span></div>
    <div class="main">
      <div class="title">${opts.hideStudent ? esc(sessionTitle(s)) : esc(studentNames(s.studentIds))}</div>
      <div class="meta">${opts.hideStudent ? esc(sessionMeta(s)) || 'Boş seans' : esc(sessionTitle(s))}</div>
    </div>
    ${group ? `<span class="chip">${ICON.users.replace('<svg', '<svg')}${s.studentIds.length}</span>` : ''}
    ${ICON.chev}
  </a>`;
}

/* ---------- Öğrenciler ---------- */
function viewStudents(params) {
  const showArchived = params.get('arsiv') === '1';
  const list = db.students.filter((s) => !!s.archived === showArchived).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  const archivedCount = db.students.filter((s) => s.archived).length;
  const rows = list.map((st) => {
    const last = lastSessionDate(st.id);
    const pi = pkgInfo(st);
    const chip = pi ? `<span class="chip ${pi.left <= 0 ? 'danger' : pi.left <= 2 ? 'warn' : 'accent'}">${pi.left <= 0 ? 'Paket bitti' : `${pi.left}/${pi.p.total}`}</span>` : '';
    return `<a class="row" href="#/student/${st.id}" data-name="${esc(norm(st.name))}">
      <div class="avatar">${esc(initials(st.name))}</div>
      <div class="main"><div class="title">${esc(st.name)}</div><div class="meta">${last ? 'Son seans: ' + relDays(last).toLocaleLowerCase('tr-TR') : 'Henüz seans yok'}${st.goal ? ' · ' + esc(st.goal) : ''}</div></div>
      ${chip}${ICON.chev}
    </a>`;
  }).join('');
  return `
    ${topbar(showArchived ? 'Arşiv' : 'Öğrenciler', { back: showArchived ? '#/students' : '', right: showArchived ? '' : `<button class="btn btn-primary btn-sm" data-act="add-student">${ICON.plus}Ekle</button>` })}
    ${list.length > 5 ? `<div class="search" style="margin-bottom:12px">${ICON.search}<input class="input" placeholder="Öğrenci ara" data-filter=".list .row"></div>` : ''}
    ${list.length ? `<div class="list">${rows}</div>` : `<div class="card">${emptyState(ICON.users, showArchived ? 'Arşiv boş' : 'Henüz öğrenci yok', showArchived ? 'Arşivlenen öğrenciler burada görünür.' : 'İlk öğrencini ekleyerek başla.', showArchived ? '' : `<button class="btn btn-primary" data-act="add-student">${ICON.plus}Öğrenci ekle</button>`)}</div>`}
    ${!showArchived && archivedCount ? `<div style="text-align:center;margin-top:16px"><a class="btn btn-ghost btn-sm" href="#/students?arsiv=1">Arşiv (${archivedCount})</a></div>` : ''}`;
}

function studentForm(st = {}) {
  return `
    <label class="field"><span>Ad Soyad</span><input class="input" name="name" value="${esc(st.name)}" placeholder="Örn. Ahmet Yılmaz" autocomplete="off" autofocus></label>
    <div class="grid-2">
      <label class="field"><span>Telefon</span><input class="input" name="phone" value="${esc(st.phone)}" inputmode="tel" placeholder="05xx"></label>
      <label class="field"><span>Hedef</span><input class="input" name="goal" value="${esc(st.goal)}" placeholder="Örn. Kas kazanımı"></label>
    </div>
    <label class="field"><span>Notlar (sakatlık, kısıtlar vb.)</span><textarea class="input" name="notes" placeholder="Örn. Sol diz hassas, derin squat yok">${esc(st.notes)}</textarea></label>`;
}

function viewStudent(id, tab, params) {
  const st = getStudent(id);
  const sess = sessionsOf(id);
  const pi = pkgInfo(st);
  const last = sess[0]?.date;
  const thisMonth = sess.filter((s) => s.date.slice(0, 7) === today().slice(0, 7)).length;

  let pkgCard;
  if (pi) {
    const cls = pi.left <= 0 ? 'out' : pi.left <= 2 ? 'low' : '';
    const cells = pi.p.total <= 40 ? [...Array(pi.p.total)].map((_, i) => `<i class="${i < pi.used ? 'used' : ''}"></i>`).join('') : '';
    pkgCard = `<div class="card pkg ${cls}" style="margin-top:14px">
      <div class="main">
        <div class="eyebrow">Paket · ${fmtDate(pi.p.start, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        <div class="big">${pi.left <= 0 ? (pi.left < 0 ? `${-pi.left} ders fazla` : 'Bitti') : `${pi.left} ders kaldı`}</div>
        <div class="small text-2">${pi.used} / ${pi.p.total} kullanıldı</div>
        ${cells ? `<div class="meter">${cells}</div>` : ''}
      </div>
      <button class="btn btn-sm ${pi.left <= 2 ? 'btn-primary' : ''}" data-act="new-package" data-id="${id}">Yeni paket</button>
    </div>`;
  } else {
    pkgCard = `<div class="card pkg" style="margin-top:14px"><div class="main"><div class="eyebrow">Paket</div><div class="text-2">Aktif paket yok</div></div><button class="btn btn-sm" data-act="new-package" data-id="${id}">Paket tanımla</button></div>`;
  }

  const tabs = [['history', 'Geçmiş'], ['progress', 'İlerleme'], ['body', 'Ölçümler'], ['info', 'Bilgi']];
  let body = '';
  if (tab === 'history') body = studentHistory(st, sess);
  else if (tab === 'progress') body = studentProgress(st, sess, params);
  else if (tab === 'body') body = studentBody(st, params);
  else body = studentInfo(st);

  return `
    ${topbar('', { back: st.archived ? '#/students?arsiv=1' : '#/students' })}
    <div class="profile" style="margin-top:-6px">
      <div class="avatar lg">${esc(initials(st.name))}</div>
      <div class="main">
        <h1>${esc(st.name)}</h1>
        <div class="text-2 small">${[st.goal, last ? 'Son: ' + relDays(last).toLocaleLowerCase('tr-TR') : 'Henüz seans yok', `bu ay ${thisMonth} ders`].filter(Boolean).map(esc).join(' · ')}</div>
      </div>
    </div>
    ${st.archived ? `<div class="card alert warn" style="margin-top:14px"><div class="ico">${ICON.alert}</div><div style="flex:1">Bu öğrenci arşivde.</div><button class="btn btn-sm" data-act="unarchive" data-id="${id}">Geri al</button></div>` : ''}
    ${pkgCard}
    <div class="btn-row" style="margin-top:12px">
      <a class="btn btn-primary" href="#/session/new?student=${id}">${ICON.plus}Yeni seans</a>
      ${st.phone ? `<a class="btn" href="tel:${esc(st.phone.replace(/\s/g, ''))}">Ara</a>` : ''}
    </div>
    <nav class="tabs">${tabs.map(([k, l]) => `<a href="#/student/${id}/${k}" class="${tab === k ? 'on' : ''}">${l}</a>`).join('')}</nav>
    ${body}`;
}

function studentHistory(st, sess) {
  if (!sess.length) return `<div class="card">${emptyState(ICON.history, 'Seans yok', 'Bu öğrenci için ilk seansı kaydet.')}</div>`;
  return `<div class="list">${sess.map((s) => {
    const d = fromISO(s.date);
    const lines = s.exercises.map((e) => `<div class="small"><span style="color:var(--text)">${esc(e.name)}</span> <span class="text-2">${esc(exSummary(e))}</span></div>`).join('');
    return `<a class="row" href="#/session/${s.id}" style="align-items:flex-start">
      <div class="date-badge"><b>${d.getDate()}</b><span>${d.toLocaleDateString('tr-TR', { month: 'short' })}</span></div>
      <div class="main">
        <div class="title" style="margin-bottom:2px">${esc(s.title || fmtDate(s.date, { weekday: 'long' }))}${s.studentIds.length > 1 ? ` <span class="chip">Grup · ${s.studentIds.length}</span>` : ''}</div>
        ${lines || '<div class="small muted">Egzersiz girilmemiş</div>'}
        ${s.notes ? `<div class="small muted" style="margin-top:4px;white-space:normal">“${esc(s.notes)}”</div>` : ''}
      </div>
    </a>`;
  }).join('')}</div>`;
}

function exerciseSeries(sess, name) {
  const key = norm(name);
  const out = [];
  for (const s of [...sess].reverse()) {
    const ex = s.exercises.find((e) => norm(e.name) === key);
    if (ex) out.push({ s, ex });
  }
  return out;
}
const STRENGTH_METRICS = {
  top: { label: 'En ağır set', unit: 'kg', f: (ex) => Math.max(0, ...ex.sets.filter((x) => x.reps).map((x) => Number(x.weight) || 0)) },
  e1rm: { label: 'Tahmini 1RM', unit: 'kg', f: (ex) => Math.max(0, ...ex.sets.filter((x) => x.reps && x.weight).map((x) => x.weight * (1 + Math.min(x.reps, 12) / 30))) },
  volume: { label: 'Hacim', unit: 'kg', f: (ex) => ex.sets.reduce((a, x) => a + (Number(x.reps) || 0) * (Number(x.weight) || 0), 0) },
  reps: { label: 'Toplam tekrar', unit: 'tekrar', f: (ex) => ex.sets.reduce((a, x) => a + (Number(x.reps) || 0), 0) },
};
const CARDIO_METRICS = {
  min: { label: 'Süre', unit: 'dk', f: (ex) => Number(ex.cardio?.min) || 0 },
  km: { label: 'Mesafe', unit: 'km', f: (ex) => Number(ex.cardio?.km) || 0, digits: 2 },
  pace: { label: 'Tempo', unit: 'dk/km', f: (ex) => (ex.cardio?.km && ex.cardio?.min ? ex.cardio.min / ex.cardio.km : 0), digits: 2 },
};

function studentProgress(st, sess, params) {
  const counts = new Map();
  for (const s of sess) for (const e of s.exercises) {
    const k = norm(e.name);
    const c = counts.get(k) || { name: e.name, kind: e.kind, n: 0 };
    c.n++; counts.set(k, c);
  }
  const exList = [...counts.values()].sort((a, b) => b.n - a.n);
  if (!exList.length) return `<div class="card">${emptyState(ICON.dumbbell, 'Henüz veri yok', 'Seans kaydettikçe her egzersizin gelişimi burada görünür.')}</div>`;
  const sel = exList.find((e) => norm(e.name) === norm(params.get('ex'))) || exList[0];
  const series = exerciseSeries(sess, sel.name);
  const metrics = sel.kind === 'cardio' ? CARDIO_METRICS : STRENGTH_METRICS;
  let mKey = params.get('m');
  if (!metrics[mKey]) {
    mKey = sel.kind === 'cardio'
      ? (series.some(({ ex }) => ex.cardio?.km) ? 'km' : 'min')
      : (series.some(({ ex }) => ex.sets.some((x) => Number(x.weight) > 0)) ? 'top' : 'reps');
  }
  const m = metrics[mKey];
  const pts = series.map(({ s, ex }) => ({ date: s.date, y: m.f(ex), sub: exSummary(ex) })).filter((p) => p.y > 0);
  const first = pts[0]?.y, lastV = pts[pts.length - 1]?.y;
  const best = pts.length ? (mKey === 'pace' ? Math.min(...pts.map((p) => p.y)) : Math.max(...pts.map((p) => p.y))) : 0;
  const d = m.digits ?? 1;
  const change = pts.length > 1 ? lastV - first : null;
  const base = `#/student/${st.id}/progress?ex=${encodeURIComponent(sel.name)}`;

  return `
    <label class="field"><span>Egzersiz</span>
      <select class="input" data-change="nav-ex" data-base="#/student/${st.id}/progress">
        ${exList.map((e) => `<option value="${esc(e.name)}" ${e === sel ? 'selected' : ''}>${esc(e.name)} (${e.n})</option>`).join('')}
      </select>
    </label>
    <div class="seg">${Object.entries(metrics).map(([k, v]) => `<a href="${base}&m=${k}" class="${k === mKey ? 'on' : ''}">${v.label}</a>`).join('')}</div>
    <div class="card" style="margin-top:12px">
      <div class="kpis k3">
        <div class="kpi"><div class="k">Son</div><div class="v">${num(lastV, d)}</div><div class="d">${m.unit}</div></div>
        <div class="kpi"><div class="k">${mKey === 'pace' ? 'En hızlı' : 'Rekor'}</div><div class="v">${num(best, d)}</div><div class="d">${m.unit}</div></div>
        <div class="kpi"><div class="k">Değişim</div><div class="v" style="color:${change == null || change === 0 ? 'var(--text)' : (change > 0) !== (mKey === 'pace') ? 'var(--ok)' : 'var(--danger)'}">${change == null ? '–' : (change > 0 ? '+' : '') + num(change, d)}</div><div class="d">${pts.length} seans</div></div>
      </div>
      ${pts.length ? lineChart(pts, { unit: m.unit, digits: d }) : '<p class="muted small" style="margin-top:12px">Bu ölçüt için kayıtlı değer yok.</p>'}
    </div>
    <div class="section"><div class="section-head"><h2>Kayıtlar</h2></div>
      <div class="card" style="padding:4px 12px"><table class="tbl"><thead><tr><th>Tarih</th><th>Detay</th><th class="r">${esc(m.label)}</th></tr></thead><tbody>
        ${[...series].reverse().map(({ s, ex }) => `<tr><td>${fmtDate(s.date)}</td><td class="text-2">${esc(exSummary(ex)) || '–'}</td><td class="r">${num(m.f(ex), d)}</td></tr>`).join('')}
      </tbody></table></div>
    </div>`;
}

const BODY_FIELDS = [
  ['weight', 'Kilo', 'kg'], ['bodyFat', 'Yağ oranı', '%'], ['waist', 'Bel', 'cm'], ['chest', 'Göğüs', 'cm'],
  ['arm', 'Kol', 'cm'], ['hip', 'Kalça', 'cm'], ['thigh', 'Bacak', 'cm'],
];
function studentBody(st, params) {
  const rows = db.metrics.filter((m) => m.studentId === st.id).sort((a, b) => a.date.localeCompare(b.date));
  const add = `<button class="btn btn-primary btn-block" data-act="add-metric" data-id="${st.id}">${ICON.plus}Ölçüm ekle</button>`;
  if (!rows.length) return `<div class="card">${emptyState(ICON.dumbbell, 'Ölçüm yok', 'Kilo, yağ oranı ve çevre ölçülerini kaydederek değişimi takip et.')}</div><div style="margin-top:12px">${add}</div>`;
  const avail = BODY_FIELDS.filter(([k]) => rows.some((r) => r[k] !== '' && r[k] != null));
  const fk = avail.find(([k]) => k === params.get('f')) || avail[0];
  const kpis = avail.map(([k, l, u]) => {
    const vals = rows.filter((r) => r[k] !== '' && r[k] != null);
    const lastV = vals[vals.length - 1][k], firstV = vals[0][k];
    const dlt = vals.length > 1 ? lastV - firstV : null;
    return `<div class="kpi"><div class="k">${l}</div><div class="v">${num(lastV)}<span class="small text-2"> ${u}</span></div><div class="d">${dlt == null ? '&nbsp;' : (dlt > 0 ? '+' : '') + num(dlt) + ' ' + u + ' (ilk ölçüme göre)'}</div></div>`;
  }).join('');
  const pts = fk ? rows.filter((r) => r[fk[0]] !== '' && r[fk[0]] != null).map((r) => ({ date: r.date, y: r[fk[0]] })) : [];
  return `
    <div class="kpis">${kpis}</div>
    ${fk ? `<div class="seg" style="margin-top:14px">${avail.map(([k, l]) => `<a href="#/student/${st.id}/body?f=${k}" class="${k === fk[0] ? 'on' : ''}">${l}</a>`).join('')}</div>
    <div class="card" style="margin-top:12px">${lineChart(pts, { unit: fk[2] })}</div>` : ''}
    <div style="margin-top:12px">${add}</div>
    <div class="section"><div class="section-head"><h2>Geçmiş ölçümler</h2></div>
      <div class="list">${[...rows].reverse().map((r) => `<div class="row" style="cursor:default">
        <div class="main"><div class="title">${fmtDate(r.date, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div class="meta" style="white-space:normal">${BODY_FIELDS.filter(([k]) => r[k] !== '' && r[k] != null).map(([k, l, u]) => `${l} ${num(r[k])}${u}`).join(' · ')}${r.notes ? ' · ' + esc(r.notes) : ''}</div></div>
        <button class="icon-btn" data-act="del-metric" data-id="${r.id}" aria-label="Sil">${ICON.trash}</button>
      </div>`).join('')}</div>
    </div>`;
}

function studentInfo(st) {
  const pk = st.packages || [];
  return `
    <form class="card" data-form="student" data-id="${st.id}">
      ${studentForm(st)}
      <button class="btn btn-primary btn-block" data-act="save-student-edit" data-id="${st.id}" type="button">${ICON.save}Kaydet</button>
    </form>
    ${pk.length ? `<div class="section"><div class="section-head"><h2>Paket geçmişi</h2></div><div class="list">${[...pk].reverse().map((p) => {
      const used = db.sessions.filter((s) => s.packageIds?.[st.id] === p.id).length;
      return `<div class="row" style="cursor:default"><div class="main"><div class="title">${p.total} derslik paket</div><div class="meta">${fmtDate(p.start, { day: 'numeric', month: 'long', year: 'numeric' })} · ${used} kullanıldı${p.price ? ' · ' + esc(p.price) + ' ₺' : ''}</div></div><button class="icon-btn" data-act="del-package" data-sid="${st.id}" data-id="${p.id}" aria-label="Sil">${ICON.trash}</button></div>`;
    }).join('')}</div></div>` : ''}
    <div class="section btn-row">
      ${st.archived ? `<button class="btn" data-act="unarchive" data-id="${st.id}">Arşivden çıkar</button>` : `<button class="btn" data-act="archive" data-id="${st.id}">Arşivle</button>`}
      <button class="btn btn-danger" data-act="delete-student" data-id="${st.id}">${ICON.trash}Sil</button>
    </div>
    <p class="small muted" style="text-align:center">Arşivlenen öğrenci listede görünmez ama tüm geçmişi saklanır.</p>`;
}

/* ---------- Seans / şablon düzenleyici ---------- */
let draft = null;   // { type:'session'|'template', key, ... }

function newExercise(name, kind) {
  return kind === 'cardio'
    ? { id: uid(), name, kind, cardio: { min: '', km: '', intensity: '', hr: '' } }
    : { id: uid(), name, kind, sets: [{ reps: '', weight: '' }, { reps: '', weight: '' }, { reps: '', weight: '' }] };
}
function copyExercises(list) {
  return clone(list).map((e) => ({ ...e, id: uid() }));
}

function ensureSessionDraft(id, params) {
  const key = 'session:' + id + '?' + params.toString();
  if (draft && draft.key === key) return draft;
  if (id === 'new') {
    const sid = params.get('student');
    draft = { type: 'session', key, id: null, date: today(), studentIds: sid && getStudent(sid) ? [sid] : [], title: '', exercises: [], notes: '' };
    const tpl = params.get('template') && getTemplate(params.get('template'));
    if (tpl) { draft.title = tpl.name; draft.exercises = copyExercises(tpl.exercises); }
  } else {
    const s = getSession(id);
    if (!s) return null;
    draft = { type: 'session', key, ...clone(s) };
  }
  return draft;
}
function ensureTemplateDraft(id) {
  const key = 'template:' + id;
  if (draft && draft.key === key) return draft;
  if (id === 'new') draft = { type: 'template', key, id: null, name: '', exercises: [] };
  else {
    const t = getTemplate(id);
    if (!t) return null;
    draft = { type: 'template', key, ...clone(t) };
  }
  return draft;
}

/* Bir öğrencinin bu egzersizi en son ne yaptığı */
function lastPerformance(studentId, exName, excludeId) {
  if (!studentId) return null;
  for (const s of sessionsOf(studentId)) {
    if (s.id === excludeId) continue;
    const ex = s.exercises.find((e) => norm(e.name) === norm(exName));
    if (ex) return { date: s.date, text: exSummary(ex) };
  }
  return null;
}

function exerciseCards(d) {
  const hintFor = d.type === 'session' && d.studentIds.length === 1 ? d.studentIds[0] : null;
  if (!d.exercises.length) return `<div class="card" style="margin-top:12px">${emptyState(ICON.dumbbell, 'Egzersiz eklenmedi', d.type === 'session' ? 'Egzersiz ekle, şablon yükle ya da son seansı tekrarla.' : 'Bu şablona egzersiz ekle.')}</div>`;
  return d.exercises.map((ex, i) => {
    const hint = hintFor ? lastPerformance(hintFor, ex.name, d.id) : null;
    let body;
    if (ex.kind === 'cardio') {
      const c = ex.cardio;
      body = `<div class="cardio-grid">
        <label class="field" style="margin:0"><span>Süre (dk)</span><input class="input" inputmode="decimal" value="${inVal(c.min)}" data-bind="ex:${ex.id}:cardio:min" placeholder="0"></label>
        <label class="field" style="margin:0"><span>Mesafe (km)</span><input class="input" inputmode="decimal" value="${inVal(c.km)}" data-bind="ex:${ex.id}:cardio:km" placeholder="–"></label>
        <label class="field" style="margin:0"><span>Yoğunluk (1–10)</span><select class="input" data-bind="ex:${ex.id}:cardio:intensity"><option value="">–</option>${[...Array(10)].map((_, n) => `<option ${Number(c.intensity) === n + 1 ? 'selected' : ''}>${n + 1}</option>`).join('')}</select></label>
        <label class="field" style="margin:0"><span>Ort. nabız</span><input class="input" inputmode="numeric" value="${inVal(c.hr)}" data-bind="ex:${ex.id}:cardio:hr" placeholder="–"></label>
      </div>`;
    } else {
      body = `<div class="sets">
        <div class="hd">Set</div><div class="hd" style="text-align:center">Tekrar</div><div class="hd" style="text-align:center">kg</div><div></div>
        ${ex.sets.map((s, j) => `
          <div class="no">${j + 1}</div>
          <input class="input" inputmode="numeric" value="${inVal(s.reps)}" data-bind="ex:${ex.id}:set:${j}:reps" placeholder="–">
          <input class="input" inputmode="decimal" value="${inVal(s.weight)}" data-bind="ex:${ex.id}:set:${j}:weight" placeholder="–">
          <button class="icon-btn" data-act="del-set" data-ex="${ex.id}" data-i="${j}" aria-label="Seti sil">${ICON.x}</button>`).join('')}
      </div>
      <div class="ex-actions"><button class="btn btn-sm" data-act="add-set" data-ex="${ex.id}">${ICON.plus}Set ekle</button></div>`;
    }
    return `<div class="ex-card">
      <div class="ex-head">
        <div class="name">${esc(ex.name)}</div>
        <span class="chip ${ex.kind === 'cardio' ? 'accent' : ''}">${ex.kind === 'cardio' ? 'Kardiyo' : 'Kuvvet'}</span>
        ${i > 0 ? `<button class="icon-btn" data-act="ex-up" data-ex="${ex.id}" aria-label="Yukarı taşı"><svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg></button>` : ''}
        <button class="icon-btn" data-act="del-ex" data-ex="${ex.id}" aria-label="Egzersizi sil">${ICON.trash}</button>
      </div>
      ${hint ? `<div class="ex-hint">${ICON.history}Geçen sefer (${fmtDate(hint.date)}): ${esc(hint.text) || '–'}</div>` : ''}
      ${body}
    </div>`;
  }).join('');
}

function viewSessionEditor(id, params) {
  const d = ensureSessionDraft(id, params);
  if (!d) { go('/'); return ''; }
  const isNew = !d.id;
  const chips = d.studentIds.map((sid) => `<span class="chip">${esc(getStudent(sid)?.name || 'Silinmiş')}<button data-act="unpick-student" data-id="${sid}" aria-label="Çıkar"><svg viewBox="0 0 24 24" width="14" height="14" style="fill:none;stroke:currentColor;stroke-width:2.6"><path d="M6 6l12 12M18 6 6 18"/></svg></button></span>`).join('');
  const one = d.studentIds.length === 1 ? d.studentIds[0] : null;
  const pi = one ? pkgInfo(getStudent(one)) : null;
  return `
    ${topbar(isNew ? 'Yeni seans' : 'Seans', { back: one ? `#/student/${one}` : '#/', right: !isNew ? `<button class="icon-btn" data-act="delete-session" aria-label="Seansı sil">${ICON.trash}</button>` : '' })}
    <div class="card">
      <div class="field"><span style="display:block;font-size:13px;color:var(--text-2);font-weight:600;margin-bottom:6px">${d.studentIds.length > 1 ? 'Öğrenciler (grup)' : 'Öğrenci'}</span>
        <div class="student-pick">${chips}<button class="btn btn-sm" data-act="pick-students">${ICON.plus}${d.studentIds.length ? 'Ekle' : 'Öğrenci seç'}</button></div>
        ${pi && isNew ? `<div class="small ${pi.left <= 0 ? '' : 'text-2'}" style="margin-top:8px;${pi.left <= 0 ? 'color:var(--danger)' : ''}">${pi.left <= 0 ? 'Paketi bitti — bu ders pakete sayılmayacak.' : `Bu ders paketten düşülecek (${pi.left} → ${pi.left - 1}).`}</div>` : ''}
      </div>
      <div class="grid-2">
        <label class="field" style="margin:0"><span>Tarih</span><input class="input" type="date" value="${d.date}" data-bind="draft:date"></label>
        <label class="field" style="margin:0"><span>Başlık (isteğe bağlı)</span><input class="input" value="${esc(d.title)}" data-bind="draft:title" placeholder="Örn. Bacak günü"></label>
      </div>
    </div>
    <div class="btn-row" style="margin-top:12px">
      <button class="btn btn-sm" data-act="load-template">${ICON.copy}Şablondan</button>
      ${one ? `<button class="btn btn-sm" data-act="repeat-last">${ICON.history}Son seansı tekrarla</button>` : ''}
    </div>
    <div id="ex-list">${exerciseCards(d)}</div>
    <button class="btn btn-block" style="margin-top:12px;border-style:dashed" data-act="add-exercise">${ICON.plus}Egzersiz ekle</button>
    <label class="field" style="margin-top:16px"><span>Notlar</span><textarea class="input" data-bind="draft:notes" placeholder="Nasıl geçti? Ağrı, enerji, bir sonraki seans için not…">${esc(d.notes)}</textarea></label>
    ${d.exercises.length ? `<button class="btn btn-ghost btn-sm" style="margin-bottom:8px" data-act="save-as-template">${ICON.save}Şablon olarak kaydet</button>` : ''}
    <div class="sticky-save">
      ${isNew ? `<button class="btn" data-act="discard-draft">Vazgeç</button>` : ''}
      <button class="btn btn-primary" style="flex:1" data-act="save-session">${ICON.check}${isNew ? 'Seansı kaydet' : 'Değişiklikleri kaydet'}</button>
    </div>`;
}

/* ---------- Şablonlar ---------- */
function viewTemplates() {
  const list = [...db.templates].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  return `
    ${topbar('Şablonlar', { right: `<a class="btn btn-primary btn-sm" href="#/template/new">${ICON.plus}Yeni</a>` })}
    <p class="text-2 small" style="margin-top:-6px">Sık kullandığın antrenmanları kaydet; seans girerken tek dokunuşla yükle.</p>
    ${list.length ? `<div class="list">${list.map((t) => `<a class="row" href="#/template/${t.id}">
      <div class="avatar" style="border-radius:12px">${ICON.dumbbell.replace('<svg', '<svg width="20" height="20" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round"')}</div>
      <div class="main"><div class="title">${esc(t.name)}</div><div class="meta">${esc(t.exercises.map((e) => e.name).join(', ')) || 'Boş'}</div></div>
      ${ICON.chev}</a>`).join('')}</div>`
      : `<div class="card">${emptyState(ICON.copy, 'Şablon yok', 'Örn. “Bacak Günü A” veya “HIIT 20 dk” gibi bir şablon oluştur.', `<a class="btn btn-primary" href="#/template/new">${ICON.plus}Şablon oluştur</a>`)}</div>`}`;
}

function viewTemplateEditor(id) {
  const d = ensureTemplateDraft(id);
  if (!d) { go('/templates'); return ''; }
  return `
    ${topbar(d.id ? 'Şablonu düzenle' : 'Yeni şablon', { back: '#/templates', right: d.id ? `<button class="icon-btn" data-act="delete-template" aria-label="Şablonu sil">${ICON.trash}</button>` : '' })}
    <div class="card"><label class="field" style="margin:0"><span>Şablon adı</span><input class="input" value="${esc(d.name)}" data-bind="draft:name" placeholder="Örn. Üst Vücut A"></label></div>
    <div id="ex-list">${exerciseCards(d)}</div>
    <button class="btn btn-block" style="margin-top:12px;border-style:dashed" data-act="add-exercise">${ICON.plus}Egzersiz ekle</button>
    <div class="sticky-save">
      ${d.id ? `<a class="btn" href="#/session/new?template=${d.id}">Seans başlat</a>` : ''}
      <button class="btn btn-primary" style="flex:1" data-act="save-template">${ICON.check}Şablonu kaydet</button>
    </div>`;
}

/* ---------- Ayarlar ---------- */
function viewSettings() {
  const bytes = new Blob([JSON.stringify(db)]).size;
  return `
    ${topbar('Ayarlar')}
    <div class="card">
      <label class="field" style="margin:0"><span>Adın (ana ekranda selamlama için)</span><input class="input" value="${esc(db.coachName)}" data-bind="settings:coachName" placeholder="Örn. Murat Hoca"></label>
    </div>

    <div class="section"><div class="section-head"><h2>Yedekleme</h2></div>
      <div class="card">
        <div class="alert accent" style="margin-bottom:14px"><div class="ico">${ICON.shield}</div><div class="small text-2">Veriler sadece bu cihazda saklanır. Haftada bir yedek alıp Dosyalar/iCloud/Drive'a kaydetmen önerilir. Yeni bir cihaza geçerken yedeği orada yükle.</div></div>
        <div class="small text-2" style="margin-bottom:12px">Son yedek: <b style="color:var(--text)">${db.lastBackup ? fmtDate(db.lastBackup.slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' }) : 'Hiç alınmadı'}</b></div>
        <div class="btn-row">
          <button class="btn btn-primary" data-act="export">${ICON.download}Yedek al</button>
          <button class="btn" data-act="import">${ICON.upload}Yedek yükle</button>
        </div>
      </div>
    </div>

    <div class="section"><div class="section-head"><h2>Özet</h2></div>
      <div class="kpis">
        <div class="kpi"><div class="k">Öğrenci</div><div class="v">${db.students.length}</div></div>
        <div class="kpi"><div class="k">Seans</div><div class="v">${db.sessions.length}</div></div>
        <div class="kpi"><div class="k">Şablon</div><div class="v">${db.templates.length}</div></div>
        <div class="kpi"><div class="k">Veri boyutu</div><div class="v">${num(bytes / 1024)}</div><div class="d">KB</div></div>
      </div>
    </div>

    <div class="section"><div class="section-head"><h2>Uygulama gibi kullan</h2></div>
      <div class="card small text-2">
        <b style="color:var(--text)">iPhone/iPad:</b> Safari'de Paylaş → <i>Ana Ekrana Ekle</i>.<br>
        <b style="color:var(--text)">Android:</b> Chrome menüsü → <i>Ana ekrana ekle / Uygulamayı yükle</i>.<br>
        Ana ekrandan açınca internet olmadan da çalışır.
      </div>
    </div>

    <div class="section"><div class="section-head"><h2>Veri</h2></div>
      <div class="btn-row">
        <button class="btn" data-act="demo">Örnek veri yükle</button>
        <button class="btn btn-danger" data-act="wipe">${ICON.trash}Tüm verileri sil</button>
      </div>
    </div>
    <p class="small muted" style="text-align:center;margin-top:24px">Koç Takip · v1.0</p>`;
}

/* =========================================================
   YÖNLENDİRME & RENDER
   ========================================================= */
function parseHash() {
  const h = location.hash.slice(1) || '/';
  const [path, q] = h.split('?');
  return { parts: path.split('/').filter(Boolean), params: new URLSearchParams(q || '') };
}
function go(h) { location.hash = h; }

let lastPath = null;
function render() {
  const { parts, params } = parseHash();
  const [a, b, c] = parts;
  charts.clear();
  let html = '', tab = '';
  if (!a) { tab = 'home'; html = viewHome(params); }
  else if (a === 'students') { tab = 'students'; html = viewStudents(params); }
  else if (a === 'student' && getStudent(b)) { tab = 'students'; html = viewStudent(b, c || 'history', params); }
  else if (a === 'session' && b) { tab = b === 'new' ? 'new' : ''; html = viewSessionEditor(b, params); }
  else if (a === 'templates') { tab = 'templates'; html = viewTemplates(); }
  else if (a === 'template' && b) { tab = 'templates'; html = viewTemplateEditor(b); }
  else if (a === 'settings') { tab = 'settings'; html = viewSettings(); }
  else { go('/'); return; }
  if (!html) return;
  $('#view').innerHTML = html;
  for (const el of $$('#tabbar a')) el.classList.toggle('on', el.dataset.tab === tab);
  bindCharts();
  const path = parts.slice(0, 2).join('/');
  if (path !== lastPath) window.scrollTo(0, 0);
  lastPath = path;
}
/* Düzenleyicide sadece egzersiz listesini yenile (kaydırma ve odak korunur) */
function refreshExercises() {
  const el = $('#ex-list');
  if (el && draft) el.innerHTML = exerciseCards(draft);
  else render();
}

/* =========================================================
   OLAYLAR
   ========================================================= */
function formData(root) {
  const o = {};
  for (const el of $$('[name]', root)) o[el.name] = el.value.trim();
  return o;
}
function findEx(id) { return draft?.exercises.find((e) => e.id === id); }

function pickStudentsSheet() {
  const sel = new Set(draft.studentIds);
  const list = activeStudents();
  openSheet('Öğrenci seç', `
    ${list.length > 6 ? `<div class="search">${ICON.search}<input class="input" placeholder="Ara" data-filter="#sheet .pick-list .row" autofocus></div>` : ''}
    ${list.length ? `<div class="list pick-list">${list.map((st) => `<button class="row ${sel.has(st.id) ? 'on' : ''}" data-act="toggle-pick" data-id="${st.id}" data-name="${esc(norm(st.name))}">
      <div class="avatar" style="width:36px;height:36px;font-size:13px">${esc(initials(st.name))}</div><div class="main"><div class="title">${esc(st.name)}</div></div><div class="check">${ICON.check}</div></button>`).join('')}</div>`
      : '<p class="text-2">Henüz öğrenci yok.</p>'}
    <div class="btn-row" style="margin-top:14px">
      <button class="btn" data-act="sheet-new-student">${ICON.plus}Yeni öğrenci</button>
      <button class="btn btn-primary" data-act="apply-pick">Tamam</button>
    </div>
    <p class="small muted" style="margin-top:10px">Birden fazla öğrenci seçersen grup dersi olarak kaydedilir; her öğrencinin paketinden bir ders düşülür.</p>`);
}

function addExerciseSheet() {
  const lib = exerciseLibrary();
  const item = (e) => `<button class="row" data-act="pick-ex" data-name="${esc(e.name)}" data-kind="${e.kind}" data-filter-name="${esc(norm(e.name))}">
    <div class="main"><div class="title">${esc(e.name)}</div></div><span class="chip ${e.kind === 'cardio' ? 'accent' : ''}">${e.kind === 'cardio' ? 'Kardiyo' : 'Kuvvet'}</span></button>`;
  openSheet('Egzersiz ekle', `
    <div class="search">${ICON.search}<input class="input" id="ex-search" placeholder="Ara ya da yeni egzersiz yaz" data-filter="#sheet .pick-list .row" data-filter-attr="filter-name" autofocus></div>
    <div id="ex-custom" class="btn-row" style="margin-top:10px" hidden>
      <button class="btn btn-sm" data-act="custom-ex" data-kind="strength">+ Kuvvet olarak ekle</button>
      <button class="btn btn-sm" data-act="custom-ex" data-kind="cardio">+ Kardiyo olarak ekle</button>
    </div>
    <div class="list pick-list">${lib.map(item).join('')}</div>`);
}

function applyFilter(input) {
  const q = norm(input.value);
  const attr = input.dataset.filterAttr || 'name';
  let shown = 0;
  for (const r of $$(input.dataset.filter)) {
    const ok = !q || (r.dataset[attr === 'name' ? 'name' : 'filterName'] || '').includes(q);
    r.style.display = ok ? '' : 'none';
    if (ok) shown++;
  }
  if (input.id === 'ex-search') {
    const exact = $$(input.dataset.filter).some((r) => r.dataset.filterName === q);
    $('#ex-custom').hidden = !q || exact;
    for (const b of $$('#ex-custom [data-act]')) b.textContent = `+ “${input.value.trim()}” ${b.dataset.kind === 'cardio' ? 'kardiyo' : 'kuvvet'} olarak ekle`;
  }
}

function metricSheet(sid) {
  const prev = db.metrics.filter((m) => m.studentId === sid).sort((a, b) => b.date.localeCompare(a.date))[0] || {};
  openSheet('Ölçüm ekle', `
    <form data-form="metric">
      <label class="field"><span>Tarih</span><input class="input" type="date" name="date" value="${today()}"></label>
      <div class="grid-2">${BODY_FIELDS.map(([k, l, u]) => `<label class="field"><span>${l} (${u})</span><input class="input" name="${k}" inputmode="decimal" placeholder="${prev[k] !== '' && prev[k] != null ? 'önceki: ' + inVal(prev[k]) : '–'}"></label>`).join('')}</div>
      <label class="field"><span>Not</span><input class="input" name="notes" placeholder="Örn. sabah aç karnına"></label>
      <button class="btn btn-primary btn-block" type="button" data-act="save-metric" data-id="${sid}">${ICON.check}Kaydet</button>
    </form>`);
}

function packageSheet(sid) {
  const pi = pkgInfo(getStudent(sid));
  openSheet('Yeni paket', `
    <form data-form="package">
      <div class="field"><span>Ders sayısı</span>
        <div class="seg" style="margin-bottom:8px">${[4, 8, 10, 12, 16, 20].map((n) => `<button type="button" data-act="pkg-size" data-n="${n}" class="${n === (pi?.p.total || 10) ? 'on' : ''}">${n}</button>`).join('')}</div>
        <input class="input" name="total" inputmode="numeric" value="${pi?.p.total || 10}">
      </div>
      <div class="grid-2">
        <label class="field"><span>Başlangıç</span><input class="input" type="date" name="start" value="${today()}"></label>
        <label class="field"><span>Ücret (₺, isteğe bağlı)</span><input class="input" name="price" inputmode="decimal" placeholder="–"></label>
      </div>
      ${pi && pi.left > 0 ? `<p class="small text-2">Mevcut pakette ${pi.left} ders kaldı. Yeni paket başlarsa kalan dersler sayılmaz.</p>` : ''}
      <button class="btn btn-primary btn-block" type="button" data-act="save-package" data-id="${sid}">${ICON.check}Paketi başlat</button>
    </form>`);
}

function newStudentSheet(fromPicker = false) {
  openSheet('Yeni öğrenci', `
    <form data-form="new-student">
      ${studentForm()}
      <label class="field"><span>Paket (ders sayısı, yoksa 0)</span><input class="input" name="pkg" inputmode="numeric" value="10"></label>
      <button class="btn btn-primary btn-block" type="button" data-act="save-student-new" data-from-picker="${fromPicker ? 1 : ''}">${ICON.check}Öğrenciyi ekle</button>
    </form>`);
}

function saveSessionDraft() {
  const d = draft;
  if (!d.studentIds.length) { toast('En az bir öğrenci seç.'); return; }
  if (!d.date) { toast('Tarih seç.'); return; }
  const clean = d.exercises.map((e) => e.kind === 'cardio' ? e : { ...e, sets: e.sets.filter((s) => s.reps !== '' || s.weight !== '') });
  const rec = { id: d.id || uid(), date: d.date, studentIds: [...d.studentIds], title: d.title.trim(), exercises: clean, notes: d.notes.trim(), packageIds: {}, createdAt: d.createdAt || Date.now() };
  const old = d.id ? getSession(d.id) : null;
  for (const sid of rec.studentIds) {
    if (old?.packageIds?.[sid]) { rec.packageIds[sid] = old.packageIds[sid]; continue; }
    const pi = pkgInfo(getStudent(sid));
    if (pi && pi.left > 0) rec.packageIds[sid] = pi.p.id;
  }
  if (old) Object.assign(old, rec); else db.sessions.push(rec);
  persist();
  const one = rec.studentIds.length === 1 ? rec.studentIds[0] : null;
  draft = null;
  // Paket uyarısı
  const low = rec.studentIds.map(getStudent).map((st) => ({ st, pi: pkgInfo(st) })).filter((x) => x.pi && x.pi.left <= 1);
  toast(low.length ? `Kaydedildi · ${low[0].st.name}: ${low[0].pi.left <= 0 ? 'paket bitti' : 'son 1 ders kaldı'}` : 'Seans kaydedildi');
  go(one ? `/student/${one}` : '/');
}

const actions = {
  'close-sheet': closeSheet,
  'add-student': () => newStudentSheet(false),
  'sheet-new-student': () => newStudentSheet(true),
  'save-student-new': (el) => {
    const f = formData(el.closest('form'));
    if (!f.name) { toast('Ad gerekli.'); return; }
    const st = { id: uid(), name: f.name, phone: f.phone, goal: f.goal, notes: f.notes, createdAt: Date.now(), archived: false, packages: [] };
    const n = parseInt(f.pkg, 10);
    if (n > 0) st.packages.push({ id: uid(), total: n, start: today() });
    db.students.push(st);
    persist();
    closeSheet();
    if (el.dataset.fromPicker && draft?.type === 'session') {
      draft.studentIds.push(st.id);
      render();
    } else go(`/student/${st.id}`);
    toast('Öğrenci eklendi');
  },
  'save-student-edit': (el) => {
    const st = getStudent(el.dataset.id);
    const f = formData(el.closest('form'));
    if (!f.name) { toast('Ad gerekli.'); return; }
    Object.assign(st, { name: f.name, phone: f.phone, goal: f.goal, notes: f.notes });
    persist(); render(); toast('Kaydedildi');
  },
  archive: (el) => { getStudent(el.dataset.id).archived = true; persist(); toast('Arşivlendi'); go('/students'); },
  unarchive: (el) => { getStudent(el.dataset.id).archived = false; persist(); render(); toast('Arşivden çıkarıldı'); },
  'delete-student': (el) => {
    const st = getStudent(el.dataset.id);
    const n = sessionsOf(st.id).length;
    if (!confirm(`${st.name} ve ${n} seans kaydı kalıcı olarak silinsin mi?\n(Sadece listeden kaldırmak için “Arşivle”yi kullan.)`)) return;
    db.sessions = db.sessions.filter((s) => {
      if (!s.studentIds.includes(st.id)) return true;
      s.studentIds = s.studentIds.filter((x) => x !== st.id);
      if (s.packageIds) delete s.packageIds[st.id];
      return s.studentIds.length > 0;
    });
    db.metrics = db.metrics.filter((m) => m.studentId !== st.id);
    db.students = db.students.filter((s) => s.id !== st.id);
    persist(); toast('Silindi'); go('/students');
  },
  'new-package': (el) => packageSheet(el.dataset.id),
  'pkg-size': (el) => {
    $$('[data-act="pkg-size"]').forEach((b) => b.classList.toggle('on', b === el));
    el.closest('form').querySelector('[name="total"]').value = el.dataset.n;
  },
  'save-package': (el) => {
    const f = formData(el.closest('form'));
    const n = parseInt(f.total, 10);
    if (!(n > 0)) { toast('Geçerli bir ders sayısı gir.'); return; }
    const st = getStudent(el.dataset.id);
    (st.packages ||= []).push({ id: uid(), total: n, start: f.start || today(), price: f.price });
    persist(); closeSheet(); render(); toast(`${n} derslik paket başladı`);
  },
  'del-package': (el) => {
    if (!confirm('Bu paket kaydı silinsin mi? Seanslar silinmez.')) return;
    const st = getStudent(el.dataset.sid);
    st.packages = st.packages.filter((p) => p.id !== el.dataset.id);
    for (const s of db.sessions) if (s.packageIds?.[st.id] === el.dataset.id) delete s.packageIds[st.id];
    persist(); render();
  },
  'add-metric': (el) => metricSheet(el.dataset.id),
  'save-metric': (el) => {
    const f = formData(el.closest('form'));
    const rec = { id: uid(), studentId: el.dataset.id, date: f.date || today(), notes: f.notes };
    let any = false;
    for (const [k] of BODY_FIELDS) { rec[k] = parseNum(f[k]); if (rec[k] !== '') any = true; }
    if (!any) { toast('En az bir değer gir.'); return; }
    db.metrics.push(rec); persist(); closeSheet(); render(); toast('Ölçüm kaydedildi');
  },
  'del-metric': (el) => {
    if (!confirm('Bu ölçüm silinsin mi?')) return;
    db.metrics = db.metrics.filter((m) => m.id !== el.dataset.id); persist(); render();
  },

  // Seans düzenleyici
  'pick-students': pickStudentsSheet,
  'toggle-pick': (el) => el.classList.toggle('on'),
  'apply-pick': () => {
    const picked = $$('#sheet .row.on').map((r) => r.dataset.id);
    // seçim sırasını koru: mevcutlar önce
    draft.studentIds = [...draft.studentIds.filter((id) => picked.includes(id)), ...picked.filter((id) => !draft.studentIds.includes(id))];
    closeSheet(); render();
  },
  'unpick-student': (el) => { draft.studentIds = draft.studentIds.filter((id) => id !== el.dataset.id); render(); },
  'add-exercise': addExerciseSheet,
  'pick-ex': (el) => {
    draft.exercises.push(newExercise(el.dataset.name, el.dataset.kind));
    closeSheet(); refreshExercises();
    setTimeout(() => { const c = $$('.ex-card').pop(); c?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 30);
  },
  'custom-ex': (el) => {
    const name = $('#ex-search').value.trim();
    if (!name) return;
    if (!db.customExercises.some((e) => norm(e.name) === norm(name))) { db.customExercises.push({ name, kind: el.dataset.kind }); persist(); }
    actions['pick-ex']({ dataset: { name, kind: el.dataset.kind } });
  },
  'del-ex': (el) => { draft.exercises = draft.exercises.filter((e) => e.id !== el.dataset.ex); refreshExercises(); },
  'ex-up': (el) => {
    const i = draft.exercises.findIndex((e) => e.id === el.dataset.ex);
    if (i > 0) { const [x] = draft.exercises.splice(i, 1); draft.exercises.splice(i - 1, 0, x); refreshExercises(); }
  },
  'add-set': (el) => {
    const ex = findEx(el.dataset.ex);
    const last = ex.sets[ex.sets.length - 1];
    ex.sets.push(last ? { ...last } : { reps: '', weight: '' });
    refreshExercises();
  },
  'del-set': (el) => { const ex = findEx(el.dataset.ex); ex.sets.splice(+el.dataset.i, 1); refreshExercises(); },
  'load-template': () => {
    if (!db.templates.length) { toast('Henüz şablon yok — Şablonlar sekmesinden oluştur.'); return; }
    openSheet('Şablon seç', `<div class="list pick-list">${db.templates.map((t) => `<button class="row" data-act="apply-template" data-id="${t.id}"><div class="main"><div class="title">${esc(t.name)}</div><div class="meta">${esc(t.exercises.map((e) => e.name).join(', '))}</div></div>${ICON.chev}</button>`).join('')}</div>
      <p class="small muted" style="margin-top:10px">Şablondaki egzersizler mevcut listeye eklenir.</p>`);
  },
  'apply-template': (el) => {
    const t = getTemplate(el.dataset.id);
    draft.exercises.push(...copyExercises(t.exercises));
    if (!draft.title) draft.title = t.name;
    closeSheet(); render(); toast(`“${t.name}” yüklendi`);
  },
  'repeat-last': () => {
    const sid = draft.studentIds[0];
    const last = sessionsOf(sid).find((s) => s.id !== draft.id);
    if (!last) { toast('Bu öğrencinin önceki seansı yok.'); return; }
    if (draft.exercises.length && !confirm('Mevcut egzersizler son seansla değiştirilsin mi?')) return;
    draft.exercises = copyExercises(last.exercises);
    if (!draft.title) draft.title = last.title || '';
    render(); toast(`${fmtDate(last.date)} seansı kopyalandı`);
  },
  'save-session': saveSessionDraft,
  'discard-draft': () => {
    const one = draft?.studentIds.length === 1 ? draft.studentIds[0] : null;
    if (draft?.exercises.length && !confirm('Girilenler silinsin mi?')) return;
    draft = null; go(one ? `/student/${one}` : '/');
  },
  'delete-session': () => {
    if (!confirm('Bu seans silinsin mi? Paketten düşülen ders geri eklenir.')) return;
    const one = draft.studentIds.length === 1 ? draft.studentIds[0] : null;
    db.sessions = db.sessions.filter((s) => s.id !== draft.id);
    draft = null; persist(); toast('Seans silindi'); go(one ? `/student/${one}` : '/');
  },
  'save-as-template': () => {
    openSheet('Şablon olarak kaydet', `<label class="field"><span>Şablon adı</span><input class="input" id="tpl-name" value="${esc(draft.title)}" placeholder="Örn. Bacak Günü A" autofocus></label>
      <p class="small text-2">Setler ve ağırlıklar şablona aynen kopyalanır.</p>
      <button class="btn btn-primary btn-block" data-act="confirm-save-template">${ICON.check}Kaydet</button>`);
  },
  'confirm-save-template': () => {
    const name = $('#tpl-name').value.trim();
    if (!name) { toast('İsim gerekli.'); return; }
    db.templates.push({ id: uid(), name, exercises: copyExercises(draft.exercises) });
    persist(); closeSheet(); toast('Şablon kaydedildi');
  },

  // Şablon düzenleyici
  'save-template': () => {
    const d = draft;
    if (!d.name.trim()) { toast('Şablon adı gerekli.'); return; }
    const rec = { id: d.id || uid(), name: d.name.trim(), exercises: d.exercises };
    const old = d.id && getTemplate(d.id);
    if (old) Object.assign(old, rec); else db.templates.push(rec);
    persist(); draft = null; toast('Şablon kaydedildi'); go('/templates');
  },
  'delete-template': () => {
    if (!confirm('Şablon silinsin mi?')) return;
    db.templates = db.templates.filter((t) => t.id !== draft.id);
    persist(); draft = null; go('/templates');
  },

  // Ayarlar
  export: exportBackup,
  import: () => $('#import-file').click(),
  demo: () => {
    if (db.students.length && !confirm('Örnek veriler mevcut verilerin YERİNE yüklenecek. Devam edilsin mi?')) return;
    db = makeDemo(); persist(); draft = null; toast('Örnek veriler yüklendi'); go('/'); render();
  },
  wipe: () => {
    if (!confirm('TÜM öğrenciler, seanslar ve şablonlar silinecek. Emin misin?')) return;
    if (!confirm('Son kez soruyorum: geri alınamaz. Silinsin mi?')) return;
    db = blankDB(); persist(); draft = null; toast('Tüm veriler silindi'); go('/'); render();
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.filter) return applyFilter(el);
  const b = el.dataset.bind;
  if (!b) return;
  const p = b.split(':');
  if (p[0] === 'settings') { db[p[1]] = el.value.trim(); persist(); return; }
  if (!draft) return;
  if (p[0] === 'draft') { draft[p[1]] = el.value; return; }
  if (p[0] === 'ex') {
    const ex = findEx(p[1]);
    if (!ex) return;
    if (p[2] === 'cardio') ex.cardio[p[3]] = parseNum(el.value);
    else if (p[2] === 'set') ex.sets[+p[3]][p[4]] = parseNum(el.value);
  }
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.change === 'nav-ex') go(el.dataset.base.slice(1) + '?ex=' + encodeURIComponent(el.value));
  else if (el.dataset.bind && el.tagName === 'SELECT') el.dispatchEvent(new Event('input', { bubbles: true }));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet();
  // Enter ile sonraki alana geç (set girişinde hızlı akış)
  if (e.key === 'Enter' && e.target.matches('.sets .input, .cardio-grid .input')) {
    e.preventDefault();
    const all = $$('.sets .input, .cardio-grid .input');
    const next = all[all.indexOf(e.target) + 1];
    if (next) next.focus(); else e.target.blur();
  }
});

/* ---------- Yedekleme ---------- */
async function exportBackup() {
  const data = JSON.stringify({ ...db, exportedAt: new Date().toISOString(), app: 'koc-takip' }, null, 1);
  const name = `koc-yedek-${today()}.json`;
  const file = new File([data], name, { type: 'application/json' });
  const mark = () => { db.lastBackup = new Date().toISOString(); persist(); render(); toast('Yedek hazır'); };
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
      await navigator.share({ files: [file], title: 'Koç Takip yedeği' });
      return mark();
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  mark();
}
$('#import-file').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!Array.isArray(data.students) || !Array.isArray(data.sessions)) throw new Error('format');
    const when = data.exportedAt ? fmtDate(data.exportedAt.slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' }) : 'bilinmeyen tarih';
    if (!confirm(`Yedek (${when}): ${data.students.length} öğrenci, ${data.sessions.length} seans.\nMevcut verilerin yerine yüklensin mi?`)) return;
    delete data.exportedAt; delete data.app;
    db = Object.assign(blankDB(), data);
    persist(); draft = null; toast('Yedek yüklendi'); go('/'); render();
  } catch (err) {
    toast('Dosya okunamadı — geçerli bir yedek değil.');
  }
});

/* ---------- Örnek veri ---------- */
function makeDemo() {
  const d = blankDB();
  d.coachName = '';
  const t0 = today();
  const S = (name, goal, notes, pkgTotal, pkgStartAgo, phone = '') => {
    const st = { id: uid(), name, goal, notes, phone, createdAt: Date.now() - 60 * 86400000, archived: false, packages: [] };
    if (pkgTotal) st.packages.push({ id: uid(), total: pkgTotal, start: addDays(t0, -pkgStartAgo) });
    d.students.push(st);
    return st;
  };
  const ahmet = S('Ahmet Yılmaz', 'Kas kazanımı', 'Bench’te sağ omuz hassas, geniş tutuş yok.', 12, 26, '0532 000 00 00');
  const elif = S('Elif Kaya', 'Yağ yakımı', '', 10, 20);
  const mert = S('Mert Demir', 'Kuvvet', '', 8, 30);
  const zeynep = S('Zeynep Arslan', 'Genel kondisyon', 'Bel fıtığı geçmişi — deadlift yerine hip thrust.', 10, 45);
  const can = S('Can Öztürk', 'Kilo verme', '', 0, 0);

  const sets = (n, reps, w) => [...Array(n)].map(() => ({ reps, weight: w }));
  const str = (name, n, reps, w) => ({ id: uid(), name, kind: 'strength', sets: sets(n, reps, w) });
  const car = (name, min, km, intensity, hr = '') => ({ id: uid(), name, kind: 'cardio', cardio: { min, km, intensity, hr } });
  const sess = (st, ago, title, exercises, notes = '', extra = []) => {
    const ids = [st.id, ...extra.map((x) => x.id)];
    const s = { id: uid(), date: addDays(t0, -ago), studentIds: ids, title, exercises, notes, packageIds: {}, createdAt: Date.now() - ago * 86400000 };
    for (const x of [st, ...extra]) {
      const p = x.packages[x.packages.length - 1];
      if (p && s.date >= p.start) {
        const used = d.sessions.filter((q) => q.packageIds[x.id] === p.id).length;
        if (used < p.total) s.packageIds[x.id] = p.id;
      }
    }
    d.sessions.push(s);
  };

  // Ahmet: 6 hafta, haftada 2 — ilerleyen yükler
  for (let w = 5; w >= 0; w--) {
    const k = 5 - w;
    sess(ahmet, w * 7 + 4, 'Bacak & Sırt', [str('Squat', 4, 6, 80 + k * 2.5), str('Romanian Deadlift', 3, 8, 70 + k * 2.5), str('Lat Pulldown', 3, 10, 55 + k * 2.5)], k === 3 ? 'Squat’ta derinlik iyi, tempo yavaş tut.' : '');
    if (w * 7 + 1 >= 0) sess(ahmet, w * 7 + 1, 'Üst Vücut', [str('Bench Press', 4, 6, 70 + k * 2.5), str('Barbell Row', 4, 8, 60 + k * 2.5), str('Dumbbell Shoulder Press', 3, 10, 18 + Math.floor(k / 2) * 2), car('Bisiklet', 10, '', 5)]);
  }
  // Elif: kardiyo ağırlıklı
  for (let w = 5; w >= 0; w--) {
    const k = 5 - w;
    sess(elif, w * 7 + 5, 'HIIT + Core', [car('Koşu Bandı', 25, +(3.4 + k * 0.15).toFixed(2), 7, 152 - k), str('Goblet Squat', 3, 12, 12 + k), str('Hanging Leg Raise', 3, 10, '')]);
    sess(elif, w * 7 + 2, 'Tüm Vücut', [car('Kürek (Rowing)', 12, +(2.2 + k * 0.08).toFixed(2), 6), str('Hip Thrust', 3, 12, 40 + k * 5), str('Lat Pulldown', 3, 12, 30 + k * 2.5)]);
  }
  // Mert: paket bitmek üzere
  for (let i = 0; i < 7; i++) sess(mert, 29 - i * 4, 'Kuvvet', [str('Deadlift', 5, 5, 120 + i * 5), str('Overhead Press', 5, 5, 45 + i * 1.25), str('Barfiks (Pull-up)', 3, 6 + Math.floor(i / 2), '')]);
  // Zeynep: 3 haftadır yok
  for (let i = 0; i < 4; i++) sess(zeynep, 44 - i * 6, 'Kondisyon', [car('Eliptik', 20, '', 5), str('Hip Thrust', 3, 12, 30 + i * 5), str('Seated Cable Row', 3, 12, 25 + i * 2.5)]);
  // Grup dersi
  sess(can, 3, 'Grup HIIT', [car('HIIT', 30, '', 8), car('İp Atlama', 10, '', 7)], 'Cumartesi grup dersi', [elif]);

  // Ölçümler
  for (let i = 0; i < 6; i++) {
    d.metrics.push({ id: uid(), studentId: elif.id, date: addDays(t0, -(35 - i * 7)), weight: +(72.4 - i * 0.6).toFixed(1), bodyFat: +(29.5 - i * 0.5).toFixed(1), waist: 82 - i, chest: '', arm: '', hip: 104 - i * 0.5, thigh: '', notes: '' });
    d.metrics.push({ id: uid(), studentId: ahmet.id, date: addDays(t0, -(35 - i * 7)), weight: +(74.0 + i * 0.35).toFixed(1), bodyFat: +(15.2 - i * 0.1).toFixed(1), waist: '', chest: 98 + i * 0.5, arm: +(34.5 + i * 0.2).toFixed(1), hip: '', thigh: '', notes: '' });
  }
  // Şablonlar
  d.templates.push(
    { id: uid(), name: 'Bacak Günü A', exercises: [str('Squat', 4, 8, ''), str('Romanian Deadlift', 3, 10, ''), str('Leg Press', 3, 12, ''), str('Leg Curl', 3, 12, ''), str('Calf Raise', 3, 15, '')] },
    { id: uid(), name: 'Üst Vücut A', exercises: [str('Bench Press', 4, 8, ''), str('Barbell Row', 4, 8, ''), str('Dumbbell Shoulder Press', 3, 10, ''), str('Lateral Raise', 3, 15, ''), str('Triceps Pushdown', 3, 12, '')] },
    { id: uid(), name: 'HIIT 20 dk', exercises: [car('Assault Bike', 10, '', 8), car('Kürek (Rowing)', 10, '', 8)] },
  );
  return d;
}

/* ---------- Başlat ---------- */
window.addEventListener('hashchange', render);
let resizeTimer, lastWidth = window.innerWidth;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (window.innerWidth !== lastWidth && charts.size && $('#sheet').hidden) { lastWidth = window.innerWidth; render(); }
  }, 200);
});
render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
