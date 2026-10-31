// Product page: scroll reveal, chapter highlight in the sticky bar, size picker, hero plate settle.
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Reveal on scroll, staggered 50ms within each section.
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
  if (el.getBoundingClientRect().top < innerHeight) return el.classList.add("in");
  const group = el.closest("section, footer") || document.body;
  const i = groupCount.get(group) || 0;
  groupCount.set(group, i + 1);
  el.style.transitionDelay = `${Math.min(i, 4) * 50}ms`;
  io.observe(el);
});

// Highlight the chapter currently crossing the upper third of the viewport.
const links = [...document.querySelectorAll(".pbar-links a")];
const chapters = links.map((a) => document.querySelector(a.getAttribute("href")));
const chapterIo = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = chapters.indexOf(e.target);
      links.forEach((a, j) => a.classList.toggle("on", i === j));
    }),
  { rootMargin: "-30% 0px -65% 0px" }
);
chapters.forEach((c) => c && chapterIo.observe(c));

// The close chapter carries its own black button, so the bar steps aside there.
const pbar = document.getElementById("pbar");
new IntersectionObserver(([e]) => pbar.classList.toggle("away", e.isIntersecting), { threshold: 0.35 })
  .observe(document.getElementById("line"));

// Size picker: one pressed at a time, mirrored into the closing line.
const sizes = document.getElementById("sizes");
const out = document.getElementById("size-out");
sizes.addEventListener("click", (ev) => {
  const b = ev.target.closest("button");
  if (!b) return;
  sizes.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  out.textContent = b.textContent;
});

// Hero plate settles from 1.06 to 1 as it scrolls up into view, like a product being set down.
const plate = document.getElementById("hero-plate");
if (!reduce && plate) {
  let ticking = false;
  const settle = () => {
    const r = plate.getBoundingClientRect();
    const p = Math.min(Math.max((innerHeight - r.top) / (innerHeight * 0.9), 0), 1);
    plate.style.transform = `scale(${1.06 - 0.06 * p})`;
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(settle); } }, { passive: true });
  settle();
}

// Stone aura. With a mouse it blooms while the pointer is over the stone and leans a little
// toward it on a spring, so the colour seems to answer the hand. On touch it blooms once, when
// the stone scrolls into view, and stays.
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
document.querySelectorAll(".stone").forEach((stone) => {
  const plate = stone.querySelector(".plate");
  const drift = stone.querySelector(".aura-drift");
  if (!plate || !drift) return;

  if (!finePointer) {
    const seen = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      seen.disconnect();
      setTimeout(() => stone.classList.add("aura-on"), 300);
    }, { threshold: 0.6 });
    seen.observe(plate);
    return;
  }

  plate.addEventListener("pointerenter", () => stone.classList.add("aura-on"));
  plate.addEventListener("pointerleave", () => stone.classList.remove("aura-on"));
  if (reduce) return;

  // Lean up to 4% of the plate toward the pointer. A soft spring, so it trails rather than sticks.
  const LEAN = 0.04, K = 90, DAMP = 14;
  let target = [0, 0], pos = [0, 0], vel = [0, 0], last = 0, raf = 0;
  const step = (now) => {
    const dt = Math.min((now - last) / 1000, 0.032);
    last = now;
    for (let i = 0; i < 2; i++) {
      vel[i] += (K * (target[i] - pos[i]) - DAMP * vel[i]) * dt;
      pos[i] += vel[i] * dt;
    }
    drift.style.transform = `translate(${pos[0].toFixed(2)}%, ${pos[1].toFixed(2)}%)`;
    const moving = Math.abs(target[0] - pos[0]) + Math.abs(target[1] - pos[1]) + Math.abs(vel[0]) + Math.abs(vel[1]) > 0.01;
    raf = moving ? requestAnimationFrame(step) : 0;
  };
  const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } };
  plate.addEventListener("pointermove", (e) => {
    const r = plate.getBoundingClientRect();
    target = [((e.clientX - r.left) / r.width - 0.5) * 2 * LEAN * 100, ((e.clientY - r.top) / r.height - 0.5) * 2 * LEAN * 100];
    wake();
  });
  plate.addEventListener("pointerleave", () => { target = [0, 0]; wake(); });
});
