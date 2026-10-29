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
