// Status page opened from LINE: "คิวของคุณ" for a reading, "ออเดอร์ของคุณ" for bracelets.
// The top always says what we are waiting for and what to do next. Prototype data comes from
// localStorage (written by booking.js and cart-page.js); with none, a sample is shown.
const $ = (id) => document.getElementById(id);
const baht = (n) => `${n.toLocaleString("en-US")} บาท`;
const kq = new URLSearchParams(location.search).get("k");
const k = kq === "order" || kq === "cancel" ? kq : "booking";
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
const KEYS = { booking: "ms-booking", order: "ms-order", cancel: "ms-shopcancel" };
const rec = k === "booking" ? booking : k === "order" ? order : (read("ms-shopcancel") || { code: "SL-0420", step: "choose" });
const save = () => localStorage.setItem(KEYS[k], JSON.stringify(rec));

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
      <div class="row"><span>${rec.time}</span><span>Google Meet</span></div>
    </div>
    ${payBlock(rec.price)}
    <div class="st-block">${steps(["จองคิวแล้ว", "โอนเงินและแนบสลิป", "เรายืนยันคิวทาง LINE", "วันนัด เข้าห้อง Google Meet จากลิงก์ที่เราส่งให้"], waiting ? 1 : 2)}</div>
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

// ---------- ร้านยกเลิกคิว (Paper page "Checkout", row of คิวของคุณ Mobile ร้านยกเลิก) ----------
// rec.step: choose → moved | refund → refunded. "pick" and "form" are screens on the way, not saved.
// The backoffice (queue.html, same browser) reads and writes the same localStorage key.
const SLOTS = [
  { key: "14|14:00", day: "เสาร์ 14 พ.ย.", weekday: "วันเสาร์", date: "14 พฤศจิกายน 2569", time: "14:00 – 15:00 น.", t: "14:00", dot: "#A98BC4" },
  { key: "17|20:00", day: "อังคาร 17 พ.ย.", weekday: "วันอังคาร", date: "17 พฤศจิกายน 2569", time: "20:00 – 21:00 น.", t: "20:00", dot: "#E58CA8" },
];
const slotFor = (r) => SLOTS.find((y) => y.key === r.to) || (r.day ? (() => { const [wd, dn] = r.day.split(" "); const h = +r.t.split(":")[0]; return { key: r.to, day: r.day, weekday: `วัน${wd}`, date: `${dn} พฤศจิกายน 2569`, time: `${r.t} – ${String(h + 1).padStart(2, "0")}:00 น.`, t: r.t, dot: "#A98BC4" }; })() : SLOTS[0]);
let view = null; // "pick" | "form" while choosing
let pickKey = SLOTS[0].key;
let form = { via: "พร้อมเพย์", no: "", name: "", bank: "กสิกรไทย" };
const chevR = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
const cal = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const maskNo = (no) => { const d = String(no).replace(/\D/g, ""); return d.length === 10 && d[0] === "0" ? `${d.slice(0, 3)}-xxx-${d.slice(6)}` : `xxx-x-x${d.slice(-4)}`; };
const nowTh = () => { const d = new Date(); return `พฤ 5 พ.ย. ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

function oldAppt(label = "วันอาทิตย์ ดูดวง 60 นาที") {
  return `<div class="st-block appt off">
    <span class="when-day"><i class="dot" style="background:#A98BC4"></i>${label}</span>
    <b><s>8 พฤศจิกายน 2569</s></b>
    <div class="row"><span>14:00 – 15:00 น.</span><span>ยกเลิกโดยร้าน</span></div>
  </div>`;
}
const help = (left) => `<div class="st-help"><span>${left}</span><a href="#">คุยกับเราทาง LINE</a></div>`;
const head = (title, sub) => `<div class="st-head"><span class="st-code">คิวของคุณ ${esc(rec.code)}</span><h1>${title}</h1><div class="st-sub">${sub}</div></div>`;
const protoNote = `<p class="proto-note">ต้นแบบ: หน้านี้ยังไม่ได้ต่อระบบจริง ถ้าเปิดหลังบ้าน (คิวดูดวง) ในเบราว์เซอร์เดียวกัน สิ่งที่เลือกที่นี่จะไปขึ้นที่หลังบ้าน และหลังบ้านกดโอนคืนแล้วหน้านี้จะเปลี่ยนตาม <button type="button" class="sc-reset" id="sc-reset">เริ่มใหม่</button></p>`;

function renderCancel() {
  document.title = `คิวของคุณ ${rec.code} Silamani (prototype)`;
  const s = rec.step;
  let html;
  if (s === "choose" && view === "pick") {
    html = head("เลือกเวลาใหม่", `<span class="pill soft">ไม่นับสิทธิ์เลื่อนของคุณ</span>`) + oldAppt("เดิม วันอาทิตย์") +
      `<div class="st-block sc-sec"><h2>รอบที่ว่างตอนนี้</h2>
        <div class="sc-slots" role="radiogroup" aria-label="รอบที่ว่าง">${SLOTS.map((x) => `<button type="button" class="sc-slot" role="radio" aria-checked="${x.key === pickKey}" data-pick="${x.key}"><i></i><span>${x.day}</span><b>${x.t}</b></button>`).join("")}</div>
        <button type="button" class="btn btn-dark btn-block" id="sc-move">ย้ายไป${SLOTS.find((x) => x.key === pickKey).day} ${SLOTS.find((x) => x.key === pickKey).t}</button>
        <p class="sc-fine">ไม่มีเวลาที่สะดวก ทักเราทาง LINE ได้ หรือ <button type="button" class="sc-link" data-view="form">เปลี่ยนเป็นรับเงินคืน</button></p>
      </div>` + help("มีคำถาม ทักเราได้เสมอ");
  } else if (s === "choose" && view === "form") {
    const pp = form.via === "พร้อมเพย์";
    html = head("ขอเงินคืน 990 บาท", `<span class="pill soft">คืนเต็มจำนวน</span>`) + oldAppt() +
      `<form class="st-block sc-sec" id="sc-form" novalidate><h2>โอนคืนเข้าบัญชีไหนดี</h2>
        <div class="sc-seg" role="radiogroup" aria-label="ช่องทางรับเงินคืน">
          <button type="button" role="radio" aria-checked="${pp}" data-via="พร้อมเพย์">พร้อมเพย์</button>
          <button type="button" role="radio" aria-checked="${!pp}" data-via="บัญชีธนาคาร">บัญชีธนาคาร</button>
        </div>
        ${pp ? "" : `<label class="sc-field"><span>ธนาคาร</span><select data-f="bank">${["กสิกรไทย", "ไทยพาณิชย์", "กรุงเทพ", "กรุงไทย", "กรุงศรีอยุธยา", "ทหารไทยธนชาต", "ออมสิน"].map((b) => `<option${b === form.bank ? " selected" : ""}>${b}</option>`).join("")}</select></label>`}
        <label class="sc-field"><span>${pp ? "เบอร์พร้อมเพย์" : "เลขบัญชี"}</span><input data-f="no" inputmode="numeric" autocomplete="off" placeholder="${pp ? "08x-xxx-xxxx" : "xxx-x-xxxxx-x"}" value="${esc(form.no)}"></label>
        <label class="sc-field"><span>ชื่อบัญชี</span><input data-f="name" autocomplete="name" placeholder="ชื่อตามบัญชี" value="${esc(form.name)}"></label>
        <p class="sc-err" id="sc-err" hidden></p>
        <button type="submit" class="btn btn-dark btn-block">ขอรับเงินคืน 990 บาท</button>
        <p class="sc-fine">เราโอนแล้วจะส่งสลิปให้ทาง LINE ข้อมูลบัญชีใช้แค่คืนเงินครั้งนี้<br>เปลี่ยนใจอยากเลื่อนแทน <button type="button" class="sc-link" data-view="pick">เลือกเวลาใหม่</button></p>
      </form>` + help("มีคำถาม ทักเราได้เสมอ");
  } else if (s === "choose") {
    html = head("ร้านขอยกเลิกคิวนี้", `<span class="pill wait">${clock}รอคุณเลือก</span>จ่ายแล้ว 990 บาท`) + oldAppt() +
      `<div class="st-block sc-sec"><p class="sc-text">ขอโทษจริงๆ ค่ะ ร้านมีเหตุจำเป็น ดูดวงรอบนี้ไม่ได้ เงิน 990 บาทของคุณยังอยู่ครบ เลือกได้เลยว่าอยากได้แบบไหน</p>
        <div class="sc-choices">
          <button type="button" class="sc-choice" data-view="pick"><span><b>เลื่อนไปเวลาใหม่</b><small>เลือกรอบที่ว่างได้ก่อนคนอื่น ไม่นับสิทธิ์เลื่อนของคุณ</small></span>${chevR}</button>
          <button type="button" class="sc-choice" data-view="form"><span><b>รับเงินคืน 990 บาท</b><small>คืนเต็มจำนวน บอกบัญชีที่อยากให้โอนเข้า</small></span>${chevR}</button>
        </div>
      </div>` + help("มีคำถาม ทักเราได้เสมอ");
  } else if (s === "moved") {
    const x = slotFor(rec);
    html = head("ยืนยันคิวใหม่แล้ว", `<span class="pill ok">ยืนยันแล้ว</span>ยังเลื่อนเองได้อีก 1 ครั้ง`) +
      `<div class="st-block appt"><span class="when-day"><i class="dot" style="background:${x.dot}"></i>${x.weekday} ดูดวง 60 นาที</span><b>${x.date}</b><div class="row"><span>${x.time}</span><span>คุยทาง Google Meet</span></div></div>
      <div class="st-block sc-sec"><p class="sc-text">ย้ายจากอาทิตย์ 8 พ.ย. 14:00 มาเป็นรอบนี้แล้ว ขอบคุณที่รอเรานะคะ ก่อนถึงเวลาเราจะส่งลิงก์ Google Meet ให้อีกครั้งทาง LINE</p>
        <a class="btn btn-line btn-block sc-ics" id="sc-ics" download="silamani-${esc(rec.code)}.ics">${cal}เพิ่มลงปฏิทิน</a>
      </div>` + help("ลิงก์ Meet ส่งให้ทาง LINE แล้ว");
  } else if (s === "refund") {
    const a = rec.acct || {};
    html = head("รอโอนคืน", `<span class="pill wait">${clock}990 บาท</span>ส่งบัญชีเมื่อ ${esc(rec.at || "")}`) + oldAppt() +
      `<div class="st-block sc-sec"><p class="sc-text">ได้บัญชีแล้วค่ะ เราจะโอนคืน 990 บาท เข้า${esc(a.via || "")} ${maskNo(a.no || "")} ชื่อ ${esc(a.name || "")} แล้วส่งสลิปให้ทาง LINE</p>
        <button type="button" class="btn btn-line btn-block" id="sc-demo-paid">ต้นแบบ: ลองกดเป็น "ร้านโอนคืนแล้ว"</button>
      </div>` + help("ยังไม่ได้เงิน บอกเราได้เลย");
  } else {
    const a = rec.acct || { via: "พร้อมเพย์", no: "081-234-5678" };
    html = head("คืนเงินแล้ว", `<span class="pill ok">990 บาท</span>โอนเมื่อ ${esc(rec.at || "พฤ 5 พ.ย. 11:04")}`) + oldAppt() +
      `<div class="st-block sc-sec">
        <div class="sc-slip"><span class="sc-slipimg" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="m"><b>สลิปโอนคืน</b><small>เข้า${esc(a.via)} ${maskNo(a.no)}</small></span><button type="button" class="sc-link" id="sc-slip-view">ดูรูป</button></div>
        <p class="sc-text">ขอโทษอีกครั้งที่ต้องยกเลิกคิวกะทันหัน ทำให้คุณต้องเสียเวลารอ วันไหนอยากกลับมาดูดวงอีก เราจดเรื่องที่คุณเคยถามไว้แล้ว ไม่ต้องเล่าใหม่ตั้งแต่ต้น</p>
        <a class="btn btn-line btn-block" href="booking.html">ดูรอบที่ว่าง</a>
      </div>` + help("ยังไม่ได้เงิน บอกเราได้เลย");
  }
  $("status").innerHTML = html + protoNote;
  wireCancel();
}

function icsFor(x) {
  const [d, m] = [x.date.split(" ")[0].padStart(2, "0"), "11"];
  const [h] = x.t.split(":");
  const end = String(+h + 1).padStart(2, "0");
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(
    `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Silamani//prototype//TH\r\nBEGIN:VEVENT\r\nUID:${rec.code}@silamani\r\nDTSTART;TZID=Asia/Bangkok:2026${m}${d}T${h}0000\r\nDTEND;TZID=Asia/Bangkok:2026${m}${d}T${end}0000\r\nSUMMARY:ดูดวง 60 นาที Silamani (${rec.code})\r\nDESCRIPTION:ลิงก์ Google Meet ส่งให้ทาง LINE\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`);
}

function wireCancel() {
  const root = $("status");
  root.onclick = (e) => {
    const v = e.target.closest("[data-view]");
    if (v) { view = v.dataset.view; renderCancel(); window.scrollTo({ top: 0 }); return; }
    const p = e.target.closest("[data-pick]");
    if (p) { pickKey = p.dataset.pick; renderCancel(); return; }
    const via = e.target.closest("[data-via]");
    if (via) { form.via = via.dataset.via; form.no = ""; renderCancel(); root.querySelector('[data-f="no"]').focus(); return; }
    if (e.target.closest("#sc-move")) { rec.step = "moved"; rec.to = pickKey; view = null; save(); renderCancel(); window.scrollTo({ top: 0 }); return; }
    if (e.target.closest("#sc-demo-paid")) { rec.step = "refunded"; rec.at = nowTh(); save(); renderCancel(); window.scrollTo({ top: 0 }); return; }
    if (e.target.closest("#sc-slip-view")) { e.target.textContent = "ต้นแบบ: ยังไม่มีรูปจริง"; return; }
    if (e.target.closest("#sc-reset")) { localStorage.removeItem(KEYS.cancel); Object.assign(rec, { code: "SL-0420", step: "choose" }); delete rec.to; delete rec.acct; delete rec.at; view = null; renderCancel(); window.scrollTo({ top: 0 }); }
  };
  root.oninput = (e) => { const f = e.target.dataset.f; if (f) form[f] = e.target.value; };
  const ics = $("sc-ics");
  if (ics) ics.href = icsFor(slotFor(rec));
  const fm = $("sc-form");
  if (fm) fm.onsubmit = (e) => {
    e.preventDefault();
    const digits = form.no.replace(/\D/g, "");
    const pp = form.via === "พร้อมเพย์";
    const bad = pp ? !(digits.length === 10 || digits.length === 13) : digits.length < 10;
    const err = $("sc-err");
    if (bad || !form.name.trim()) {
      err.hidden = false;
      err.textContent = bad ? (pp ? "เบอร์พร้อมเพย์ 10 หลัก หรือเลขบัตรประชาชน 13 หลัก" : "เลขบัญชีอย่างน้อย 10 หลัก") : "ใส่ชื่อบัญชีด้วย เราจะได้โอนถูกคน";
      root.querySelector(bad ? '[data-f="no"]' : '[data-f="name"]').focus();
      return;
    }
    rec.step = "refund"; rec.at = nowTh();
    rec.acct = { via: pp ? "พร้อมเพย์" : `บัญชี${form.bank}`, no: form.no.trim(), name: form.name.trim() };
    view = null; save(); renderCancel(); window.scrollTo({ top: 0 });
  };
}

// The backoffice may change the same record in another tab (customer picked there, or the shop refunded).
window.addEventListener("storage", (e) => {
  if (k !== "cancel" || e.key !== KEYS.cancel) return;
  const r = read(KEYS.cancel);
  if (!r) return;
  Object.keys(rec).forEach((key) => delete rec[key]);
  Object.assign(rec, r); view = null; renderCancel();
});

function render() {
  if (k === "cancel") return renderCancel();
  (k === "booking" ? renderBooking : renderOrder)();
  const slip = $("slip");
  if (slip) slip.addEventListener("change", () => { if (slip.files.length) { rec.slip = true; save(); render(); } });
  const ok = $("demo-ok");
  if (ok) ok.addEventListener("click", () => { rec.status = "pay"; rec.holdUntil = Date.now() + 2 * 36e5; save(); render(); });
}
render();
setInterval(() => { const el = $("left"); if (el) el.textContent = left(); }, 15000);
