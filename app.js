// Birthday readout: weekday, Thai day colour, life-path number, and belief-based stones.
// Stone lists are prototype placeholders until the shop confirms its own canon.
const DAYS = [
  { name: "อาทิตย์", color: "แดง", hex: "#D9534F", stones: "ทับทิม · การ์เน็ต · ซันสโตน" },
  { name: "จันทร์", color: "เหลือง", hex: "#E9C46A", stones: "มูนสโตน · ซิทริน · ไข่มุก" },
  { name: "อังคาร", color: "ชมพู", hex: "#E8A1B8", stones: "การ์เน็ต · โรสควอตซ์ · มูนสโตน" },
  { name: "พุธ", color: "เขียว", hex: "#7FA283", stones: "หยก · มรกต · อะเวนจูรีน" },
  { name: "พฤหัสบดี", color: "ส้ม", hex: "#E39B5B", stones: "ซิทริน · ไทเกอร์อาย · คาร์เนเลียน" },
  { name: "ศุกร์", color: "ฟ้า", hex: "#8DB8D8", stones: "อะความารีน · ลาพิส ลาซูลี · บลูเลซ" },
  { name: "เสาร์", color: "ม่วง", hex: "#A98BC4", stones: "อเมทิสต์ · ออนิกซ์ · การ์เน็ต" },
];
const MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

const $ = (id) => document.getElementById(id);

function lifeNumber(iso) {
  let n = iso.replace(/\D/g, "").split("").reduce((a, d) => a + Number(d), 0);
  while (n > 9 && n !== 11 && n !== 22) n = String(n).split("").reduce((a, d) => a + Number(d), 0);
  return n;
}

// Swap text with a short dip-and-settle. `order` staggers a group 50ms apart so the eye can follow.
function swapText(el, text, order = 0, animate = true) {
  if (el.textContent === text) return;
  if (!animate) {
    el.textContent = text;
    return;
  }
  el.classList.add("is-swapping");
  el.textContent = text;
  void el.offsetWidth;
  el.style.transitionDelay = `${order * 50}ms`;
  el.classList.remove("is-swapping");
}

function renderBirthday(animate = true) {
  const iso = $("dob").value;
  if (!iso) return;
  const [y, m, d] = iso.split("-").map(Number);
  const day = DAYS[new Date(y, m - 1, d).getDay()];
  $("dob-text").textContent = `${d} ${MONTHS[m - 1]} ${y + 543}`;
  $("out-swatch").style.backgroundColor = day.hex;
  swapText($("out-day"), day.name, 0, animate);
  swapText($("out-color"), day.color, 1, animate);
  swapText($("out-num"), String(lifeNumber(iso)), 2, animate);
  swapText($("out-stones"), day.stones, 3, animate);
  swapText($("out-note"), `หินของคนเกิดวัน${day.name} ตามความเชื่อ`, 4, animate);
}

$("dob").addEventListener("change", () => renderBirthday());
$("dob").addEventListener("click", (e) => e.target.showPicker?.());
renderBirthday(false);

// Intent chips: multi-select. Each chip lifts its own stone in the row; the rest step back.
const SUPPORT = {
  love: "โรสควอตซ์",
  work: "ไทเกอร์อาย",
  money: "หยก",
  protect: "ออนิกซ์",
  calm: "อเมทิสต์",
};
const chips = [...document.querySelectorAll(".chip")];
const rowArt = $("row-art");
const rowStones = [...rowArt.querySelectorAll("img[data-key]")];

chips.forEach((chip) =>
  chip.addEventListener("click", () => {
    chip.setAttribute("aria-pressed", chip.getAttribute("aria-pressed") !== "true");
    const picked = chips.filter((c) => c.getAttribute("aria-pressed") === "true").map((c) => c.dataset.key);
    rowArt.classList.toggle("has-pick", picked.length > 0);
    rowStones.forEach((img) => img.classList.toggle("on", picked.includes(img.dataset.key)));
    swapText(
      $("pick-note"),
      picked.length ? `เม็ดเสริมตามความเชื่อ: ${picked.map((k) => SUPPORT[k]).join(" · ")}` : "เลือกได้มากกว่าหนึ่งเรื่อง"
    );
  })
);

// Reveal on scroll, staggered 50ms within each section rather than across the whole page.
const io = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }),
  { rootMargin: "0px 0px -8% 0px" }
);
const groupCount = new Map();
document.querySelectorAll(".reveal").forEach((el) => {
  if (el.getBoundingClientRect().top < innerHeight) {
    el.classList.add("in");
    return;
  }
  const group = el.closest("section, footer") || document.body;
  const i = groupCount.get(group) || 0;
  groupCount.set(group, i + 1);
  el.style.transitionDelay = `${Math.min(i, 4) * 50}ms`;
  io.observe(el);
});
document.documentElement.classList.add("js");

// Hero glint follows the cursor. It trails slightly behind (exponential smoothing), so it reads
// as light sliding over the crystals rather than a sticker glued to the pointer.
const glintBand = document.querySelector(".glint i");
const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const GLINT_LAG = 90; // ms time constant of the trail
if (glintBand && canHover && !reduceMotion) {
  const stage = $("hero-stage");
  const glint = glintBand.parentElement;
  const g = { x: 0, y: 50, tx: 0, ty: 50, raf: 0, prev: null };
  const place = () => {
    glintBand.style.transform = `translateX(${g.x - glintBand.offsetWidth / 2}px)`;
    glintBand.style.setProperty("--gy", `${g.y}%`);
  };
  const aim = (e) => {
    const r = stage.getBoundingClientRect();
    g.tx = e.clientX - r.left;
    g.ty = ((e.clientY - r.top) / r.height) * 100;
  };
  const step = (now) => {
    const dt = g.prev === null ? 16 : Math.min(50, now - g.prev);
    g.prev = now;
    const k = 1 - Math.exp(-dt / GLINT_LAG);
    g.x += (g.tx - g.x) * k;
    g.y += (g.ty - g.y) * k;
    place();
    const resting = Math.abs(g.tx - g.x) < 0.3 && Math.abs(g.ty - g.y) < 0.1;
    g.raf = resting ? 0 : requestAnimationFrame(step);
  };
  stage.addEventListener("pointerenter", (e) => {
    aim(e);
    g.x = g.tx; // appear under the cursor, don't sweep in from where it last left
    g.y = g.ty;
    place();
    glint.classList.add("on");
  });
  stage.addEventListener("pointermove", (e) => {
    aim(e);
    if (!g.raf) {
      g.prev = null;
      g.raf = requestAnimationFrame(step);
    }
  });
  stage.addEventListener("pointerleave", () => glint.classList.remove("on"));
}

// Draggable stones. The stone follows the pointer 1:1, tilts with horizontal speed,
// and a flick carries it on with friction. Past the section edge it rubber-bands back
// instead of hitting a wall. Drag writes `translate`/`rotate`, so bob and pop keep working.
const FRICTION = 0.94; // velocity kept per 16ms frame
const EDGE_GIVE = 0.35; // how far a held stone follows the pointer past the edge
const EDGE_SETTLE = 110; // ms-ish time constant for easing back inside an edge
const MAX_SPEED = 3; // px/ms, so a wild flick can't fling it off the page

function makeDraggable(el) {
  const s = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, pid: null, grabX: 0, grabY: 0, samples: [], raf: 0 };

  const bounds = () => {
    const area = el.offsetParent;
    const w = el.offsetWidth, h = el.offsetHeight;
    return {
      minX: -el.offsetLeft - w * 0.25,
      maxX: area.clientWidth - el.offsetLeft - w * 0.75,
      minY: -el.offsetTop, // no overhang at the top: the sticky nav would hide it
      maxY: area.clientHeight - el.offsetTop - h * 0.75,
    };
  };
  // Beyond an edge the stone only follows part of the way: friction, not a hard stop.
  const give = (v, min, max) => (v < min ? min + (v - min) * EDGE_GIVE : v > max ? max + (v - max) * EDGE_GIVE : v);
  const render = () => {
    el.style.translate = `${s.x}px ${s.y}px`;
    el.style.rotate = `${s.rot}deg`;
  };

  el.addEventListener("pointerdown", (e) => {
    if (s.pid !== null) return; // ignore a second finger mid-drag
    e.preventDefault();
    cancelAnimationFrame(s.raf);
    s.pid = e.pointerId;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {} // pointer already gone (e.g. synthetic events)
    s.grabX = e.clientX - s.x;
    s.grabY = e.clientY - s.y;
    s.samples = [{ t: e.timeStamp, x: e.clientX, y: e.clientY }];
    el.classList.add("held");
  });

  el.addEventListener("pointermove", (e) => {
    if (e.pointerId !== s.pid) return;
    const b = bounds();
    s.x = give(e.clientX - s.grabX, b.minX, b.maxX);
    s.y = give(e.clientY - s.grabY, b.minY, b.maxY);
    s.samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
    while (s.samples.length > 2 && e.timeStamp - s.samples[0].t > 80) s.samples.shift();
    const first = s.samples[0];
    const dt = Math.max(1, e.timeStamp - first.t);
    s.rot = Math.max(-14, Math.min(14, ((e.clientX - first.x) / dt) * 10));
    render();
  });

  const release = (e) => {
    if (e.pointerId !== s.pid) return;
    s.pid = null;
    el.classList.remove("held");
    const first = s.samples[0];
    const last = s.samples[s.samples.length - 1];
    const dt = Math.max(1, last.t - first.t);
    const fresh = e.timeStamp - last.t < 60; // pointer paused before letting go → no throw
    const clamp = (v) => Math.max(-MAX_SPEED, Math.min(MAX_SPEED, v));
    s.vx = fresh && !reduceMotion ? clamp((last.x - first.x) / dt) : 0;
    s.vy = fresh && !reduceMotion ? clamp((last.y - first.y) / dt) : 0;
    let prev = null;
    const step = (now) => {
      const dt = prev === null ? 16 : Math.min(32, Math.max(0, now - prev));
      prev = now;
      const b = bounds();
      const keep = Math.pow(FRICTION, dt / 16);
      s.vx *= keep;
      s.vy *= keep;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      // Past an edge: kill the speed and ease back to the edge. Easing position instead of
      // adding spring velocity means the stone can never be launched back the other way.
      const ease = Math.min(1, dt / EDGE_SETTLE);
      const settle = (pos, v, min, max) =>
        pos < min ? [pos + (min - pos) * ease, v * 0.5] : pos > max ? [pos + (max - pos) * ease, v * 0.5] : [pos, v];
      [s.x, s.vx] = settle(s.x, s.vx, b.minX, b.maxX);
      [s.y, s.vy] = settle(s.y, s.vy, b.minY, b.maxY);
      s.rot += (Math.max(-14, Math.min(14, s.vx * 10)) - s.rot) * Math.min(1, dt / 120);
      render();
      const inside = s.x >= b.minX - 0.5 && s.x <= b.maxX + 0.5 && s.y >= b.minY - 0.5 && s.y <= b.maxY + 0.5;
      const moving = Math.abs(s.vx) + Math.abs(s.vy) > 0.005 || Math.abs(s.rot) > 0.1;
      if (moving || !inside) s.raf = requestAnimationFrame(step);
    };
    s.raf = requestAnimationFrame(step);
  };
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);
  el.addEventListener("dragstart", (e) => e.preventDefault());
}
document.querySelectorAll(".float").forEach(makeDraggable);

// Floating stones only bob while on screen; no reason to spend frames on what nobody sees.
const floatIo = new IntersectionObserver((entries) =>
  entries.forEach((e) => e.target.classList.toggle("paused", !e.isIntersecting))
);
document.querySelectorAll(".float").forEach((el) => floatIo.observe(el));
