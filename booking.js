// Booking: pick a day and an hour from a small honest supply, give a birth date,
// and the slip on the right fills in. Sending is a prototype: it shows the LINE message.
// Availability is a placeholder pattern until the reader's real hours are set.

const DAYS = [
  { name: "อาทิตย์", short: "อา.", color: "แดง", hex: "#D9534F" },
  { name: "จันทร์", short: "จ.", color: "เหลือง", hex: "#E9C46A" },
  { name: "อังคาร", short: "อ.", color: "ชมพู", hex: "#E8A1B8" },
  { name: "พุธ", short: "พ.", color: "เขียว", hex: "#7FA283" },
  { name: "พฤหัสบดี", short: "พฤ.", color: "ส้ม", hex: "#E39B5B" },
  { name: "ศุกร์", short: "ศ.", color: "ฟ้า", hex: "#8DB8D8" },
  { name: "เสาร์", short: "ส.", color: "ม่วง", hex: "#A98BC4" },
];
const MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const MONTHS_S = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
// Reading hours by weekday (0 = Sunday): weekday evenings and weekend daytime.
const HOURS = { 0: ["10:00", "13:00"], 2: ["20:00"], 4: ["20:00"], 6: ["10:00", "14:00"] };

const $ = (id) => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrow = matchMedia("(max-width: 960px)");

const state = { day: null, time: null, topics: [] };

/* ---------- Two weeks from this Monday ---------- */
const today = new Date(); today.setHours(0, 0, 0, 0);
const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// A stable "already booked" pattern so the page shows real-looking scarcity.
const taken = (key) => [...key].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7) % 3 === 0;

const days = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(monday); d.setDate(monday.getDate() + i);
  const past = d <= today;
  // Book at least 24 hours ahead: hours closer than that aren't offered at all.
  const at = (t) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), +t.slice(0, 2), +t.slice(3)).getTime();
  const slots = past ? [] : (HOURS[d.getDay()] || []).filter((t) => at(t) - Date.now() >= 864e5).map((t) => ({ t, free: !taken(iso(d) + t) }));
  return { date: d, key: iso(d), past, isToday: +d === +today, slots, free: slots.filter((s) => s.free).length };
});

const head = $("cal-head");
for (let i = 1; i <= 7; i++) {
  const w = DAYS[i % 7];
  head.insertAdjacentHTML("beforeend", `<span><i style="background:${w.hex}"></i>${w.name}</span>`);
}

const grid = $("cal-grid");
days.forEach((d) => {
  const w = DAYS[d.date.getDay()];
  const b = document.createElement("button");
  b.type = "button";
  b.className = "day";
  b.dataset.key = d.key;
  let note = "";
  if (d.isToday) note = "วันนี้";
  else if (d.past) note = "";
  else if (!d.slots.length) note = "ไม่เปิด";
  else if (!d.free) note = "เต็มแล้ว";
  else note = `ว่าง ${d.free}<span class="long"> รอบ</span>`;
  b.innerHTML = `<span class="wd"><i class="dot" style="background:${w.hex}"></i>${w.short}</span><b>${d.date.getDate()}</b><small>${note}</small>`;
  if (d.past && !d.isToday) b.classList.add("past");
  if (d.free) {
    b.classList.add("open");
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", "false");
    b.setAttribute("aria-label", `วัน${w.name}ที่ ${d.date.getDate()} ${MONTHS[d.date.getMonth()]} ว่าง ${d.free} รอบ`);
    b.addEventListener("click", () => pickDay(d.key));
  } else {
    b.disabled = true;
    b.setAttribute("aria-hidden", "true");
  }
  grid.append(b);
});
function pickDay(key) {
  state.day = days.find((d) => d.key === key);
  state.time = null;
  grid.querySelectorAll(".day.open").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.key === key)));
  renderTimes();
  render();
}

function renderTimes() {
  const title = $("times-title"), row = $("time-row");
  row.innerHTML = "";
  if (!state.day) {
    title.textContent = "เลือกวันก่อน แล้วเวลาว่างจะขึ้นตรงนี้";
    title.classList.add("idle");
    return;
  }
  const d = state.day.date, w = DAYS[d.getDay()];
  title.classList.remove("idle");
  title.textContent = `เวลาว่าง ${w.name} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  state.day.slots.forEach((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "time";
    b.textContent = `${s.t} – ${String(+s.t.slice(0, 2) + 1).padStart(2, "0")}:00 น.`;
    if (!s.free) {
      b.disabled = true;
      b.setAttribute("aria-label", `${s.t} มีคนจองแล้ว`);
    } else {
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(state.time === s.t));
      b.addEventListener("click", () => {
        state.time = s.t;
        row.querySelectorAll(".time[role=radio]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
        render();
      });
    }
    row.append(b);
  });
}


/* ---------- Birth date and readout ---------- */
function lifeNumber(isoDate) {
  let n = isoDate.replace(/\D/g, "").split("").reduce((a, d) => a + Number(d), 0);
  while (n > 9 && n !== 11 && n !== 22) n = String(n).split("").reduce((a, d) => a + Number(d), 0);
  return n;
}
function swap(el, text, order) {
  if (el.textContent === text) return;
  if (reduce) { el.textContent = text; return; }
  el.classList.add("dip");
  setTimeout(() => { el.textContent = text; el.classList.remove("dip"); }, 110 + order * 50);
}
// Typed fields: digits only, the separators are inserted for you. Deleting never fights back.
function mask(input, groups, sep) {
  input.addEventListener("input", (e) => {
    if (e.inputType && e.inputType.startsWith("delete")) return;
    const digits = input.value.replace(/\D/g, "").slice(0, groups.reduce((a, g) => a + g, 0));
    let out = "", i = 0;
    groups.forEach((g, k) => {
      const part = digits.slice(i, i + g);
      i += g;
      if (!part) return;
      out += part;
      if (part.length === g && k < groups.length - 1) out += sep;
    });
    input.value = out;
  });
}
mask($("dob"), [2, 2, 4], "/");
mask($("tob"), [2, 2], ":");

function note(id, text, kind) {
  const el = $(id);
  el.textContent = text;
  el.classList.toggle("ok", kind === "ok");
  el.classList.toggle("err", kind === "err");
  $(id.replace("-note", "")).classList.toggle("bad", kind === "err");
}

// Accepts dd/mm/yyyy in พ.ศ. (the label asks for it) and also ค.ศ., told apart by size.
let born = null;
function parseBirth(v) {
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return { error: null };
  let [, d, mo, y] = m.map(Number);
  const be = y > 2300;
  if (be) y -= 543;
  const date = new Date(y, mo - 1, d);
  if (mo < 1 || mo > 12 || date.getDate() !== d || date.getMonth() !== mo - 1) return { error: "วันที่นี้ไม่มีในปฏิทิน ลองเช็กวันกับเดือนอีกครั้ง" };
  if (date > today) return { error: "วันเกิดยังมาไม่ถึง ลองเช็กปีอีกครั้ง" };
  if (y < 1920) return { error: "ปีนี้เก่าไปหน่อย ปีเกิดใส่เป็น พ.ศ. เช่น 2538" };
  const isoDate = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { y, m: mo, d, be, day: DAYS[date.getDay()], life: lifeNumber(isoDate) };
}
function showBirth(b) {
  if (b) {
    $("out-swatch").style.background = b.day.hex;
    swap($("out-day"), b.day.name, 0);
    swap($("out-color"), b.day.color, 1);
    swap($("out-num"), String(b.life), 2);
  } else {
    $("out-swatch").style.background = "";
    ["out-day", "out-color", "out-num"].forEach((id, i) => swap($(id), "–", i));
  }
}
function checkBirth(final) {
  const v = $("dob").value.trim();
  const r = parseBirth(v);
  born = r.day ? r : null;
  if (born) {
    note("dob-note", `${born.d} ${MONTHS[born.m - 1]} ${born.y + 543} วัน${born.day.name}${born.be ? "" : ` (อ่านจาก ค.ศ. ${born.y})`}`, "ok");
    $("dob").classList.remove("need");
  } else if (r.error) note("dob-note", r.error, "err");
  else if (final && v) note("dob-note", "ใส่ให้ครบตามแบบ วว/ดด/ปปปป เช่น 14/03/2538", "err");
  else note("dob-note", "เช่น 14/03/2538");
  showBirth(born);
  render();
}
$("dob").addEventListener("input", () => checkBirth(false));
$("dob").addEventListener("blur", () => checkBirth(true));

function checkTime(final) {
  const v = $("tob").value.trim();
  const m = v.match(/^(\d{2}):(\d{2})$/);
  if (!v) note("tob-note", "แบบ 24 ชั่วโมง เช่น 08:30 หรือ 21:15");
  else if (m && +m[1] < 24 && +m[2] < 60) note("tob-note", `${v} น.`, "ok");
  else if (m) note("tob-note", "ชั่วโมงใส่ได้ 00 ถึง 23 นาทีใส่ได้ 00 ถึง 59", "err");
  else if (final) note("tob-note", "ใส่ให้ครบตามแบบ ชช:นน เช่น 08:30", "err");
}
$("tob").addEventListener("input", () => checkTime(false));
$("tob").addEventListener("blur", () => checkTime(true));
function birthTime() {
  return $("tob-note").classList.contains("ok") ? $("tob").value : "";
}
const birth = () => born;

/* ---------- Topics, story, about you ---------- */
document.querySelectorAll(".topic").forEach((b) => b.addEventListener("click", () => {
  b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
  state.topics = [...document.querySelectorAll(".topic[aria-pressed=true]")].map((x) => x.textContent);
  render();
}));
$("story").addEventListener("input", (e) => { $("count").textContent = `${e.target.value.length} / 500`; });
$("nick").addEventListener("input", () => { $("nick").classList.remove("need"); render(); });
$("source").addEventListener("change", () => $("source").parentElement.classList.remove("need"));
["consent", "consent2"].forEach((id) => $(id).addEventListener("change", () => $(id).closest(".consent").classList.remove("need")));

/* ---------- Slip ---------- */
function setRow(id, text, empty) {
  const el = $(id);
  el.textContent = text || empty;
  el.classList.toggle("empty", !text);
}
function render() {
  const when = document.querySelector(".slip-when");
  if (state.day) {
    const d = state.day.date, w = DAYS[d.getDay()];
    when.classList.remove("idle");
    $("s-dot").style.background = w.hex;
    $("s-weekday").textContent = `วัน${w.name}`;
    $("s-date").textContent = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
    $("s-time").textContent = state.time ? `${state.time} – ${String(+state.time.slice(0, 2) + 1).padStart(2, "0")}:00 น.` : "ยังไม่ได้เลือกเวลา";
    $("bb-meta").textContent = `${w.short} ${d.getDate()} ${MONTHS_S[d.getMonth()]}${state.time ? ` ${state.time} น.` : " เลือกเวลา"}`;
    $("step-day").classList.remove("need");
  } else {
    when.classList.add("idle");
    $("s-dot").style.background = "";
    $("s-weekday").textContent = "ยังไม่ได้เลือกวัน";
    $("s-date").textContent = "เลือกวันและเวลา";
    $("s-time").textContent = narrow.matches ? "ด้านบน" : "ทางซ้ายมือ";
    $("bb-meta").textContent = "ยังไม่ได้เลือกวัน";
  }
  const b = birth();
  setRow("s-birth", b && `${b.d} ${MONTHS_S[b.m - 1]} ${b.y + 543} วัน${b.day.name}`, "ยังไม่ได้ใส่");
  setRow("s-topics", state.topics.join(", "), "ยังไม่ได้เลือก");
  setRow("s-nick", $("nick").value.trim(), "ยังไม่ได้ใส่");
}

/* ---------- Send (prototype: shows the message instead of opening LINE) ---------- */
function missing() {
  const out = [];
  if (!state.day) out.push(["step-day", "วันนัด", null]);
  else if (!state.time) out.push(["step-day", "เวลานัด", null]);
  if (!born) out.push(["step-birth", "วันเกิด", $("dob")]);
  if (!$("nick").value.trim()) out.push(["step-you", "ชื่อเรียก", $("nick")]);
  if (!$("source").value) out.push(["step-you", "รู้จักเราจากไหน", $("source").parentElement]);
  if (!$("consent").checked) out.push(["step-you", "ความยินยอมเรื่องข้อมูล", $("consent").closest(".consent")]);
  // The story may hold health or belief details, which need their own consent.
  if ($("story").value.trim() && !$("consent2").checked) out.push(["step-you", "ความยินยอมเรื่องที่เล่า", $("consent2").closest(".consent")]);
  return out;
}
document.querySelectorAll("[data-send]").forEach((btn) => btn.addEventListener("click", () => {
  const miss = missing();
  const box = $("missing");
  if (miss.length) {
    box.textContent = `ยังขาด ${miss.map((m) => m[1]).join(", ")}`;
    box.hidden = false;
    $("preview").hidden = true;
    miss.forEach(([step, , el]) => {
      if (el) el.classList.add("need");
      else $(step).classList.add("need");
    });
    $(miss[0][0]).scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    return;
  }
  box.hidden = true;
  // Booking needs the LINE account: it is who we call, and where the status goes.
  LineLogin.ensure(place);
}));

function place() {
  const d = state.day.date, w = DAYS[d.getDay()], b = birth();
  const when = `วัน${w.name} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear() + 543} เวลา ${state.time} น.`;
  // Prototype stand-in for the "คิวของคุณ" page: a short code and a 2-hour hold to pay.
  const code = `SL-${String(1000 + ([...state.day.key + state.time].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9000, 7))).padStart(4, "0")}`;
  const hold = new Date(Date.now() + 2 * 36e5);
  const holdText = `${String(hold.getHours()).padStart(2, "0")}:${String(hold.getMinutes()).padStart(2, "0")} น.`;
  const text = [
    `คิวของคุณ ${code}`,
    `สถานะ: รอชำระ เก็บคิวไว้ให้ถึง ${holdText}`,
    `วันนัด: ${when}`,
    "ช่องทาง: Google Meet เราส่งลิงก์ให้ทาง LINE ก่อนถึงนัด",
    $("consent-ai").checked ? "ให้ AI ช่วยจด: ยินยอม" : null,
    `วันเกิด: ${b.d} ${MONTHS[b.m - 1]} ${b.y + 543}${birthTime() ? ` เวลา ${birthTime()} น.` : ""} (เกิดวัน${b.day.name})`,
    state.topics.length ? `เรื่องที่อยากถาม: ${state.topics.join(", ")}` : null,
    `ชื่อเรียก: ${$("nick").value.trim()}`,
    "ค่าดูดวง 990 บาท โอนผ่าน PromptPay แล้วแนบสลิปในหน้านี้",
    "แนบสลิปแล้ว เวลาจะหยุดนับ เราตรวจยอดแล้วยืนยันคิวให้ทาง LINE",
  ].filter(Boolean).join("\n");
  $("preview-text").textContent = text;
  // Hand the booking to the status page so the "คิวของคุณ" link opens this one.
  localStorage.setItem("ms-booking", JSON.stringify({
    code, weekday: `วัน${w.name}`, dot: w.hex, date: `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`,
    time: `${state.time} – ${String(+state.time.slice(0, 2) + 1).padStart(2, "0")}:00 น.`, price: 990, holdUntil: hold.getTime(), slip: false,
  }));
  let go = $("preview").querySelector(".go-status");
  if (!go) {
    go = document.createElement("a");
    go.className = "btn btn-line btn-block go-status";
    go.href = "status.html?k=booking";
    go.textContent = "เปิดหน้าคิวของคุณ";
    $("preview").append(go);
  }
  $("preview").hidden = false;
  if (narrow.matches) $("slip").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
}

narrow.addEventListener("change", render);
renderTimes();
render();

/* ---------- "อ่านเพิ่ม" for the optional AI note-taking consent ---------- */
const aiSheet = $("ai-sheet");
document.querySelector("[data-ai-more]").addEventListener("click", (e) => {
  e.preventDefault(); // the link sits inside the checkbox label; reading more must not tick it
  aiSheet.showModal();
});
aiSheet.querySelectorAll("[data-ai-close]").forEach((b) => b.addEventListener("click", () => aiSheet.close()));
aiSheet.addEventListener("click", (e) => { if (e.target === aiSheet) aiSheet.close(); });
