// Shop: intent chips light one stone in the tray and filter the grid to bracelets carrying it.
const STONES = {
  rose:       { x: "18.2%", name: "โรสควอตซ์",      belief: "ตามความเชื่อ โรสควอตซ์เกี่ยวกับความรัก ความอ่อนโยน และการเปิดใจให้ตัวเอง", link: "product.html#stones" },
  citrine:    { x: "35.5%", name: "ซิทริน",         belief: "ตามความเชื่อ ซิทรินเกี่ยวกับความมั่นใจและแรงผลักดันในการทำงาน" },
  aventurine: { x: "50.9%", name: "กรีนอะเวนเจอรีน", belief: "ตามความเชื่อ กรีนอะเวนเจอรีนเกี่ยวกับโชคลาภและเงินที่หมุนเวียนดี" },
  onyx:       { x: "66.8%", name: "ออนิกซ์ดำ",       belief: "ตามความเชื่อ ออนิกซ์ดำเกี่ยวกับการปกป้องและกันสิ่งไม่ดี" },
  amethyst:   { x: "82.7%", name: "อเมทิสต์",        belief: "ตามความเชื่อ อเมทิสต์เกี่ยวกับความสงบ ใจที่นิ่ง และการนอนหลับ" },
};
const INTENT = { love: "rose", work: "citrine", money: "aventurine", protect: "onyx", calm: "amethyst", all: null };

const intents = document.getElementById("intents");
const tray = document.getElementById("tray");
const caps = [...document.querySelectorAll("#captions li")];
const belief = document.getElementById("belief");
const grid = document.getElementById("grid");
const cards = [...grid.querySelectorAll(".card-p")];
const custom = grid.querySelector(".custom-card");
const empty = document.getElementById("empty");
const title = document.getElementById("res-title");
const count = document.getElementById("res-count");
const natural = document.getElementById("natural");
const sort = document.getElementById("sort");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

let stone = "rose";

function render(animate) {
  // Tray + captions
  tray.classList.toggle("all", !stone);
  if (stone) tray.style.setProperty("--lx", STONES[stone].x);
  caps.forEach((li) => li.classList.toggle("on", !stone || li.dataset.stone === stone));

  // Belief line
  if (stone) {
    const s = STONES[stone];
    belief.innerHTML = s.belief + (s.link ? ` <a href="${s.link}">อ่านเรื่องของหินเม็ดนี้</a>` : "");
  } else {
    belief.textContent = "ทุกเม็ดในถาดติดป้ายชนิดตามจริง ความหมายเล่าตามความเชื่อไทยและจีน ไม่รับประกันผล";
  }

  // Filter + sort
  const shown = cards.filter((c) =>
    (!stone || c.dataset.stones.split(" ").includes(stone)) && (!natural.checked || c.dataset.natural === "1"));
  cards.forEach((c) => (c.hidden = !shown.includes(c)));
  const by = sort.value;
  const ordered = [...shown].sort((a, b) =>
    by === "asc" ? a.dataset.price - b.dataset.price :
    by === "desc" ? b.dataset.price - a.dataset.price :
    a.dataset.order - b.dataset.order);
  // The personal card sits fourth (start of row two) when there is room, else last.
  const seq = [...ordered];
  seq.splice(Math.min(3, seq.length), 0, custom);
  seq.forEach((el) => grid.insertBefore(el, empty));

  empty.hidden = shown.length > 0;
  if (!shown.length) {
    document.getElementById("empty-title").textContent = `ยังไม่มีกำไลพร้อมส่งที่มี${STONES[stone].name}`;
    grid.insertBefore(empty, custom);
  }
  title.textContent = stone ? `กำไลที่มี${STONES[stone].name}` : "กำไลพร้อมส่งทั้งหมด";
  count.textContent = `${shown.length} เส้น`;

  if (animate && !reduce) {
    grid.classList.add("swapping");
    requestAnimationFrame(() => requestAnimationFrame(() => grid.classList.remove("swapping")));
  }
}

intents.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  intents.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  stone = INTENT[b.dataset.intent];
  render(true);
});
natural.addEventListener("change", () => render(true));
sort.addEventListener("change", () => render(true));
render(false);
