/* คิวดูดวง (queue.html). Tab "ข้างหน้า": queue list, booking detail with notes, reschedule.
   Tab "ที่ผ่านมา": AI-drafted summary + offers, send, then the sent view. Fake data only.
   Reader role uses the past tab only ("ข้างหน้า" goes to my-queue.html). State lives in sessionStorage. */
(function () {
  var role = localStorage.getItem("bo-role") || "shop";
  var params = new URLSearchParams(location.search);
  var tab = params.get("tab") === "past" || role === "reader" ? "past" : "next";

  var NEXT = [
    { id: "5", wd: "พรุ่งนี้", soon: true, dn: "พฤ 5", full: "พฤหัส 5 พ.ย.", slots: [{ t: "20:00", code: "SL-0405" }] },
    { id: "7", wd: "เสาร์", dn: "ส 7", full: "เสาร์ 7 พ.ย.", slots: [{ t: "10:00", code: "SL-0412" }, { t: "14:00", code: "SL-0415" }] },
    { id: "8", wd: "อาทิตย์", dn: "อา 8", full: "อาทิตย์ 8 พ.ย.", slots: [{ t: "10:00" }, { t: "14:00", code: "SL-0420" }] },
    { id: "10", wd: "อังคาร", dn: "อ 10", full: "อังคาร 10 พ.ย.", slots: [{ t: "20:00", closed: true }] },
    { id: "12", wd: "พฤหัส", dn: "พฤ 12", full: "พฤหัส 12 พ.ย.", slots: [{ t: "20:00", code: "SL-0423" }] },
    { id: "14", wd: "เสาร์", dn: "ส 14", full: "เสาร์ 14 พ.ย.", slots: [{ t: "10:00", code: "SL-0417" }, { t: "14:00" }] },
    { id: "15", wd: "อาทิตย์", dn: "อา 15", full: "อาทิตย์ 15 พ.ย.", slots: [{ t: "10:00", code: "SL-0419" }, { t: "14:00", code: "SL-0424" }] }
  ];
  var PAST = [
    { id: "3", wd: "เมื่อวาน", dn: "อ 3", slots: [{ t: "20:00", code: "SL-0402" }] },
    { id: "1", wd: "อาทิตย์", dn: "อา 1", slots: [{ t: "10:00", code: "SL-0398" }, { t: "14:00", code: "SL-0400" }] },
    { id: "31", wd: "เสาร์", dn: "ส 31", slots: [{ t: "10:00", none: true }, { t: "14:00", code: "SL-0395" }] },
    { id: "29", wd: "พฤหัส", dn: "พฤ 29", slots: [{ t: "20:00", code: "SL-0391" }] },
    { id: "27", wd: "อังคาร", dn: "อ 27", slots: [{ t: "20:00", closed: true }] }
  ];

  // st: unpaid | slip | ok (upcoming); due | sent | noshow (past)
  var B = {
    "SL-0405": { name: "คุณจูน", st: "ok", visit: "ครั้งที่ 2", end: "21:00", via: "Google Meet", moves: 1, moveBy: "พุธ 4 พ.ย. 20:00",
      times: ["1 พ.ย. 10:15", "1 พ.ย. 10:40", "1 พ.ย. 11:02"],
      ask: "กำลังคิดจะย้ายงานช่วงต้นปีหน้า อยากรู้ว่าจังหวะไหนดี แล้วก็อยากถามเรื่องความรักช่วงนี้ด้วยค่ะ",
      past: [["14 ก.ย. ครั้งแรก", "ไพ่เรื่องงานออก The Tower บอกให้รอดูหลังสิ้นปี"]] },
    "SL-0412": { name: "คุณแพร", st: "slip", visit: "ครั้งแรก", end: "11:00", via: "LINE", moves: 1, moveBy: "ศุกร์ 6 พ.ย. 10:00",
      times: ["4 พ.ย. 08:51", "4 พ.ย. 09:03"],
      ask: "ช่วงนี้ใช้เงินเกินตัวบ่อย อยากรู้ว่าปีหน้าการเงินจะดีขึ้นไหม แล้วควรเริ่มเก็บเงินยังไงดีคะ", past: [] },
    "SL-0415": { name: "คุณกาย", st: "ok", visit: "ครั้งแรก", end: "15:00", via: "LINE", moves: 1, moveBy: "ศุกร์ 6 พ.ย. 14:00",
      times: ["2 พ.ย. 13:20", "2 พ.ย. 13:41", "2 พ.ย. 14:05"],
      ask: "แม่กับน้องสาวทะเลาะกันบ่อย ผมอยู่ตรงกลาง อยากรู้ว่าควรวางตัวยังไง และปีหน้าบ้านจะสงบลงไหมครับ", past: [] },
    "SL-0420": { name: "คุณฟ้า", st: "ok", visit: "ครั้งที่ 3", end: "15:00", via: "LINE", moves: 1, moveBy: "เสาร์ 7 พ.ย. 14:00",
      times: ["1 พ.ย. 19:02", "1 พ.ย. 19:40", "1 พ.ย. 19:52"],
      ask: "ต้นปีหน้าควรเปลี่ยนงานเลยไหม หรือรอผลเลื่อนตำแหน่งก่อน แล้วถ้าย้ายควรย้ายช่วงไหนดีคะ",
      memo: "ก่อนดู: ครั้งก่อนบอกให้รอผลประเมินปลายปี ถามก่อนว่าได้ผลหรือยัง ถ้ายัง ลองเปิดไพ่ดูจังหวะย้ายงานช่วงต้นปี",
      past: [["12 ส.ค. ครั้งที่ 2", "Eight of Pentacles งานเดิมยังไปต่อได้ บอกให้รอผลประเมินปลายปีก่อนตัดสินใจ"],
             ["3 มิ.ย. ครั้งแรก", "ถามเรื่องย้ายสายงาน เลขชีวิต 7 ชอบงานที่ได้คิดเอง ไม่ชอบงานซ้ำๆ"]] },
    "SL-0423": { name: "คุณพลอย", st: "unpaid", visit: "ครั้งแรก", end: "21:00", via: "LINE", hold: "1:24", moves: 1, moveBy: "พุธ 11 พ.ย. 20:00",
      times: ["4 พ.ย. 12:36"],
      ask: "อยากรู้ว่าปีหน้าจะได้ย้ายไปทำงานต่างประเทศตามที่ตั้งใจไว้ไหมคะ", past: [] },
    "SL-0417": { name: "คุณเมย์", st: "ok", visit: "ครั้งแรก", end: "11:00", via: "Google Meet", moves: 1, moveBy: "ศุกร์ 13 พ.ย. 10:00",
      times: ["3 พ.ย. 20:11", "3 พ.ย. 20:30", "3 พ.ย. 20:47"],
      ask: "เพิ่งเลิกกับแฟนที่คบมา 5 ปี อยากรู้ว่าควรเริ่มใหม่ยังไง และปีหน้าจะเจอคนที่ใช่ไหมคะ", past: [] },
    "SL-0419": { name: "คุณบีม", st: "ok", visit: "ครั้งที่ 2", end: "11:00", via: "LINE", moves: 1, moveBy: "เสาร์ 14 พ.ย. 10:00",
      times: ["2 พ.ย. 09:12", "2 พ.ย. 09:30", "2 พ.ย. 09:44"],
      ask: "ร้านกาแฟที่เปิดไว้ยอดตกช่วงนี้ อยากรู้ว่าควรขยายสาขาตามแผนเดิมหรือรอก่อนครับ",
      past: [["20 ก.ย. ครั้งแรก", "ไพ่ Three of Wands ธุรกิจโตได้ แต่ให้ดูเรื่องคนก่อนขยาย"]] },
    "SL-0424": { name: "คุณมิว", st: "unpaid", visit: "ครั้งแรก", end: "15:00", via: "LINE", hold: "1:51", moves: 1, moveBy: "เสาร์ 14 พ.ย. 14:00",
      times: ["4 พ.ย. 13:03"],
      ask: "สอบเข้าปริญญาโทรอบหน้า อยากรู้ว่าจะติดไหม และควรเลือกมหาลัยไหนดีคะ", past: [] },

    "SL-0402": { name: "คุณโบว์", st: "due", visit: "ครั้งแรก", day: "อังคาร 3 พ.ย.", end: "21:05", via: "Google Meet", mins: 65, dueBy: "พฤ 5 พ.ย.", dueIn: "30 ชม.",
      times: ["1 พ.ย. 09:12", "1 พ.ย. 09:30", "1 พ.ย. 10:05", "3 พ.ย. 21:05"], sentAt: "4 พ.ย. 14:40",
      draft: "สวัสดีค่ะคุณโบว์ สรุปจากที่คุยกันเมื่อวานนะคะ\n\nเรื่องงาน ไพ่หลักคือ Ace of Pentacles ตามความเชื่อเป็นช่วงเริ่มของใหม่ ถ้าได้ข้อเสนอก่อนสิ้นปี ลองคุยรายละเอียดก่อนตอบ\nเรื่องความรัก ไพ่ Two of Cups ค่อยๆ ทำความรู้จักกันได้ ไม่ต้องรีบ\n\nหินที่เราเลือกให้ตามดวง อยู่ด้านล่างนี้นะคะ ดูได้ตลอดที่หน้าคิวของคุณ",
      offers: [["กำไลไหมทอง 8 มม.", "ตามความเชื่อ ไหมทองเกี่ยวกับงานและโอกาสใหม่", "890 บาท"], ["สูตรหินร้อยเอง 3 ชนิด", "โรสควอตซ์ อเวนจูรีน เรื่องความรัก", ""]],
      next: [["พฤ 5 พ.ย.", "ขอรีวิวทาง LINE", true], ["ภายใน 3 ธ.ค.", "เครดิต 300 บาท ใช้กับกำไลตามดวง เตือนอีกครั้ง 28 พ.ย."]] },
    "SL-0398": { name: "คุณนิว", st: "sent", visit: "ครั้งที่ 2", day: "อาทิตย์ 1 พ.ย.", t: "10:00", end: "11:00", via: "LINE", sentAt: "2 พ.ย. 18:20", sentBy: "ฝั่งร้าน",
      times: ["28 ต.ค. 15:02", "28 ต.ค. 15:20", "28 ต.ค. 15:41", "1 พ.ย. 11:00"],
      draft: "สวัสดีค่ะคุณนิว สรุปจากที่คุยกันวันอาทิตย์นะคะ\n\nเรื่องเรียนต่อ ไพ่ Page of Pentacles ตามความเชื่อเป็นช่วงลงมือเก็บพื้นฐาน ลองเตรียมเอกสารให้เสร็จก่อนสิ้นปี\n\nถ้ามีอะไรอยากถามเพิ่ม ทักเราทาง LINE ได้เลยค่ะ",
      next: [["3 พ.ย.", "ขอรีวิวทาง LINE ลูกค้ารีวิวแล้ว"], ["ภายใน 1 ธ.ค.", "เครดิต 300 บาท ใช้กับกำไลตามดวง เตือนอีกครั้ง 26 พ.ย."]] },
    "SL-0400": { name: "คุณแอน", st: "noshow", visit: "ครั้งแรก", day: "อาทิตย์ 1 พ.ย.", t: "14:00", end: "15:00", via: "LINE",
      times: ["29 ต.ค. 18:40", "29 ต.ค. 19:05", "29 ต.ค. 19:20", "รอ 15 นาที"] },
    "SL-0395": { name: "คุณต้า", st: "sent", visit: "ครั้งแรก", day: "เสาร์ 31 ต.ค.", t: "14:00", end: "15:00", via: "LINE", sentAt: "1 พ.ย. 11:05", sentBy: "ฝั่งผู้อ่าน",
      times: ["27 ต.ค. 10:10", "27 ต.ค. 10:30", "27 ต.ค. 10:52", "31 ต.ค. 15:00"],
      draft: "สวัสดีค่ะคุณต้า สรุปจากที่คุยกันเมื่อวานนะคะ\n\nเรื่องบ้าน ไพ่ Four of Wands ตามความเชื่อเป็นช่วงที่ครอบครัวกลับมาลงตัว ลองชวนคุยเรื่องแผนปีหน้าด้วยกัน\n\nถ้ามีอะไรอยากถามเพิ่ม ทักเราทาง LINE ได้เลยค่ะ",
      next: [["2 พ.ย.", "ขอรีวิวทาง LINE ส่งแล้ว ยังไม่ตอบ"], ["ภายใน 30 พ.ย.", "เครดิต 300 บาท ใช้กับกำไลตามดวง เตือนอีกครั้ง 25 พ.ย."]] },
    "SL-0391": { name: "คุณเฟิร์น", st: "sent", visit: "ครั้งที่ 4", day: "พฤหัส 29 ต.ค.", t: "20:00", end: "21:00", via: "Google Meet", sentAt: "30 ต.ค. 21:40", sentBy: "ฝั่งร้าน",
      times: ["25 ต.ค. 12:00", "25 ต.ค. 12:18", "25 ต.ค. 12:30", "29 ต.ค. 21:00"],
      draft: "สวัสดีค่ะคุณเฟิร์น สรุปจากที่คุยกันเมื่อคืนนะคะ\n\nเรื่องงาน ไพ่ The Star ตามความเชื่อเป็นช่วงที่ความหวังกลับมา โปรเจกต์ใหม่ที่เล่าให้ฟังไปต่อได้ ค่อยๆ ทำไปค่ะ\n\nถ้ามีอะไรอยากถามเพิ่ม ทักเราทาง LINE ได้เลยค่ะ",
      next: [["31 ต.ค.", "ขอรีวิวทาง LINE ลูกค้ารีวิวแล้ว"], ["ภายใน 28 พ.ย.", "เครดิต 300 บาท ใช้กับกำไลตามดวง เตือนอีกครั้ง 23 พ.ย."]] }
  };
  B["SL-0402"].t = "20:00";

  var KEY = "bo-queue-v1";
  var S;
  try { S = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { S = null; }
  if (!S) S = { sel: { next: "SL-0420", past: "SL-0402" }, moved: {}, memo: {}, sent: {}, cancelled: {}, filter: { next: "all", past: "all" }, draft: {}, skip: {} };
  function save() { sessionStorage.setItem(KEY, JSON.stringify(S)); }

  // Apply reschedules saved earlier: { code: { from: "8|14:00", to: "14|14:00" } }
  Object.keys(S.moved).forEach(function (code) {
    var m = S.moved[code];
    NEXT.forEach(function (d) { d.slots.forEach(function (s) {
      if (d.id + "|" + s.t === m.from && s.code === code) delete s.code;
      if (d.id + "|" + s.t === m.to) s.code = code;
    }); });
  });
  if (S.sent["SL-0402"]) B["SL-0402"].st = "sent";

  var CHEV = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5 2.5L9.5 7 5 11.5" fill="none" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var LOCK = '<svg width="12" height="13" viewBox="0 0 12 13" aria-hidden="true"><rect x="1.5" y="5.5" width="9" height="6.5" rx="1.5" fill="none" stroke="#6B7280" stroke-width="1.3"/><path d="M3.8 5.5V3.8a2.2 2.2 0 0 1 4.4 0v1.7" fill="none" stroke="#6B7280" stroke-width="1.3"/></svg>';
  var DOC = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect x="3" y="2" width="12" height="14" rx="2" fill="none" stroke="#111827" stroke-width="1.4"/><path d="M6 6.5h6M6 9.5h6M6 12.5h3.5" fill="none" stroke="#111827" stroke-width="1.4" stroke-linecap="round"/></svg>';
  var SPARK = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1l1.2 3.3L10.5 5.5 7.2 6.7 6 10 4.8 6.7 1.5 5.5 4.8 4.3z" fill="#8A5A2E"/></svg>';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function toast(m) { window.boToast(m); }
  var DAYS = tab === "next" ? NEXT : PAST;
  function live(code) { return code && !S.cancelled[code]; }
  function where(code) {
    for (var i = 0; i < DAYS.length; i++) for (var j = 0; j < DAYS[i].slots.length; j++)
      if (DAYS[i].slots[j].code === code) return { day: DAYS[i], slot: DAYS[i].slots[j] };
  }

  var FILTERS = tab === "next"
    ? [["all", "ทั้งหมด"], ["unpaid", "รอชำระ"], ["slip", "สลิปรอตรวจ", true], ["ok", "ยืนยันแล้ว"]]
    : [["all", "ทั้งหมด"], ["due", "รอส่งสรุป", true], ["sent", "ส่งสรุปแล้ว"], ["noshow", "ไม่มา"]];

  var list = document.querySelector("[data-list]");
  var chips = document.querySelector("[data-chips]");
  var pane = document.querySelector("[data-detail]");
  var mode = "detail"; // detail | move
  var move = null;

  /* ---------- header ---------- */
  if (role === "reader") {
    document.querySelector("[data-title]").textContent = "คิวของฉัน";
    document.querySelector('[data-tab="next"]').href = "my-queue.html";
    document.title = "คิวของฉัน หลังบ้าน Silamani (prototype)";
  }
  document.querySelector('[data-tab="' + tab + '"]').setAttribute("aria-current", "page");
  if (tab === "past") document.querySelector("[data-range]").textContent = "30 วันที่ผ่านมา ส่งสรุปภายใน 48 ชม. หลังดู";

  /* ---------- list ---------- */
  function codes() {
    var out = [];
    DAYS.forEach(function (d) { d.slots.forEach(function (s) { if (live(s.code)) out.push(s.code); }); });
    return out;
  }
  function renderChips() {
    var all = codes();
    var f = S.filter[tab];
    chips.innerHTML = FILTERS.map(function (x) {
      var n = x[0] === "all" ? all.length : all.filter(function (c) { return B[c].st === x[0]; }).length;
      return '<button class="fchip" type="button" data-f="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + x[1] +
        ' <span class="n' + (x[2] && n ? " hot" : "") + '">' + n + "</span></button>";
    }).join("");
  }

  function stHtml(b) {
    if (b.st === "ok") return '<span class="st sage">ยืนยันแล้ว</span>';
    if (b.st === "slip") return '<span class="st"><span class="pill pill-sand">สลิปรอตรวจ</span></span>';
    if (b.st === "unpaid") return '<span class="st"><span class="ttl">รอชำระ</span><span class="cd">ปล่อยคิวใน ' + b.hold + " ชม.</span></span>";
    if (b.st === "due") return '<span class="st"><span class="pill pill-sand">ส่งใน ' + b.dueIn + "</span></span>";
    if (b.st === "sent") return '<span class="st muted w4">ส่งสรุปแล้ว</span>';
    return '<span class="st muted w4">ไม่มา</span>';
  }
  function subLine(b) {
    if (b.st === "ok") return b.visit + " จ่ายแล้ว 990 บาท";
    if (b.st === "slip") return b.visit + " แนบสลิป 990 บาทแล้ว";
    if (b.st === "unpaid") return b.visit + " ล็อกเวลาไว้ให้แล้ว";
    if (b.st === "due") return b.visit + " ดูไป " + b.mins + " นาที";
    if (b.st === "sent") return b.visit + " ส่งเมื่อ " + b.sentAt;
    return b.visit + " รอ 15 นาทีแล้วไม่เข้า";
  }

  function renderList() {
    var f = S.filter[tab];
    var html = DAYS.map(function (d) {
      var rows = d.slots.filter(function (s) {
        if (f === "all") return true;
        return live(s.code) && B[s.code].st === f;
      });
      if (!rows.length) return "";
      var any = d.slots.some(function (s) { return !s.closed; });
      var body = rows.map(function (s) {
        if (s.closed) return '<div class="qslot"><span class="t strike">' + s.t + '</span><span class="txt">ผู้อ่านปิดวันนี้ไว้ ลูกค้าไม่เห็นรอบนี้</span><span class="st"></span></div>';
        if (s.none) return '<div class="qslot"><span class="t muted">' + s.t + '</span><span class="txt">ไม่มีคนจอง</span><span class="st"></span></div>';
        if (!live(s.code)) return '<div class="qslot"><span class="t muted">' + s.t + '</span><span class="txt">ยังว่าง เปิดให้จองอยู่</span><span class="st"></span></div>';
        var b = B[s.code], sel = S.sel[tab] === s.code;
        return '<button class="qslot' + (sel ? " is-sel" : "") + '" type="button" data-code="' + s.code + '"' + (sel ? ' aria-current="true"' : "") + ">" +
          '<span class="t b">' + s.t + '</span>' +
          '<span class="who"><span class="nm">' + b.name + " <span>" + s.code + '</span></span><span class="sub">' + subLine(b) + "</span></span>" +
          stHtml(b) + "</button>";
      }).join("");
      return '<div class="qday"><div class="lbl"><span class="wd' + (d.soon ? " soon" : "") + '">' + d.wd + '</span><span class="dn' + (any ? "" : " off") + '">' + d.dn + "</span></div>" +
        '<div class="slots">' + body + "</div></div>";
    }).join("");
    list.innerHTML = html || '<p class="qempty">ไม่มีคิวในกลุ่มนี้</p>';
  }

  chips.addEventListener("click", function (e) {
    var c = e.target.closest("[data-f]");
    if (!c) return;
    S.filter[tab] = c.dataset.f; save(); renderChips(); renderList();
  });
  list.addEventListener("click", function (e) {
    var r = e.target.closest("[data-code]");
    if (!r) return;
    keepMemo();
    S.sel[tab] = r.dataset.code; mode = "detail"; save(); renderList(); renderDetail();
  });

  /* ---------- detail ---------- */
  function head(title, sub) {
    return '<div class="qd-head"><div><h2 class="h-sm" id="detail-h">' + title + '</h2><p class="ui muted sub">' + sub + "</p></div>" +
      '<a class="link ui-tight" href="customer.html" style="height:40px">ประวัติลูกค้า ' + CHEV + "</a></div>";
  }
  function step(cls, label, when, last) {
    return '<div class="' + cls + '"><div class="bar"><span class="dot"></span>' + (last ? "" : '<span class="line"></span>') + "</div>" +
      '<div class="lab"><b>' + label + "</b><span>" + when + "</span></div></div>";
  }
  function timeline(code, at) {
    var b = B[code], t = b.times;
    var when = at ? at.day.dn.split(" ")[0] + " " + at.day.full.split(" ").slice(1).join(" ") + " " + at.slot.t : "";
    var s;
    if (b.st === "unpaid") s = [step("now sand", "รอชำระ", t[0]), step("todo", "แนบสลิป", "ปล่อยคิวใน " + b.hold + " ชม."), step("todo", "ยืนยัน", "หลังร้านตรวจสลิป"), step("todo", "ดูดวง", when), step("todo", "ส่งสรุปให้ลูกค้า", "ภายใน 48 ชม. หลังดู", 1)];
    else if (b.st === "slip") s = [step("", "จองแล้ว", t[0]), step("now sand", "สลิปรอตรวจ", t[1]), step("todo", "ยืนยัน", "หลังร้านตรวจสลิป"), step("todo", "ดูดวง", when), step("todo", "ส่งสรุปให้ลูกค้า", "ภายใน 48 ชม. หลังดู", 1)];
    else if (b.st === "ok") s = [step("", "จองแล้ว", t[0]), step("", "แนบสลิป", t[1]), step("now sage", "ยืนยันแล้ว", t[2]), step("todo", "ดูดวง", when), step("todo", "ส่งสรุปให้ลูกค้า", "ภายใน 48 ชม. หลังดู", 1)];
    else if (b.st === "due") s = [step("", "จองแล้ว", t[0]), step("", "แนบสลิป", t[1]), step("", "ยืนยันแล้ว", t[2]), step("", "ดูดวงแล้ว", t[3]), step("now sand", "ส่งสรุป", "ภายใน " + b.dueBy, 1)];
    else if (b.st === "sent") s = [step("", "จองแล้ว", t[0]), step("", "แนบสลิป", t[1]), step("", "ยืนยันแล้ว", t[2]), step("", "ดูดวงแล้ว", t[3]), step("now sage", "ส่งสรุปแล้ว", b.sentAt, 1)];
    else s = [step("", "จองแล้ว", t[0]), step("", "แนบสลิป", t[1]), step("", "ยืนยันแล้ว", t[2]), step("now sand", "ไม่มา", t[3]), step("todo", "ส่งสรุปให้ลูกค้า", "ไม่ต้องส่ง", 1)];
    return '<div class="qd-sec"><h3>ความคืบหน้า</h3><div class="tl">' + s.join("") + "</div></div>";
  }

  function keepMemo() {
    var ta = pane.querySelector("[data-memo]");
    if (ta) { S.memo[ta.dataset.memo] = ta.value; save(); }
  }

  function renderDetail() {
    var all = codes();
    if (all.indexOf(S.sel[tab]) < 0) { S.sel[tab] = all[0] || null; save(); renderList(); }
    var code = S.sel[tab];
    if (!code) { pane.innerHTML = '<div class="empty"><h2 class="h-title" id="detail-h">ยังไม่มีคิว</h2></div>'; return; }
    if (tab === "next") return mode === "move" ? renderMove(code) : renderNext(code);
    renderPast(code);
  }

  function renderNext(code) {
    var b = B[code], at = where(code);
    var memo = S.memo[code] != null ? S.memo[code] : (b.memo || "");
    var past = b.past.length ? '<div class="past"><div class="cap">ครั้งก่อนๆ</div>' + b.past.map(function (p) {
      return '<div><span class="d">' + p[0] + '</span><span class="x">' + p[1] + "</span></div>";
    }).join("") + "</div>" : '<div class="past"><div class="cap">ครั้งก่อนๆ</div><div><span class="x muted">ครั้งแรกที่ดูกับเรา</span></div></div>';
    var left = S.moved[code] && S.moved[code].byCustomer ? 0 : b.moves;
    var foot = left ? "ลูกค้าเลื่อนได้อีก " + left + " ครั้ง<br>ถึง" + b.moveBy : "ลูกค้าใช้สิทธิ์เลื่อนไปแล้ว<br>ร้านยังเลื่อนให้ได้ถ้าจำเป็น";

    pane.innerHTML =
      "<div>" +
        head(b.name, code + " " + at.day.full + " " + at.slot.t + " – " + b.end + " " + (b.via === "LINE" ? "โทรทาง LINE" : "ทาง Google Meet")) +
        timeline(code, at) +
        '<div class="qd-sec"><h3>เรื่องที่อยากถาม</h3><p class="ask-txt">' + b.ask + "</p></div>" +
        '<div class="qd-sec" style="padding-top:28px"><div class="hrow"><h3>บันทึกการดูดวง</h3><span class="lock">' + LOCK + "ลูกค้าจะไม่เห็นบันทึกนี้</span></div>" +
          '<label class="memo"><textarea data-memo="' + code + '" aria-label="บันทึกการดูดวง" placeholder="จดสิ่งที่อยากจำไว้ก่อนหรือหลังดูดวง">' + esc(memo) + "</textarea>" +
          '<span class="foot"><span>จดได้ทั้งก่อนและหลังดูดวง</span><span>ผูกกับ ' + code + "</span></span></label></div>" +
        past +
      "</div>" +
      '<div class="qd-foot"><p class="note-foot">' + foot + "</p>" +
        '<div class="acts">' +
          '<button class="btn-danger" type="button" data-cancel>ร้านยกเลิกคิว</button>' +
          '<button class="btn btn-lg" type="button" data-move>เลื่อนคิว</button>' +
          '<button class="btn-primary" type="button" data-save-memo>บันทึกโน้ต</button>' +
        "</div></div>";
  }

  /* Reschedule: every open slot is a choice; closed days are shown but can't be picked. */
  function renderMove(code) {
    var b = B[code], at = where(code);
    if (!move || move.code !== code) move = { code: code, who: "customer", to: null };
    var rows = [];
    NEXT.forEach(function (d) {
      d.slots.forEach(function (s) {
        if (s.code) return;
        var k = d.id + "|" + s.t;
        var hint = s.closed ? "ผู้อ่านปิดวันนี้ไว้" : (d.id === at.day.id ? "วันเดิม " + (s.t < at.slot.t ? "เช้ากว่าเดิม" : "ช้ากว่าเดิม") : "");
        rows.push({ k: k, d: d, s: s, hint: hint });
      });
    });
    if (!move.to) {
      var first = rows.filter(function (r) { return !r.s.closed && r.d.id !== at.day.id; })[0] || rows.filter(function (r) { return !r.s.closed; })[0];
      move.to = first ? first.k : null;
    }
    var pick = rows.filter(function (r) { return r.k === move.to; })[0];
    function radio(id, t1, t2) {
      var on = move.who === id;
      return '<button class="radio-card" type="button" role="radio" aria-checked="' + on + '" data-who="' + id + '"><span class="rdot"></span><span><span class="t1">' + t1 + '</span><span class="t2">' + t2 + "</span></span></button>";
    }
    var left = S.moved[code] && S.moved[code].byCustomer ? 0 : b.moves;
    pane.innerHTML =
      "<div>" +
        head("เลื่อนคิว" + b.name, code + " เดิม" + at.day.full + " " + at.slot.t + " เลือกเวลาใหม่ที่ยังว่าง") +
        '<div class="qd-sec"><h3>ใครขอเลื่อน</h3><div class="who-pick" role="radiogroup" aria-label="ใครขอเลื่อน">' +
          radio("customer", "ลูกค้าขอ", left ? "ใช้สิทธิ์เลื่อน " + left + " ครั้งของลูกค้า" : "ลูกค้าใช้สิทธิ์ไปแล้ว") +
          radio("shop", "ร้านขอเลื่อนเอง", "ไม่นับสิทธิ์ของลูกค้า") +
        "</div></div>" +
        '<div class="qd-sec" style="padding-top:28px"><div class="hrow"><h3>เวลาที่ว่าง</h3><span class="cap muted">ตั้งแต่พรุ่งนี้ถึงพุธ 18 พ.ย.</span></div>' +
          '<div class="times" role="radiogroup" aria-label="เวลาที่ว่าง">' + rows.map(function (r) {
            return '<button class="time-row" type="button" role="radio" data-to="' + r.k + '" aria-checked="' + (r.k === move.to) + '"' + (r.s.closed ? " disabled" : "") + ">" +
              '<span class="rdot"></span><span class="dd">' + r.d.full + '</span><span class="tt">' + r.s.t + '</span><span class="hint">' + r.hint + "</span></button>";
          }).join("") + "</div>" +
          '<p class="times-note">เวลาที่มีคนจองหรือรอชำระอยู่ไม่ขึ้นที่นี่ ถ้าไม่มีเวลาที่ลูกค้าสะดวก ให้ถามผู้อ่านว่าเปิดรอบเพิ่มได้ไหม</p>' +
        "</div>" +
      "</div>" +
      '<div class="qd-foot"><p class="note-foot">ลูกค้าได้ข้อความทาง LINE<br>ผู้อ่านเห็นเวลาใหม่ทันที</p>' +
        '<div class="acts"><button class="btn btn-lg" type="button" data-move-cancel>ไม่เลื่อนแล้ว</button>' +
        '<button class="btn-primary" type="button" data-move-ok' + (pick && !(move.who === "customer" && !left) ? "" : " disabled") + ">" +
          (pick ? "ย้ายไป" + pick.d.full + " " + pick.s.t : "เลือกเวลาใหม่") + "</button></div></div>";
  }

  function renderPast(code) {
    var b = B[code];
    var sub = code + " " + b.day + " " + b.t + " – " + b.end + " ทาง " + b.via;
    if (b.st === "noshow") {
      pane.innerHTML = "<div>" + head(b.name, sub) + timeline(code) +
        '<div class="qd-sec"><h3>ลูกค้าไม่เข้าห้องภายใน 15 นาที</h3><p class="ask-txt">ผู้อ่านกด "ไม่มา" ตอน 14:15 ตามนโยบาย คิวนี้ไม่คืนเงิน แต่ร้านให้สิทธิ์จองใหม่ในราคาเดิมได้ภายใน 30 วัน</p></div></div>' +
        '<div class="qd-foot"><p class="note-foot">ทักลูกค้าทาง LINE<br>เพื่อเสนอวันใหม่</p><div class="acts">' +
        '<button class="btn btn-lg" type="button" data-todo="ในของจริงจะเปิดแชท LINE กับลูกค้าคนนี้">เปิดแชท LINE</button></div></div>';
      return;
    }
    var offers = b.offers ? '<div class="qd-sec tight"><div class="hrow"><h3>ข้อเสนอที่ส่งไปด้วย</h3>' + (b.st === "due" ? '<button class="u-act" type="button" data-todo="หน้าแก้ข้อเสนอยังไม่ได้ออกแบบ">แก้ข้อเสนอ</button>' : "") + "</div>" +
      '<div class="offers">' + b.offers.map(function (o) {
        return '<div><span class="n">' + o[0] + '</span><span class="why">' + o[1] + '</span><span class="p' + (o[2] ? "" : " muted") + '">' + (o[2] || "ร้อยเอง") + "</span></div>";
      }).join("") + "</div></div>" : "";

    if (b.st === "due") {
      var txt = S.draft[code] != null ? S.draft[code] : b.draft;
      pane.innerHTML = "<div>" + head(b.name, sub) + timeline(code) +
        '<div class="qd-sec tight">' +
          '<div class="src">' + DOC + '<div class="m"><b>ข้อความจากการคุย <span>วางจาก Wispr เมื่อ 21:12 ยาว 58 นาที</span></b><span>เห็นเฉพาะหลังบ้าน ระบบลบเองใน 30 วันหลังส่งสรุป</span></div>' +
            '<button class="u-act" type="button" data-todo="ในของจริงจะเปิดข้อความเต็มจากการคุย">เปิดดู</button></div>' +
          '<div class="hrow" style="padding-top:22px"><h3>สรุปที่จะส่งให้' + b.name + '</h3><button class="u-act" type="button" data-redo>เรียบเรียงใหม่</button></div>' +
          '<div class="draft"><textarea data-draft="' + code + '" aria-label="สรุปที่จะส่ง">' + esc(txt) + "</textarea>" +
            '<div class="foot"><span class="ai-tag">' + SPARK + 'ร่างจาก AI ตรวจและแก้ก่อนส่ง</span><span class="cap muted" data-saved>ร่างเก็บไว้ให้แล้ว 21:32</span></div></div>' +
        "</div>" + offers + "</div>" +
        '<div class="qd-foot"><p class="note-foot">ส่งทาง LINE ของร้าน<br>ส่งแล้วแก้ไม่ได้ แต่ส่งเพิ่มได้</p><div class="acts">' +
          '<button class="btn btn-lg" type="button" data-todo="ในของจริงจะเปิดตัวอย่างข้อความแบบที่ลูกค้าเห็นใน LINE">ดูตัวอย่างใน LINE</button>' +
          '<button class="btn-primary" type="button" data-send>ส่งสรุปและข้อเสนอ</button></div></div>';
      return;
    }

    var shown = b.sentText || (S.draft[code] != null ? S.draft[code] : b.draft);
    if (code === "SL-0402" && S.sent[code]) shown = S.sent[code];
    var by = b.sentBy || (role === "reader" ? "ฝั่งผู้อ่าน" : "ฝั่งร้าน");
    var next = (b.next || []).map(function (n, i) {
      var c = n[2] ? (S.skip[code + i] ? '<span class="c done">ยกเลิกแล้ว</span>' : '<button class="c" type="button" data-skip="' + code + i + '">ยกเลิกได้</button>') : "";
      return '<div><span class="d">' + n[0] + '</span><span class="x">' + n[1] + "</span>" + c + "</div>";
    }).join("");
    pane.innerHTML = "<div>" + head(b.name, sub) + timeline(code) +
      '<div class="qd-sec"><div class="hrow"><h3>สรุปที่ส่งให้' + b.name + 'แล้ว</h3><span class="cap muted">ส่งทาง LINE ' + b.sentAt + " " + by + "กด</span></div>" +
        '<div class="sent"><p>' + esc(shown) + "</p></div></div>" +
      (next ? '<div class="next"><h3 class="h-group">ต่อจากนี้ระบบทำให้เอง</h3>' + next + "</div>" : "") +
      "</div>" +
      '<div class="qd-foot"><p class="note-foot">อยากบอกอะไรเพิ่ม ส่งต่อท้ายได้<br>ลูกค้าเห็นเป็นข้อความใหม่ใน LINE</p><div class="acts">' +
      '<button class="btn btn-lg" type="button" data-todo="หน้าส่งข้อความเพิ่มยังไม่ได้ออกแบบ">ส่งข้อความเพิ่ม</button></div></div>';
  }

  /* ---------- actions ---------- */
  pane.addEventListener("input", function (e) {
    if (e.target.matches("[data-draft]")) {
      S.draft[e.target.dataset.draft] = e.target.value; save();
      var s = pane.querySelector("[data-saved]");
      if (s) s.textContent = "แก้แล้ว เก็บร่างไว้ให้";
    }
  });
  pane.addEventListener("click", function (e) {
    var t = e.target;
    if (t.closest("[data-save-memo]")) {
      keepMemo();
      toast("บันทึกโน้ตแล้ว ลูกค้าไม่เห็นโน้ตนี้");
      return;
    }
    if (t.closest("[data-cancel]")) {
      toast("หน้าร้านยกเลิกคิวยังไม่ได้ออกแบบ ในของจริงลูกค้าเลือกได้ว่าจะเลื่อนหรือรับเงินคืนเต็มจำนวน");
      return;
    }
    if (t.closest("[data-move]")) { keepMemo(); mode = "move"; move = null; renderDetail(); return; }
    if (t.closest("[data-move-cancel]")) { mode = "detail"; renderDetail(); return; }
    var who = t.closest("[data-who]");
    if (who) { move.who = who.dataset.who; renderDetail(); return; }
    var to = t.closest("[data-to]");
    if (to && !to.disabled) { move.to = to.dataset.to; renderDetail(); return; }
    if (t.closest("[data-move-ok]")) {
      var code = move.code, at = where(code), k = move.to.split("|");
      var nd = NEXT.filter(function (d) { return d.id === k[0]; })[0];
      var prev = S.moved[code];
      S.moved[code] = { from: prev ? prev.from : at.day.id + "|" + at.slot.t, to: move.to, byCustomer: move.who === "customer" || !!(prev && prev.byCustomer) };
      delete at.slot.code;
      nd.slots.forEach(function (s) { if (s.t === k[1]) s.code = code; });
      save(); mode = "detail";
      renderChips(); renderList(); renderDetail();
      toast("ย้ายคิว" + B[code].name + "ไป" + nd.full + " " + k[1] + " แล้ว ลูกค้าได้ข้อความทาง LINE");
      return;
    }
    if (t.closest("[data-redo]")) {
      var ta = pane.querySelector("[data-draft]");
      ta.value = B[S.sel.past].draft; delete S.draft[S.sel.past]; save();
      pane.querySelector("[data-saved]").textContent = "เรียบเรียงใหม่แล้ว 21:33";
      toast("AI เรียบเรียงใหม่จากข้อความการคุยแล้ว ตรวจอีกครั้งก่อนส่ง");
      return;
    }
    if (t.closest("[data-send]")) {
      var c = S.sel.past, v = pane.querySelector("[data-draft]").value.trim();
      if (!v) { pane.querySelector("[data-draft]").focus(); return; }
      S.sent[c] = v; B[c].st = "sent"; save();
      renderChips(); renderList(); renderDetail();
      toast("ส่งสรุปและข้อเสนอให้" + B[c].name + "ทาง LINE แล้ว");
      return;
    }
    var sk = t.closest("[data-skip]");
    if (sk) { S.skip[sk.dataset.skip] = true; save(); renderDetail(); toast("ยกเลิกการขอรีวิวคิวนี้แล้ว"); }
  });

  renderChips(); renderList(); renderDetail();
  var flash = sessionStorage.getItem("bo-queue-flash");
  if (flash) { sessionStorage.removeItem("bo-queue-flash"); toast(flash); }
})();
