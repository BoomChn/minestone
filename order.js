// Order: a ring of beads that redraws with every choice, meaning arcs counted from real beads,
// bead-by-bead painting, and the wrist guide. Prices and the stone → intent mapping are drafts.
const STONES = {
  rose:       { name: "โรสควอตซ์",      type: "ธรรมชาติ",    intent: "love",    price: 20, belief: "ตามความเชื่อ เกี่ยวกับความรัก ความอ่อนโยน และการใจดีกับตัวเอง" },
  amethyst:   { name: "อเมทิสต์",        type: "ธรรมชาติ",    intent: "calm",    price: 25, belief: "ตามความเชื่อ เกี่ยวกับความสงบ ใจที่นิ่ง และการนอนหลับ" },
  citrine:    { name: "ซิทริน",          type: "ผ่านความร้อน", intent: "work",    price: 30, belief: "ตามความเชื่อ เกี่ยวกับความมั่นใจและแรงผลักดันในการทำงาน" },
  aventurine: { name: "กรีนอะเวนเจอรีน", type: "ธรรมชาติ",    intent: "money",   price: 18, belief: "ตามความเชื่อ เกี่ยวกับโชคลาภและเงินที่หมุนเวียนดี" },
  moon:       { name: "มูนสโตน",         type: "ธรรมชาติ",    intent: "calm",    price: 35, belief: "ตามความเชื่อ หินของพระจันทร์ เกี่ยวกับความอ่อนโยนและใจที่นิ่ง" },
  onyx:       { name: "ออนิกซ์ดำ",       type: "ย้อมสี",      intent: "protect", price: 15, belief: "ตามความเชื่อ เกี่ยวกับการปกป้องและกันสิ่งไม่ดี" },
};
const INTENTS = {
  love:    { name: "ความรัก",    c: "#E0A2AD" },
  work:    { name: "การงาน",     c: "#C08A3E" },
  money:   { name: "การเงิน",     c: "#7FA283" },
  protect: { name: "การปกป้อง",  c: "#4A4A55" },
  calm:    { name: "ความสงบใจ",  c: "#A98BC4" },
};
const SIZES = { 6: 0.75, 8: 1, 10: 1.4 }; // price multiplier per bead size
const THREADS = {
  clear: { name: "เชือกยืดใส", note: "ใส่ถอดง่าย มองแทบไม่เห็นเชือก", extra: 0, stroke: "#C9C6BF" },
  black: { name: "เชือกยืดสีดำ", note: "เข้ากับหินสีเข้ม เช่น ออนิกซ์หรืออเมทิสต์", extra: 0, stroke: "#222" },
  red:   { name: "ด้ายแดงถัก ปรับขนาดได้", note: "ตามความเชื่อจีน ด้ายแดงเกี่ยวกับโชคและการคุ้มครอง", extra: 60, stroke: "#B23A3A" },
};
const WRISTS = [14, 15, 16, 17, 18, 19];
const LABOUR = 120;
const img = (id) => `url(assets/b-${id}.jpg)`;
const baht = (n) => `${n.toLocaleString("th-TH")} บาท`;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrow = matchMedia("(max-width: 960px)");

const state = { wrist: 16, size: 8, main: "rose", thread: "clear", held: "moon", beads: [], view: "ring", rot: 0 };
const history = [];
const count = () => Math.floor(((state.wrist + 1) * 10) / state.size);
const stoneAt = (i) => state.beads[i] || state.main;

// Start from the design's example: every third bead moonstone.
state.beads = Array.from({ length: count() }, (_, i) => (i % 3 === 1 ? "moon" : null));

const $ = (id) => document.getElementById(id);
const stage = $("stage"), beadsEl = $("beads"), arcsEl = $("arcs"), threadEl = $("thread"), labelsEl = $("arc-labels");
const armEl = $("arm");

/* ---------- Options ---------- */
function radio(container, items, current, onPick) {
  container.setAttribute("role", "radiogroup");
  container.innerHTML = "";
  items.forEach(({ value, html, label }) => {
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("role", "radio"); b.dataset.value = value;
    if (label) b.setAttribute("aria-label", label);
    b.innerHTML = html;
    b.addEventListener("click", () => onPick(value));
    container.append(b);
  });
  mark(container, current);
}
function mark(container, value) {
  [...container.children].forEach((b) => {
    const on = b.dataset.value === String(value);
    b.setAttribute("aria-checked", on); b.tabIndex = on ? 0 : -1;
  });
}
// Arrow keys move within each radio group.
document.addEventListener("keydown", (e) => {
  const g = e.target.closest?.('[role="radiogroup"]');
  if (!g || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
  const items = [...g.querySelectorAll('[role="radio"]')];
  const i = items.indexOf(e.target.closest('[role="radio"]'));
  const next = items[(i + (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1) + items.length) % items.length];
  e.preventDefault(); next.focus(); next.click();
});

radio($("wrists"), WRISTS.map((w) => ({ value: w, html: `${w} ซม.` })), state.wrist, (w) => setCount({ wrist: w }));
radio($("stones"), Object.entries(STONES).map(([id, s]) => ({
  value: id, html: `<i style="--img:${img(id)}"></i><b>${s.name}</b><span class="tag">${s.type}</span>`,
})), state.main, (id) => {
  snapshot();
  state.main = id;
  // A painted bead that now matches the main stone is just the main stone.
  state.beads = state.beads.map((b) => (b === id ? null : b));
  mark($("stones"), id); render();
});
function sizeButtons() {
  if ($("bsizes").children.length) {
    [...$("bsizes").children].forEach((b) => {
      b.querySelector("small").textContent = `${Math.floor(((state.wrist + 1) * 10) / b.dataset.value)} เม็ด`;
      b.querySelector("i").style.setProperty("--img", img(state.main));
    });
    return;
  }
  radio($("bsizes"), Object.keys(SIZES).map((mm) => {
    const d = { 6: 16, 8: 20, 10: 24 }[mm];
    const n = Math.floor(((state.wrist + 1) * 10) / mm);
    return { value: mm, html: `<i style="--img:${img(state.main)};width:${d}px;height:${d}px"></i><span>${mm} มม.<small>${n} เม็ด</small></span>` };
  }), state.size, (mm) => setCount({ size: Number(mm) }));
}
const WAVE = (c, w = 1.6) => `<svg width="40" height="20" viewBox="0 0 40 20" aria-hidden="true"><path d="M2 12c6-8 12-8 18 0s12 8 18 0" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/></svg>`;
radio($("threads"), Object.entries(THREADS).map(([id, t]) => ({
  value: id, html: `${WAVE(t.stroke, id === "red" ? 2.2 : 1.6)}<span>${t.name}<small>${t.note}</small></span><em>${t.extra ? `+${t.extra} บาท` : "รวมแล้ว"}</em>`,
})), state.thread, (id) => { state.thread = id; mark($("threads"), id); render(); });
radio($("picks"), Object.entries(STONES).map(([id, s]) => ({
  value: id, label: s.name, html: `<i style="--img:${img(id)}"></i>`,
})), state.held, (id) => { state.held = id; mark($("picks"), id); render(); });
$("picks").querySelectorAll("button").forEach((b) => b.classList.add("pick"));

/* ---------- Count changes keep the pattern's angles ---------- */
function setCount(patch) {
  const before = count(), old = state.beads;
  Object.assign(state, patch);
  const n = count();
  const painted = old.some(Boolean);
  if (n !== before) {
    const next = Array(n).fill(null);
    old.forEach((b, i) => { if (b) next[Math.round((i * n) / before) % n] = b; });
    state.beads = next;
    history.length = 0;
  }
  const adj = $("adjust");
  adj.hidden = !(n !== before && painted);
  if (!adj.hidden) adj.textContent = `วงนี้มี ${n} เม็ดแล้ว เราจัดลายเดิมให้อยู่ตำแหน่งเดิมรอบวง เม็ดที่เพิ่มมาเป็นหินหลัก`;
  mark($("wrists"), state.wrist); mark($("bsizes"), state.size);
  render();
}

/* ---------- Ring ---------- */
function geometry() {
  const w = stage.clientWidth, h = stage.clientHeight;
  const small = narrow.matches;
  let R = small ? 125 : 167, A = small ? 152 : 224;
  const fit = Math.min(1, (Math.min(w, h) / 2 - (small ? 8 : 26)) / A);
  return { cx: w / 2, cy: h / 2, R: R * fit, A: A * fit, w, h, small };
}
const polar = (cx, cy, r, t) => [cx + r * Math.sin(t), cy - r * Math.cos(t)];

// Wrist view: the same beads on a tilted ellipse around a photographed side-on wrist. The hand
// stays put; the bead scale follows the chosen wrist size, so 6 / 8 / 10 mm and a bigger wrist read true.
// Landmarks are in the photo's own pixels (assets/w-hand.jpg, 1248 × 832).
const HAND = { w: 1248, x: 552, top: 229, bot: 392, tip: 1185, tilt: (-12 * Math.PI) / 180 };
const photo = (id) => `url(assets/wb-${id}.jpg)`;
function wristGeometry() {
  const w = stage.clientWidth, small = narrow.matches;
  // The phone stage is a fixed 330px tall, so wider phones must not grow the hand into the controls.
  const s = small ? Math.min(0.46 * (w / 390), 0.46) : 0.75 * (w / 760);
  // Phones keep the fingertips just inside the right edge; desktop leaves room left of the forearm.
  const imgX = small ? w - 2 - HAND.tip * s : -140 * (w / 760), imgY = small ? -10 : -50;
  const top = HAND.top * s + imgY, bot = HAND.bot * s + imgY, T = bot - top;
  const cm = T / (5.1 * (state.wrist / 16));
  const d = (state.size / 10) * cm;
  const b = ((state.wrist + 1) / (2 * Math.PI)) * cm;
  // The loop rests on top of the wrist and hangs a little below it, as a loose bracelet does.
  return { S: HAND.w * s, imgX, imgY, top, bot, d, a: 0.3 * b, b, cx: HAND.x * s + imgX, cy: top - d / 2 + 2 + b };
}

function drawRing(changedIdx) {
  const g = geometry(), n = state.beads.length;
  const d = Math.min(((2 * Math.PI * g.R) / n) * 1.06, g.small ? 46 : 70);
  stage.style.setProperty("--bead", `${d.toFixed(1)}px`);
  stage.style.setProperty("--held", img(state.held));
  stage.style.setProperty("--held-photo", photo(state.held));

  threadEl.setAttribute("class", `thread ${state.thread === "black" ? "dark" : state.thread === "red" ? "red" : ""}`);
  threadEl.innerHTML = `<circle cx="${g.cx}" cy="${g.cy}" r="${g.R}"/>`;

  const wrist = state.view === "wrist", wg = wrist ? wristGeometry() : null;
  stage.classList.toggle("wrist", wrist);
  if (wrist) {
    armEl.style.backgroundSize = `${wg.S.toFixed(1)}px auto`;
    armEl.style.backgroundPosition = `${wg.imgX}px ${wg.imgY}px`;
  }

  const els = [...beadsEl.children];
  for (let i = 0; i < Math.max(n, els.length); i++) {
    let b = els[i];
    if (i >= n) { b.classList.add("leaving"); setTimeout(() => b.remove(), 300); continue; }
    if (!b) {
      b = document.createElement("button");
      b.type = "button"; b.className = "bead"; b.dataset.i = i;
      // New beads grow out of the centre so a bigger wrist reads as the ring loosening.
      b.style.transform = `translate(${g.cx}px, ${g.cy}px) scale(.4)`;
      beadsEl.append(b);
    }
    b.classList.remove("leaving");
    let x, y, hid = false;
    if (wrist) {
      const t = (i / n) * 2 * Math.PI + state.rot, c = Math.cos(t);
      const u = wg.a * c, v = wg.b * Math.sin(t);
      x = wg.cx + u * Math.cos(HAND.tilt) - v * Math.sin(HAND.tilt);
      y = wg.cy + u * Math.sin(HAND.tilt) + v * Math.cos(HAND.tilt);
      // The far half sits behind the arm; only beads clearing its silhouette show.
      hid = c < 0 && y > wg.top + 3 && y < wg.bot - 3;
      b.style.setProperty("--bead", `${(wg.d * (1 + 0.07 * c)).toFixed(1)}px`);
      b.style.zIndex = Math.round((c + 1) * 50);
      b.classList.toggle("far", c < 0);
    } else {
      [x, y] = polar(g.cx, g.cy, g.R, (i / n) * 2 * Math.PI);
      b.style.removeProperty("--bead"); b.style.zIndex = "";
      b.classList.remove("far");
    }
    b.classList.toggle("hid", hid);
    b.tabIndex = hid ? -1 : 0;
    const s = stoneAt(i);
    b.style.setProperty("--img", img(s));
    b.style.setProperty("--photo", photo(s));
    b.classList.toggle("same", s === state.held);
    b.setAttribute("aria-label", `เม็ดที่ ${i + 1} ${STONES[s].name}${state.beads[i] ? "" : " (หินหลัก)"}`);
    requestAnimationFrame(() => { b.style.transform = `translate(${x}px, ${y}px)`; });
    if (changedIdx === i && !reduce) { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
  }
  drawArcs(g, n);
}

function tally() {
  const by = {};
  for (let i = 0; i < state.beads.length; i++) by[stoneAt(i)] = (by[stoneAt(i)] || 0) + 1;
  const intents = {};
  Object.entries(by).forEach(([id, c]) => { const k = STONES[id].intent; intents[k] = (intents[k] || 0) + c; });
  return { by, intents: Object.entries(intents).sort((a, b) => b[1] - a[1]) };
}

function drawArcs(g, n) {
  const { intents } = tally();
  const gap = intents.length > 1 ? 0.06 : 0;
  let t = 0, paths = "", labels = "", legend = "";
  intents.forEach(([k, c]) => {
    const span = (c / n) * 2 * Math.PI;
    const a0 = t + gap / 2, a1 = t + span - gap / 2;
    if (intents.length === 1) {
      paths += `<circle cx="${g.cx}" cy="${g.cy}" r="${g.A}" fill="none" stroke="${INTENTS[k].c}" stroke-width="3"/>`;
    } else {
      const [x0, y0] = polar(g.cx, g.cy, g.A, a0), [x1, y1] = polar(g.cx, g.cy, g.A, a1);
      paths += `<path d="M${x0} ${y0}A${g.A} ${g.A} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}" stroke="${INTENTS[k].c}"/>`;
    }
    const mid = intents.length === 1 ? Math.PI * 0.32 : t + span / 2;
    const [lx, ly] = polar(g.cx, g.cy, g.A + 26, mid);
    const left = lx < g.cx;
    labels += `<span class="${left ? "l" : ""}" style="--c:${INTENTS[k].c};left:${left ? lx - 150 : lx}px;top:${ly}px"><b><i></i>${INTENTS[k].name}</b>${c} จาก ${n} เม็ด</span>`;
    legend += `<li style="--c:${INTENTS[k].c}"><i></i><b>${INTENTS[k].name}</b> ${c} เม็ด</li>`;
    t += span;
  });
  arcsEl.innerHTML = paths;
  labelsEl.innerHTML = labels;
  $("legend").innerHTML = legend;

  const names = intents.map(([k]) => INTENTS[k].name);
  let sum;
  if (names.length === 1) sum = `เส้นนี้เน้นเรื่อง${names[0]}ทั้งวง`;
  else if (intents[0][1] === intents[1][1] && names.length === 2) sum = `เส้นนี้แบ่งเรื่อง${names[0]}กับ${names[1]}เท่า ๆ กัน`;
  else sum = `เส้นนี้เน้นเรื่อง${names[0]} มี${names.slice(1).join("และ")}เป็นส่วนเสริม`;
  $("m-sum").textContent = sum;
}

/* ---------- Painting: tap to set, tap again to revert, drag to paint several ---------- */
function snapshot() { history.push(state.beads.slice()); if (history.length > 50) history.shift(); }
let gesture = null;
function apply(i) {
  if (gesture.done.has(i)) return;
  gesture.done.add(i);
  const want = gesture.mode === "revert" ? null : state.held === state.main ? null : state.held;
  if (state.beads[i] === want) return;
  if (!gesture.saved) { snapshot(); gesture.saved = true; }
  state.beads[i] = want;
  render(i);
}
beadsEl.addEventListener("pointerdown", (e) => {
  const b = e.target.closest(".bead"); if (!b) return;
  e.preventDefault();
  const i = Number(b.dataset.i);
  gesture = { mode: stoneAt(i) === state.held && state.beads[i] ? "revert" : "set", done: new Set(), saved: false, id: e.pointerId };
  beadsEl.setPointerCapture(e.pointerId);
  apply(i);
});
beadsEl.addEventListener("pointermove", (e) => {
  if (!gesture || e.pointerId !== gesture.id) return;
  const b = document.elementFromPoint(e.clientX, e.clientY)?.closest(".bead");
  if (b) apply(Number(b.dataset.i));
});
const end = () => { gesture = null; };
beadsEl.addEventListener("pointerup", end);
beadsEl.addEventListener("pointercancel", end);
// Keyboard: Enter / Space on a focused bead behaves like a tap.
beadsEl.addEventListener("click", (e) => {
  if (e.detail !== 0) return;
  const b = e.target.closest(".bead"); if (!b) return;
  const i = Number(b.dataset.i);
  gesture = { mode: stoneAt(i) === state.held && state.beads[i] ? "revert" : "set", done: new Set(), saved: false };
  apply(i); gesture = null;
  beadsEl.children[i]?.focus();
});

/* ---------- View: on the ring or on a wrist ---------- */
$("views").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
  state.view = b.dataset.view;
  $("views").querySelectorAll("button").forEach((x) => { x.setAttribute("aria-checked", x === b); x.tabIndex = x === b ? 0 : -1; });
  render();
}));
const turn = (dir) => { state.rot += dir * ((2 * Math.PI) / state.beads.length) * 3; drawRing(); };
$("rot-l").addEventListener("click", () => turn(-1));
$("rot-r").addEventListener("click", () => turn(1));

$("undo").addEventListener("click", () => { if (!history.length) return; state.beads = history.pop(); render(); });
const clear = () => { if (!state.beads.some(Boolean)) return; snapshot(); state.beads = state.beads.map(() => null); $("adjust").hidden = true; render(); };
$("clear").addEventListener("click", clear);
$("clear-m").addEventListener("click", clear);

/* ---------- Render ---------- */
function render(changedIdx) {
  const n = state.beads.length;
  drawRing(changedIdx);
  $("r-count").textContent = `${n} เม็ด`;
  $("r-length").textContent = `ยาว ${state.wrist + 1} ซม. สำหรับข้อมือ ${state.wrist} ซม.`;
  $("w-count").textContent = $("r-count").textContent;
  $("w-length").textContent = $("r-length").textContent;
  $("size-aside").textContent = `จำนวนเม็ดคิดจากข้อมือ ${state.wrist} ซม.`;
  $("hint").innerHTML = `ถือ<b>${STONES[state.held].name}</b>อยู่ ${state.view === "wrist" ? (narrow.matches ? "แตะเม็ดบนข้อมือเพื่อใส่ได้" : "แตะเม็ดบนข้อมือเพื่อใส่ได้เหมือนบนวง") : narrow.matches ? "แตะหรือลากนิ้วบนวงเพื่อใส่" : "แตะเม็ดบนวงเพื่อใส่ แตะซ้ำเพื่อคืนเป็นหินหลัก"}`;
  $("undo").disabled = !history.length;
  $("clear").disabled = $("clear-m").disabled = !state.beads.some(Boolean);
  sizeButtons();

  const { by } = tally();
  const order = Object.keys(by).sort((a, b) => (a === state.main ? -1 : b === state.main ? 1 : by[b] - by[a]));
  $("m-list").innerHTML = order.map((id) => `<li><span class="im" style="--img:${img(id)}"></span><div><b>${STONES[id].name} <small>หิน${STONES[id].type} ${by[id]} เม็ด</small></b><p>${STONES[id].belief}</p></div></li>`).join("");

  const t = THREADS[state.thread];
  let total = LABOUR + t.extra;
  const lines = order.map((id) => {
    const p = Math.round(STONES[id].price * SIZES[state.size]) * by[id];
    total += p;
    return [`${STONES[id].name} ${state.size} มม. × ${by[id]} เม็ด`, p];
  });
  lines.push([`ค่าร้อยมือและ${t.name.replace(" ปรับขนาดได้", "")}`, LABOUR + t.extra]);
  $("lines").innerHTML = lines.map(([l, p]) => `<li><span>${l}</span><span>${baht(p)}</span></li>`).join("");
  $("total").textContent = baht(total);
  $("bb-total").textContent = baht(total);
  $("bb-meta").textContent = `${n} เม็ด สำหรับข้อมือ ${state.wrist} ซม.`;
  state.total = total; state.lines = lines;
  $("preview").hidden = true;
}

/* ---------- Send (prototype: shows the message instead of opening LINE) ---------- */
document.querySelectorAll("[data-send]").forEach((b) => b.addEventListener("click", () => {
  const n = state.beads.length;
  const pattern = state.beads.map((_, i) => STONES[stoneAt(i)].name).join(", ");
  const text = [
    "สวัสดีค่ะ อยากสั่งกำไลแบบนี้",
    `ข้อมือ ${state.wrist} ซม. (กำไลยาว ${state.wrist + 1} ซม.) เม็ด ${state.size} มม. จำนวน ${n} เม็ด`,
    `หินหลัก: ${STONES[state.main].name}`,
    `เส้นด้าย: ${THREADS[state.thread].name}`,
    ...state.lines.map(([l, p]) => `- ${l} ${baht(p)}`),
    `รวม ${baht(state.total)}`,
    `ลายรอบวง: ${pattern}`,
  ].join("\n");
  $("preview-text").textContent = text;
  $("preview").hidden = false;
  if (narrow.matches) $("summary").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
}));

/* ---------- Wrist guide ---------- */
const STEPS = {
  string: [
    { t: "1 พันรอบข้อมือ", tm: "1 พันข้อมือ", d: "ใต้ปุ่มกระดูก แนบแต่ไม่รัด", dm: "ใต้ปุ่มกระดูก ไม่รัด", art: "w-wrap", size: "auto 150%", pos: "34% 50%" },
    { t: "2 ทำเครื่องหมาย", tm: "2 ทำรอย", d: "ตรงที่ปลายมาชนกัน", dm: "ตรงที่ปลายชนกัน", art: "w-mark", size: "auto 125%", pos: "50% 50%" },
    { t: "3 วัดกับไม้บรรทัด", tm: "3 วัดความยาว", d: "จากปลายเชือกถึงรอย", dm: "ปลายเชือกถึงรอย", art: "w-ruler", size: "auto 200%", pos: "70% 50%" },
  ],
  tape: [
    { t: "1 พันรอบข้อมือ", tm: "1 พันข้อมือ", d: "ใต้ปุ่มกระดูก แนบแต่ไม่รัด", dm: "ใต้ปุ่มกระดูก ไม่รัด" },
    { t: "2 อ่านตัวเลข", tm: "2 อ่านเลข", d: "ตรงที่ปลายสายมาชนกัน", dm: "ตรงที่ปลายชนกัน" },
    { t: "3 ใส่ตัวเลขด้านล่าง", tm: "3 ใส่ตัวเลข", d: "ครึ่งเซนติเมตรก็ได้", dm: "ครึ่งเซนก็ได้" },
  ],
  bracelet: [
    { t: "1 วางกำไลราบ", tm: "1 วางกำไล", d: "บนโต๊ะ ไม่ต้องยืดเชือก", dm: "วางราบ ไม่ยืด" },
    { t: "2 วัดรอบวง", tm: "2 วัดรอบวง", d: "ใช้เชือกวัดตามแนวกลางเม็ด", dm: "ตามแนวกลางเม็ด" },
    { t: "3 ใส่ความยาวกำไล", tm: "3 ใส่ความยาว", d: "เราหักออก 1 ซม. ให้เอง", dm: "เราหัก 1 ซม. ให้" },
  ],
};
const guide = $("guide"), mInput = $("m-value");
let method = "string", value = 15.5, pick = 16;

function drawSteps() {
  const s = STEPS[method], m = narrow.matches;
  const ol = $("g-steps");
  ol.classList.toggle("no-art", !s[0].art);
  ol.innerHTML = s.map((x) => `<li>${x.art ? `<span class="art" role="img" aria-label="${x.t}" style="--img:url(assets/${x.art}.jpg);--size:${x.size};--pos:${x.pos}"></span>` : ""}<b>${(m ? x.tm : x.t).replace(/^(\d) /, "<em>$1</em> ")}</b><p>${m ? x.dm : x.d}</p></li>`).join("");
  $("m-label").textContent = method === "bracelet" ? "กำไลยาวกี่เซนติเมตร" : "วัดได้กี่เซนติเมตร";
}
function result() {
  const wrist = method === "bracelet" ? value - 1 : value;
  pick = Math.ceil(wrist);
  const fmt = (v) => (Number.isInteger(v) ? v : v.toFixed(1));
  const box = $("g-result"), btn = $("use-size");
  const out = pick < WRISTS[0] || pick > WRISTS[WRISTS.length - 1];
  box.classList.toggle("out", out);
  btn.disabled = out;
  if (out) {
    $("g-res-title").textContent = `ข้อมือ ${fmt(wrist)} ซม. ยังไม่มีในตัวเลือก`;
    $("g-res-text").textContent = "หน้านี้มีขนาด 14 ถึง 19 ซม. ทักเราใน LINE เราร้อยขนาดนี้ให้ได้";
    btn.textContent = "ใช้ขนาดนี้ไม่ได้";
    return;
  }
  $("g-res-title").textContent = `เลือกขนาดข้อมือ ${pick} ซม.`;
  const from = method === "bracelet" ? `กำไล ${fmt(value)} ซม. หัก 1 ซม. ได้ข้อมือ ${fmt(wrist)} ซม. ` : `ข้อมือ ${fmt(wrist)} ซม. `;
  $("g-res-text").textContent = Number.isInteger(wrist)
    ? `${from}เราร้อยให้ยาว ${pick + 1} ซม. กำไลจะหลวมนิด ๆ ไม่รัด`
    : `${from}อยู่ระหว่างสองขนาด เราปัดขึ้นเป็น ${pick} ซม. แล้วร้อยให้ยาว ${pick + 1} ซม. กำไลจะหลวมนิด ๆ ไม่รัด`;
  btn.textContent = `ใช้ขนาด ${pick} ซม.`;
}
function setValue(v) {
  value = Math.min(25, Math.max(10, Math.round(v * 2) / 2));
  mInput.value = Number.isInteger(value) ? value : value.toFixed(1);
  $("m-minus").disabled = value <= 10; $("m-plus").disabled = value >= 25;
  result();
}
$("m-minus").addEventListener("click", () => setValue(value - 0.5));
$("m-plus").addEventListener("click", () => setValue(value + 0.5));
mInput.addEventListener("change", () => { const v = parseFloat(mInput.value.replace(",", ".")); setValue(Number.isFinite(v) ? v : value); });
mInput.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") { e.preventDefault(); setValue(value + 0.5); }
  if (e.key === "ArrowDown") { e.preventDefault(); setValue(value - 0.5); }
});
$("methods").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
  method = b.dataset.method;
  $("methods").querySelectorAll("button").forEach((x) => x.setAttribute("aria-checked", x === b));
  drawSteps(); result();
}));

$("open-guide").addEventListener("click", () => { drawSteps(); setValue(value); guide.showModal(); });
$("close-guide").addEventListener("click", () => guide.close());
guide.addEventListener("click", (e) => { if (e.target === guide) guide.close(); });
$("use-size").addEventListener("click", () => { setCount({ wrist: pick }); guide.close(); });

/* ---------- Boot ---------- */
render();
let rt;
addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => render(), 120); });
// order.html#wrist opens the guide straight away (linked from elsewhere on the site).
if (location.hash === "#wrist") $("open-guide").click();
// order.html#on-wrist opens straight into the wrist view.
if (location.hash === "#on-wrist") document.querySelector('[data-view="wrist"]').click();
