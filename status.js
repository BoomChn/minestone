// Status page opened from LINE: "คิวของคุณ" for a reading, "ออเดอร์ของคุณ" for bracelets.
// The top always says what we are waiting for and what to do next. Prototype data comes from
// localStorage (written by booking.js and cart-page.js); with none, a sample is shown.
const $ = (id) => document.getElementById(id);
const baht = (n) => `${n.toLocaleString("en-US")} บาท`;
const k = new URLSearchParams(location.search).get("k") === "order" ? "order" : "booking";
const read = (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
const hhmm = (t) => { const d = new Date(t); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} น.`; };
const MONTHS_S = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const clock = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';
const tick = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
const upload = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>';
const qr = '<svg width="92" height="92" viewBox="0 0 23 23" aria-hidden="true"><g fill="none" stroke="#111827" stroke-width="1.4"><rect x="1" y="1" width="6" height="6"/><rect x="16" y="1" width="6" height="6"/><rect x="1" y="16" width="6" height="6"/></g><g fill="#111827"><rect x="3" y="3" width="2" height="2"/><rect x="18" y="3" width="2" height="2"/><rect x="3" y="18" width="2" height="2"/><rect x="9" y="2" width="2" height="2"/><rect x="12" y="5" width="2" height="2"/><rect x="9" y="9" width="3" height="2"/><rect x="14" y="10" width="2" height="3"/><rect x="18" y="9" width="3" height="2"/><rect x="10" y="14" width="2" height="2"/><rect x="13" y="16" width="3" height="2"/><rect x="17" y="14" width="2" height="2"/><rect x="19" y="18" width="2" height="3"/><rect x="9" y="19" width="2" height="2"/><rect x="2" y="10" width="2" height="2"/><rect x="5" y="12" width="2" height="2"/></g></svg>';

const steps = (list, at) => `<ol class="st-steps">${list.map((s, i) => `<li class="${i < at ? "done" : i === at ? "now" : ""}"><i>${i < at ? tick : ""}</i>${s}</li>`).join("")}</ol>`;

// Data, with samples so the page can be opened on its own.
const booking = read("ms-booking") || {
  code: "SL-0412", weekday: "วันเสาร์", dot: "#A98BC4", date: "7 พฤศจิกายน 2569", time: "10:00 – 11:00 น.", price: 990,
  holdUntil: Date.now() + 102 * 6e4, slip: false,
};
const order = read("ms-order") || {
  code: "MO-0187", placed: Date.now() - 18 * 6e4, status: "check", ship: 50, total: 1485, holdUntil: null,
  items: [
    { kind: "custom", name: "กำไลที่คุณร้อยเอง", price: 645, img: "assets/b-rose.jpg" },
    { kind: "ready", name: "โรสควอตซ์คั่นมูนสโตน", price: 790, img: "assets/p-close.png" },
  ],
};
const rec = k === "booking" ? booking : order;
const save = () => localStorage.setItem(k === "booking" ? "ms-booking" : "ms-order", JSON.stringify(rec));

function left() {
  const ms = Math.max(0, rec.holdUntil - Date.now());
  const h = Math.floor(ms / 36e5), m = Math.floor((ms % 36e5) / 6e4);
  return h ? `เหลือ ${h} ชม. ${m} นาที` : `เหลือ ${m} นาที`;
}

function payBlock(amount) {
  if (rec.slip) {
    return `<div class="st-block pay"><div class="slip-done">${clock}ได้รับสลิปแล้ว เวลาหยุดนับ เราตรวจยอดแล้วยืนยันให้ทาง LINE</div></div>`;
  }
  return `<div class="st-block pay">
    <div class="pay-head"><h2>โอนผ่าน PromptPay</h2><b>${baht(amount)}</b></div>
    <div class="pay-qr"><div class="qr">${qr}</div><p><b>ร้าน Silamani</b>สแกนในแอปธนาคาร ยอดขึ้นให้แล้ว แตะค้างที่รูปเพื่อบันทึก</p></div>
    <label class="btn btn-dark btn-block" for="slip">${upload}แนบสลิป</label>
    <input type="file" id="slip" accept="image/*" hidden>
    <p class="fine-l">แนบแล้วเวลาจะหยุดนับ ${k === "booking" ? "คิวยังเป็นของคุณ" : "ของยังเก็บไว้ให้"} เราตรวจยอดแล้วยืนยันให้ทาง LINE</p>
  </div>`;
}

function renderBooking() {
  const waiting = !rec.slip;
  document.title = `คิวของคุณ ${rec.code} Silamani (prototype)`;
  $("status").innerHTML = `
    <div class="st-head">
      <span class="st-code">คิวของคุณ ${rec.code}</span>
      <h1>${waiting ? "รอชำระ" : "ส่งสลิปแล้ว รอตรวจ"}</h1>
      <div class="st-sub">${waiting ? `<span class="pill wait">${clock}<span id="left">${left()}</span></span>เก็บคิวไว้ให้ถึง ${hhmm(rec.holdUntil)}` : `<span class="pill ok">${clock}เราตรวจยอดแล้วยืนยันทาง LINE</span>`}</div>
    </div>
    <div class="st-block appt">
      <span class="when-day"><i class="dot" style="background:${rec.dot}"></i>${rec.weekday} ดูดวง 60 นาที</span>
      <b>${rec.date}</b>
      <div class="row"><span>${rec.time}</span><span>โทรคุยทาง LINE</span></div>
    </div>
    ${payBlock(rec.price)}
    <div class="st-block">${steps(["จองคิวแล้ว", "โอนเงินและแนบสลิป", "เรายืนยันคิวทาง LINE", "วันนัด เราโทรหาคุณทาง LINE"], waiting ? 1 : 2)}</div>
    <div class="st-help"><span>ขอเลื่อนวันได้ 1 ครั้ง ก่อนนัด 24 ชม.</span><a href="#">คุยกับเราทาง LINE</a></div>
    <p class="proto-note">ต้นแบบ: หน้านี้ยังไม่ได้ต่อระบบจริง QR เป็นภาพตัวอย่าง และสลิปที่แนบไม่ได้ส่งไปไหน</p>`;
}

function renderOrder() {
  const placed = new Date(rec.placed);
  const placedText = `สั่งเมื่อ ${placed.getDate()} ${MONTHS_S[placed.getMonth()]} ${hhmm(rec.placed)}`;
  const check = rec.status === "check";
  const waitingPay = rec.status === "pay" && !rec.slip;
  document.title = `ออเดอร์ของคุณ ${rec.code} Silamani (prototype)`;
  const title = check ? "รอเช็กหิน" : waitingPay ? "รอชำระ" : "ส่งสลิปแล้ว รอตรวจ";
  const sub = check
    ? `<span class="pill ok">${clock}ตอบภายใน 24 ชั่วโมง</span>${placedText}`
    : waitingPay
      ? `<span class="pill wait">${clock}<span id="left">${left()}</span></span>เก็บของไว้ให้ถึง ${hhmm(rec.holdUntil)}`
      : `<span class="pill ok">${clock}เราตรวจยอดแล้วแจ้งทาง LINE</span>`;
  const items = rec.items.map((i) => `<li><div class="thumb${i.kind === "custom" ? " bead" : ""}"><img src="${i.img}" alt="" width="64" height="64"></div><div class="info"><b></b><small class="${i.kind === "custom" && check ? "ok" : ""}">${i.kind === "custom" ? (check ? "กำลังเช็กหิน" : "หินครบแล้ว") : "พร้อมส่ง เก็บไว้ให้แล้ว"}</small></div><span>${baht(i.price)}</span></li>`).join("");
  const hasCustom = rec.items.some((i) => i.kind === "custom");
  const list = hasCustom
    ? ["ส่งออเดอร์แล้ว", "เราเช็กหินกำไลร้อยเอง", "โอนเงินและแนบสลิป ภายใน 2 ชั่วโมง", "ร้อยและส่ง 5–7 วันทำการ"]
    : ["ส่งออเดอร์แล้ว", "โอนเงินและแนบสลิป ภายใน 2 ชั่วโมง", "เราแพ็กและส่ง พร้อมเลขพัสดุทาง LINE"];
  const at = hasCustom ? (check ? 1 : waitingPay ? 2 : 3) : (waitingPay ? 1 : 2);
  $("status").innerHTML = `
    <div class="st-head">
      <span class="st-code">ออเดอร์ของคุณ ${rec.code}</span>
      <h1>${title}</h1>
      <div class="st-sub">${sub}</div>
    </div>
    <div class="st-block"><ul class="st-items" id="st-items">${items}</ul></div>
    ${rec.address ? `<div class="st-block st-ship"><span>ส่งที่</span><b id="st-to"></b><p id="st-addr"></p></div>` : ""}
    ${check
      ? `<div class="st-block pay"><div class="pay-head"><h2>ยังไม่ต้องโอนเงิน</h2><b>${baht(rec.total)}</b></div><p class="wait-note">หินครบแล้วเราจะทักไปทาง LINE หน้านี้จะขึ้น QR PromptPay ให้ แล้วมีเวลาโอน 2 ชั่วโมง รวมค่าส่ง ${rec.ship} บาทแล้ว</p><button type="button" class="btn btn-line btn-block" id="demo-ok">ต้นแบบ: ลองกดเป็น "หินครบแล้ว"</button></div>`
      : payBlock(rec.total)}
    <div class="st-block">${steps(list, at)}</div>
    <div class="st-help"><span>${check ? "อยากเปลี่ยนหิน บอกเราได้ก่อนโอน" : "มีอะไรสงสัย ทักเราได้เลย"}</span><a href="#">คุยกับเราทาง LINE</a></div>
    <p class="proto-note">ต้นแบบ: หน้านี้ยังไม่ได้ต่อระบบจริง QR เป็นภาพตัวอย่าง และสลิปที่แนบไม่ได้ส่งไปไหน</p>`;
  [...document.querySelectorAll("#st-items b")].forEach((b, i) => { b.textContent = rec.items[i].name; });
  if (rec.address) {
    const a = rec.address;
    $("st-to").textContent = `${a.name}  ${a.tel}`;
    $("st-addr").textContent = `${a.line1} ${a.sub} ${a.dist} ${a.prov} ${a.zip}`;
  }
}

function render() {
  (k === "booking" ? renderBooking : renderOrder)();
  const slip = $("slip");
  if (slip) slip.addEventListener("change", () => { if (slip.files.length) { rec.slip = true; save(); render(); } });
  const ok = $("demo-ok");
  if (ok) ok.addEventListener("click", () => { rec.status = "pay"; rec.holdUntil = Date.now() + 2 * 36e5; save(); render(); });
}
render();
setInterval(() => { const el = $("left"); if (el) el.textContent = left(); }, 15000);
