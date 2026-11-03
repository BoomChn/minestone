// Journal pages: article contents rail, compare tabs, share; index search and category filter.

// Article: highlight the contents entry for the section being read.
const toc = document.getElementById("toc");
if (toc) {
  const links = [...toc.querySelectorAll("a")];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href")));
  const mark = () => {
    const line = window.innerHeight * 0.3;
    let i = 0;
    sections.forEach((s, n) => { if (s && s.getBoundingClientRect().top <= line) i = n; });
    links.forEach((a, n) => a.classList.toggle("on", n === i));
  };
  addEventListener("scroll", mark, { passive: true });
  mark();
}

// Mobile contents: close after picking a section.
document.querySelectorAll(".toc-m a").forEach((a) =>
  a.addEventListener("click", () => a.closest("details").removeAttribute("open")));

// Phone: the compare table shows one stone type at a time.
const compare = document.getElementById("compare");
document.querySelectorAll(".compare-tabs button").forEach((b, _, all) =>
  b.addEventListener("click", () => {
    all.forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    compare.dataset.col = b.dataset.col;
  }));

const share = document.getElementById("share");
if (share) {
  share.addEventListener("click", async () => {
    const data = { title: document.title, url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(location.href); share.lastChild.textContent = "คัดลอกลิงก์แล้ว"; }
    } catch (_) { /* the reader closed the share sheet */ }
  });
}

// Index: filter by category chip and by search text.
const list = document.getElementById("list");
if (list) {
  const q = document.getElementById("q");
  const empty = document.getElementById("empty");
  const chips = [...document.querySelectorAll("#cats button")];
  const items = [document.querySelector(".featured"), ...list.querySelectorAll(".card-a")];
  let cat = new URLSearchParams(location.search).get("c") || "all";
  const apply = () => {
    const term = q.value.trim().toLowerCase();
    let shown = 0;
    items.forEach((el) => {
      const text = (el.textContent + " " + (el.dataset.k || "")).toLowerCase();
      const ok = (cat === "all" || el.dataset.c === cat) && (!term || text.includes(term));
      el.hidden = !ok;
      if (ok && el !== items[0]) shown++;
    });
    empty.hidden = shown > 0 || !items[0].hidden;
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.c === cat)));
  };
  chips.forEach((c) => c.addEventListener("click", () => { cat = c.dataset.c; apply(); }));
  q.addEventListener("input", apply);
  apply();
}
