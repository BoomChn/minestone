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
    { id: "15", wd: "อาทิตย์", dn: "อา 15", full: "อาทิตย์ 15 พ.ย.", slots: [{ t: "10:00", code: "SL-0419" }, { t: "14:00", code: "SL-0424" }] },
    { id: "17", wd: "อังคาร", dn: "อ 17", full: "อังคาร 17 พ.ย.", slots: [{ t: "20:00" }] }
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
  if (!S.notes) S.notes = {};
  if (!S.past) S.past = {};
  if (!S.sc) S.sc = {}; // shop cancellations: { code: { st: cxl|refund|refunded|moved, reason, reopen, from, at, log, acct, slip, msg, refundAt } }
  var pastEdit = null, pastDel = null; // { code, i, text? }
  function save() { sessionStorage.setItem(KEY, JSON.stringify(S)); }
  // Note being written: { code, i } where i is a saved note's index or "new"; askDel = index waiting for delete confirm.
  var edit = null, askDel = null;

  // Apply reschedules saved earlier: { code: { from: "8|14:00", to: "14|14:00" } }
  Object.keys(S.moved).forEach(function (code) {
    var m = S.moved[code];
    NEXT.forEach(function (d) { d.slots.forEach(function (s) {
      if (d.id + "|" + s.t === m.from && s.code === code) delete s.code;
      if (d.id + "|" + s.t === m.to) s.code = code;
    }); });
  });
  if (S.sent["SL-0402"]) B["SL-0402"].st = "sent";
  var CXL = { cxl: 1, refund: 1, refunded: 1 };
  applyCancels();

  /* ---------- shop cancels a booking (Paper row "Flow — แถวร้านยกเลิกคิว") ----------
     cxl = ร้านยกเลิก รอลูกค้าเลือก, refund = รอโอนคืน, refunded = คืนเงินแล้ว, moved = rescheduled after a shop cancel.
     SL-0420 also talks to the customer page (status.html?k=cancel) through localStorage "ms-shopcancel". */
  function applyCancels() {
    Object.keys(S.sc).forEach(function (code) {
      var x = S.sc[code];
      B[code].st = x.st === "moved" ? "ok" : x.st;
      if (x.st === "moved" && !x.reopen) {
        var k = x.from.split("|");
        NEXT.forEach(function (d) { if (d.id === k[0]) d.slots.forEach(function (s) {
          if (s.t === k[1] && !s.code) { s.closed = true; s.note = "ปิดไว้หลังร้านยกเลิก " + code + " ลูกค้าไม่เห็นรอบนี้"; }
        }); });
      }
    });
  }
  var CUST = "ms-shopcancel", LINKED = "SL-0420";
  function custRead() { try { return JSON.parse(localStorage.getItem(CUST)); } catch (e) { return null; } }
  function custWrite(code, o) { if (code !== LINKED) return; try { localStorage.setItem(CUST, JSON.stringify(Object.assign({ code: code }, o))); } catch (e) {} }
  function nowStamp() {
    var d = new Date();
    return "พฤ 5 พ.ย. " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  var BY = "โดยฝั่งร้าน shop@silamani.co";
  function logAdd(code, html) { S.sc[code].log.unshift([nowStamp(), html]); }
  function mask(no) {
    var d = String(no).replace(/\D/g, "");
    if (d.length === 10 && d[0] === "0") return d.slice(0, 3) + "-xxx-" + d.slice(6);
    return "xxx-x-x" + d.slice(-4);
  }
  function sampleAcct(code) {
    return code === LINKED ? { via: "พร้อมเพย์", no: "081-234-5678", name: "ฟ้าใส มีสุข" }
      : { via: "พร้อมเพย์", no: "089-555-0142", name: B[code].name.replace("คุณ", "") + " ใจดี" };
  }
  function cancelMsg(code) {
    var b = B[code], at = where(code);
    return b.name + " ขอโทษจริงๆ ค่ะ เราต้องขอยกเลิกคิวดูดวงวัน" + at.day.full + " " + at.slot.t + " (" + code + ") เพราะมีเหตุจำเป็นฝั่งร้าน\n\n" +
      b.name + "เลือกได้ 2 ทาง เลื่อนไปเวลาใหม่โดยเลือกรอบได้ก่อนคนอื่น หรือรับเงินคืนเต็มจำนวน 990 บาท กดเลือกข้างล่างหรือพิมพ์บอกเราในแชทนี้ได้เลยค่ะ";
  }
  function refundMsg(code) {
    var b = B[code], a = S.sc[code].acct;
    return b.name + " เราโอนเงินคืน 990 บาท เข้า" + a.via + " " + mask(a.no) + " แล้วนะคะ สลิปอยู่ด้านล่างนี้\n\n" +
      "ขอโทษอีกครั้งที่ต้องยกเลิกคิวกะทันหัน ทำให้" + b.name + "ต้องเสียเวลารอ วันไหนอยากกลับมาดูดวงอีก เราจด" +
      (b.past.length ? "เรื่องที่" + b.name + "เคยถามไว้แล้ว ไม่ต้องเล่าใหม่ตั้งแต่ต้น" : "เรื่องที่" + b.name + "อยากถามไว้แล้ว ไม่ต้องเล่าใหม่ตั้งแต่ต้น") +
      " ทักมาหรือจองรอบใหม่ได้เลยค่ะ";
  }
  // Customer chose on their own page (another tab, same browser).
  function syncCustomer() {
    if (tab !== "next") return false;
    var r = custRead(), x = S.sc[LINKED];
    if (!r || r.code !== LINKED || !x || x.st !== "cxl") return false;
    if (r.step === "moved" && r.to) {
      doMove(LINKED, r.to, "shop", "ลูกค้าเลือกเวลาใหม่เองในหน้าคิวของคุณ");
      return true;
    }
    if (r.step === "refund" && r.acct) {
      x.st = "refund"; x.acct = r.acct; B[LINKED].st = "refund";
      logAdd(LINKED, "ลูกค้าขอเงินคืน กรอก" + r.acct.via + "แล้ว สถานะเป็นรอโอนคืน");
      save();
      return true;
    }
    return false;
  }
  function doMove(code, toKey, who, logText) {
    var at = where(code), k = toKey.split("|");
    var nd = NEXT.filter(function (d) { return d.id === k[0]; })[0];
    var prev = S.moved[code], x = S.sc[code];
    S.moved[code] = { from: prev ? prev.from : at.day.id + "|" + at.slot.t, to: toKey, byCustomer: who === "customer" || !!(prev && prev.byCustomer) };
    delete at.slot.code;
    nd.slots.forEach(function (s) { if (s.t === k[1]) s.code = code; });
    if (x && CXL[x.st]) {
      x.st = "moved"; B[code].st = "ok";
      logAdd(code, (logText || "ร้านย้ายให้ตามที่ลูกค้าบอกในแชท") + " ไป" + nd.full + " " + k[1] + (who === "shop" ? " ไม่นับสิทธิ์เลื่อนของลูกค้า" : ""));
      custWrite(code, { step: "moved", to: toKey, day: nd.full, t: k[1] });
      applyCancels();
    }
    save();
    return nd;
  }

  var CHEV = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5 2.5L9.5 7 5 11.5" fill="none" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var LOCK = '<svg width="12" height="13" viewBox="0 0 12 13" aria-hidden="true"><rect x="1.5" y="5.5" width="9" height="6.5" rx="1.5" fill="none" stroke="#6B7280" stroke-width="1.3"/><path d="M3.8 5.5V3.8a2.2 2.2 0 0 1 4.4 0v1.7" fill="none" stroke="#6B7280" stroke-width="1.3"/></svg>';
  var DOC = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect x="3" y="2" width="12" height="14" rx="2" fill="none" stroke="#111827" stroke-width="1.4"/><path d="M6 6.5h6M6 9.5h6M6 12.5h3.5" fill="none" stroke="#111827" stroke-width="1.4" stroke-linecap="round"/></svg>';
  var PEN = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M9.6 2.2l2.2 2.2-7.3 7.3-2.8.6.6-2.8 7.3-7.3z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  var BIN = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 4h9M5.5 4V2.6h3V4M3.6 4l.6 7.6h5.6l.6-7.6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  var PLUS = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 2.5v9M2.5 7h9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  var SPARK ='<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1l1.2 3.3L10.5 5.5 7.2 6.7 6 10 4.8 6.7 1.5 5.5 4.8 4.3z" fill="#8A5A2E"/></svg>';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function toast(m) { window.boToast(m); }
  var DAYS = tab === "next" ? NEXT : PAST;
  function live(code) { return code && !S.cancelled[code]; }
  function where(code) {
    for (var i = 0; i < DAYS.length; i++) for (var j = 0; j < DAYS[i].slots.length; j++)
      if (DAYS[i].slots[j].code === code) return { day: DAYS[i], slot: DAYS[i].slots[j] };
  }

  var FILTERS = tab === "next"
    ? [["all", "ทั้งหมด"], ["unpaid", "รอชำระ"], ["slip", "สลิปรอตรวจ", true], ["refund", "รอโอนคืน", true], ["ok", "ยืนยันแล้ว"]]
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
    if (b.st === "cxl") return '<span class="st sand-ink">รอลูกค้าเลือก</span>';
    if (b.st === "refund") return '<span class="st"><span class="pill pill-sand">รอโอนคืน</span></span>';
    if (b.st === "refunded") return '<span class="st muted w4">คืนเงินแล้ว</span>';
    if (b.st === "ok") return '<span class="st sage">ยืนยันแล้ว</span>';
    if (b.st === "slip") return '<span class="st"><span class="pill pill-sand">สลิปรอตรวจ</span></span>';
    if (b.st === "unpaid") return '<span class="st"><span class="ttl">รอชำระ</span><span class="cd">ปล่อยคิวใน ' + b.hold + " ชม.</span></span>";
    if (b.st === "due") return '<span class="st"><span class="pill pill-sand">ส่งใน ' + b.dueIn + "</span></span>";
    if (b.st === "sent") return '<span class="st muted w4">ส่งสรุปแล้ว</span>';
    return '<span class="st muted w4">ไม่มา</span>';
  }
  function subLine(b) {
    if (b.st === "cxl") return "ร้านยกเลิก จ่ายแล้ว 990 บาท";
    if (b.st === "refund") return "ร้านยกเลิก ลูกค้ากรอกบัญชีแล้ว";
    if (b.st === "refunded") return "ร้านยกเลิก โอนคืน 990 บาทแล้ว";
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
        if (s.closed) return '<div class="qslot"><span class="t strike">' + s.t + '</span><span class="txt">' + (s.note || "ผู้อ่านปิดวันนี้ไว้ ลูกค้าไม่เห็นรอบนี้") + '</span><span class="st"></span></div>';
        if (s.none) return '<div class="qslot"><span class="t muted">' + s.t + '</span><span class="txt">ไม่มีคนจอง</span><span class="st"></span></div>';
        if (!live(s.code)) return '<div class="qslot"><span class="t muted">' + s.t + '</span><span class="txt">ยังว่าง เปิดให้จองอยู่</span><span class="st"></span></div>';
        var b = B[s.code], sel = S.sel[tab] === s.code;
        return '<button class="qslot' + (sel ? " is-sel" : "") + '" type="button" data-code="' + s.code + '"' + (sel ? ' aria-current="true"' : "") + ">" +
          '<span class="t ' + (CXL[b.st] ? "strike" : "b") + '">' + s.t + '</span>' +
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
    askDel = null; pastEdit = null; pastDel = null;
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

  // Keep what is typed: a new note's text stays as a draft, an edit in progress stays in `edit`.
  function keepMemo() {
    var ta = pane.querySelector("[data-memo]");
    if (!ta) return;
    if (edit && edit.code === ta.dataset.memo && edit.i !== "new") edit.text = ta.value;
    else { S.memo[ta.dataset.memo] = ta.value; save(); }
  }
  function notesOf(code) { return S.notes[code] || (S.notes[code] = []); }
  function editingIn(code) {
    if (edit && edit.code === code) return edit.i;
    return notesOf(code).length ? null : "new";
  }
  function stamp() {
    var d = new Date();
    return "4 พ.ย. " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  /* Saved notes read as plain records with edit/delete; only one note is open for writing at a time. */
  function notesBlock(code, draft) {
    var list = notesOf(code), open = editingIn(code), cancellable = list.length > 0;
    function editor(text) {
      return '<label class="memo"><textarea data-memo="' + code + '" aria-label="บันทึกการดูดวง" placeholder="จดสิ่งที่อยากจำไว้ก่อนหรือหลังดูดวง">' + esc(text) + "</textarea>" +
        '<span class="foot">' + (cancellable ? '<button class="u-act" type="button" data-memo-cancel>ยกเลิก</button>' : "<span>จดได้ทั้งก่อนและหลังดูดวง</span>") +
        "<span>ผูกกับ " + code + "</span></span></label>";
    }
    var rows = list.map(function (n, i) {
      if (open === i) return editor(edit.text != null ? edit.text : n.text);
      var acts = askDel === i
        ? '<span class="n-ask">ลบบันทึกนี้?</span><button class="n-act" type="button" data-note-keep>ไม่ลบ</button><button class="n-act danger" type="button" data-note-del-ok="' + i + '">ลบเลย</button>'
        : '<button class="n-act" type="button" data-note-edit="' + i + '" aria-label="แก้ไขบันทึก">' + PEN + "แก้ไข</button>" +
          '<button class="n-act danger" type="button" data-note-del="' + i + '" aria-label="ลบบันทึก">' + BIN + "ลบ</button>";
      return '<div class="qnote"><div class="n-meta"><span>' + (n.edited ? "แก้เมื่อ " + n.edited : "บันทึกเมื่อ " + n.at) + '</span><span class="n-acts">' + acts + "</span></div>" +
        '<p class="n-text">' + esc(n.text) + "</p></div>";
    }).join("");
    var tail = open === "new" ? editor(draft) : (open == null ? '<button class="qnote-add" type="button" data-note-add>' + PLUS + "เพิ่มบันทึก</button>" : "");
    return '<div class="qnotes">' + rows + tail + "</div>";
  }

  /* Notes from earlier readings: each row can be edited in place or deleted (with a confirm in the row). */
  function pastOf(code) { return S.past[code] || B[code].past; }
  function pastBlock(code) {
    var list = pastOf(code);
    var cap = '<div class="cap">ครั้งก่อนๆ</div>';
    if (!list.length) {
      var msg = B[code].past.length ? "ไม่มีบันทึกจากครั้งก่อน" : "ครั้งแรกที่ดูกับเรา";
      return '<div class="past">' + cap + '<div><span class="x muted">' + msg + "</span></div></div>";
    }
    return '<div class="past">' + cap + list.map(function (p, i) {
      var body, acts = "";
      if (pastEdit && pastEdit.code === code && pastEdit.i === i) {
        body = '<span class="x"><textarea class="p-edit" data-past-text aria-label="แก้บันทึกครั้ง ' + esc(p[0]) + '" rows="3">' + esc(pastEdit.text != null ? pastEdit.text : p[1]) + "</textarea>" +
          '<span class="p-btns"><button class="n-act" type="button" data-past-cancel>ยกเลิก</button><button class="p-save" type="button" data-past-save>บันทึก</button></span></span>';
      } else if (pastDel && pastDel.code === code && pastDel.i === i) {
        body = '<span class="x">' + esc(p[1]) + '<span class="p-ask"><span>ลบบันทึกครั้งนี้?</span><button class="n-act" type="button" data-past-keep>ไม่ลบ</button>' +
          '<button class="n-act danger" type="button" data-past-del-ok="' + i + '">ลบเลย</button></span></span>';
      } else {
        body = '<span class="x">' + esc(p[1]) + "</span>";
        acts = '<span class="p-acts"><button class="p-icon" type="button" data-past-edit="' + i + '" aria-label="แก้ไขบันทึกครั้ง ' + esc(p[0]) + '" title="แก้ไข">' + PEN + "</button>" +
          '<button class="p-icon danger" type="button" data-past-del="' + i + '" aria-label="ลบบันทึกครั้ง ' + esc(p[0]) + '" title="ลบ">' + BIN + "</button></span>";
      }
      return '<div><span class="d">' + p[0] + "</span>" + body + acts + "</div>";
    }).join("") + "</div>";
  }
  function setPast(code, list) { S.past[code] = list; save(); }

  function renderDetail() {
    var all = codes();
    if (all.indexOf(S.sel[tab]) < 0) { S.sel[tab] = all[0] || null; save(); renderList(); }
    var code = S.sel[tab];
    if (!code) { pane.innerHTML = '<div class="empty"><h2 class="h-title" id="detail-h">ยังไม่มีคิว</h2></div>'; return; }
    if (tab === "next") return mode === "move" ? renderMove(code) : renderNext(code);
    renderPast(code);
  }

  function renderNext(code) {
    if (mode === "cancel") return renderCancel(code);
    var st = B[code].st;
    if (st === "cxl") return renderCxlWait(code);
    if (st === "refund") return renderRefund(code);
    if (st === "refunded") return renderRefunded(code);
    var b = B[code], at = where(code);
    var memo = S.memo[code] != null ? S.memo[code] : (b.memo || "");
    var past = pastBlock(code);
    var left = S.moved[code] && S.moved[code].byCustomer ? 0 : b.moves;
    var foot = left ? "ลูกค้าเลื่อนได้อีก " + left + " ครั้ง<br>ถึง" + b.moveBy : "ลูกค้าใช้สิทธิ์เลื่อนไปแล้ว<br>ร้านยังเลื่อนให้ได้ถ้าจำเป็น";

    pane.innerHTML =
      "<div>" +
        head(b.name, code + " " + at.day.full + " " + at.slot.t + " – " + b.end + " " + (b.via === "LINE" ? "โทรทาง LINE" : "ทาง Google Meet")) +
        timeline(code, at) +
        '<div class="qd-sec"><h3>เรื่องที่อยากถาม</h3><p class="ask-txt">' + b.ask + "</p></div>" +
        '<div class="qd-sec" style="padding-top:28px"><div class="hrow"><h3>บันทึกการดูดวง</h3><span class="lock">' + LOCK + "ลูกค้าจะไม่เห็นบันทึกนี้</span></div>" +
          notesBlock(code, memo) + "</div>" +
        past +
      "</div>" +
      '<div class="qd-foot"><p class="note-foot">' + foot + "</p>" +
        '<div class="acts">' +
          '<button class="btn-danger" type="button" data-cancel>ร้านยกเลิกคิว</button>' +
          '<button class="btn btn-lg" type="button" data-move>เลื่อนคิว</button>' +
          (editingIn(code) != null ? '<button class="btn-primary" type="button" data-save-memo>บันทึกโน้ต</button>' : "") +
        "</div></div>";
  }

  /* ---------- shop-cancel panes ---------- */
  var REASONS = ["ผู้อ่านไม่สบาย", "ผู้อ่านติดธุระ", "ระบบหรืออินเทอร์เน็ตมีปัญหา", "อื่นๆ"];
  var cx = null;      // cancel form being filled: { code, reason, other, reopen, msg, editing }
  var msgEdit = false; // refund message open for editing
  var CLOCK = '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 6v4.2l2.6 1.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  var CHECK = '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6.8 10.2l2.2 2.2 4.2-4.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CHIP_R = '<svg width="16" height="16" viewBox="0 0 14 14" aria-hidden="true"><path d="M5 2.5L9.5 7 5 11.5" fill="none" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var SLIPDOC = '<span class="cx-slipimg" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';

  function lineMsg(body, btns, editable, key, from) {
    return '<div class="cx-line">' +
      (!from ? "" : '<div class="cx-from"><span class="av">S</span>Silamani</div>') +
      (editable ? '<textarea class="cx-bubble edit" data-msg="' + key + '" aria-label="ข้อความที่จะส่ง" rows="7">' + esc(body) + "</textarea>"
        : '<p class="cx-bubble">' + esc(body) + "</p>") +
      '<div class="cx-btns">' + btns.map(function (t) { return "<span>" + t + "</span>"; }).join("") + "</div></div>";
  }
  function logBlock(code) {
    return '<div class="qd-sec"><div class="cx-cap">ประวัติคิวนี้</div><div class="cx-log">' + S.sc[code].log.map(function (l) {
      return '<div><span class="d">' + l[0] + '</span><span class="x">' + l[1] + "</span></div>";
    }).join("") + "</div></div>";
  }
  function box(kind, icon, title, lines) {
    return '<div class="qd-sec"><div class="cx-box ' + kind + '">' + icon + "<div><b>" + title + "</b><p>" + lines + "</p></div></div></div>";
  }

  function renderCancel(code) {
    var b = B[code], at = where(code);
    if (!cx || cx.code !== code) cx = { code: code, reason: REASONS[0], other: "", reopen: false, msg: cancelMsg(code), editing: false };
    var chipsHtml = REASONS.map(function (r) {
      return '<button class="cx-chip" type="button" role="radio" aria-checked="' + (cx.reason === r) + '" data-reason="' + r + '">' + r + "</button>";
    }).join("");
    pane.innerHTML =
      "<div>" +
        head("ยกเลิกคิว" + b.name, code + " " + at.day.full + " " + at.slot.t + " จ่ายแล้ว 990 บาท") +
        '<div class="qd-sec"><div class="hrow"><h3>ทำไมต้องยกเลิก</h3><span class="lock">' + LOCK + "ลูกค้าไม่เห็นเหตุผลนี้</span></div>" +
          '<div class="cx-chips" role="radiogroup" aria-label="เหตุผลที่ยกเลิก">' + chipsHtml + "</div>" +
          (cx.reason === "อื่นๆ" ? '<input class="cx-other" data-other type="text" placeholder="บอกสั้นๆ ว่าเกิดอะไรขึ้น เก็บไว้ดูในร้าน" value="' + esc(cx.other) + '">' : "") +
        "</div>" +
        '<div class="qd-sec" style="padding-top:28px"><div class="hrow"><h3>ลูกค้าจะได้ข้อความนี้ทาง LINE</h3><button class="u-act" type="button" data-cx-edit>' + (cx.editing ? "เสร็จแล้ว" : "แก้ข้อความ") + "</button></div>" +
          lineMsg(cx.msg, ["ขอเลื่อนเวลา", "ขอเงินคืน 990 บาท"], cx.editing, "cancel", true) +
        "</div>" +
        '<div class="qd-sec" style="padding-top:28px"><div class="cx-switch"><div><b>เปิดรอบ' + at.day.full + " " + at.slot.t + ' ให้คนอื่นจอง</b>' +
          "<span>" + (cx.reopen ? "เปิดให้คนอื่นจองทันทีที่กดยกเลิก" : "ปิดไว้ก่อน เพราะผู้อ่านไม่ว่างรอบนี้ เปิดคืนทีหลังได้ในหน้าคิวของฉัน") + "</span></div>" +
          '<button class="cx-toggle" type="button" role="switch" aria-checked="' + cx.reopen + '" aria-label="เปิดรอบนี้ให้คนอื่นจอง" data-reopen></button></div></div>' +
      "</div>" +
      '<div class="qd-foot"><p class="note-foot">ระบบบันทึกว่าใครกดและกดเมื่อไร<br>ผู้อ่านได้แจ้งเตือนทันที</p>' +
        '<div class="acts"><button class="btn btn-lg" type="button" data-cx-back>ไม่ยกเลิกแล้ว</button>' +
        '<button class="btn-red" type="button" data-cx-ok>ยกเลิกคิว และส่งข้อความ</button></div></div>';
  }

  function renderCxlWait(code) {
    var b = B[code], at = where(code), x = S.sc[code];
    pane.innerHTML =
      "<div>" +
        head(b.name, code + " " + at.day.full + " " + at.slot.t + " จ่ายแล้ว 990 บาท") +
        box("sand", CLOCK, "ร้านยกเลิกแล้ว รอลูกค้าเลือก", "ส่งข้อความทาง LINE เมื่อ " + x.at + " ลูกค้ายังไม่ตอบ<br>รอบ" + at.day.full + " " + at.slot.t +
          (x.reopen ? " เปิดให้คนอื่นจองแล้ว" : " ปิดไว้ ไม่เปิดให้คนอื่นจอง")) +
        '<div class="qd-sec" style="padding-top:28px"><div class="hrow"><h3>ลูกค้าเลือกทางไหน</h3>' +
          (code === LINKED ? '<a class="u-act" href="../status.html?k=cancel" target="_blank" rel="noopener">ดูหน้าที่ลูกค้าเห็น</a>' : "") + "</div>" +
          '<div class="cx-choices">' +
            '<button class="cx-choice" type="button" data-cx-move><span><b>ขอเลื่อนเวลา</b><span>เลือกรอบใหม่ให้ ไม่นับสิทธิ์เลื่อนของลูกค้า</span></span>' + CHIP_R + "</button>" +
            '<button class="cx-choice" type="button" data-cx-refund><span><b>ขอเงินคืน 990 บาท</b><span>ลูกค้ากรอกบัญชีเองได้ ร้านแนบสลิปโอนคืน</span></span>' + CHIP_R + "</button>" +
          "</div>" +
          '<p class="times-note">ถ้าลูกค้ากดปุ่มในข้อความ LINE ระบบเปลี่ยนให้เอง ถ้าลูกค้าพิมพ์บอกในแชท ให้กดเลือกที่นี่แทน</p>' +
        "</div>" +
        logBlock(code) +
      "</div>" +
      '<div class="qd-foot"><p class="note-foot">คิวนี้ค้างอยู่ในหน้าวันนี้<br>จนกว่าลูกค้าจะเลือก</p>' +
        '<div class="acts"><button class="btn btn-lg" type="button" data-todo="ในของจริงจะเปิดแชท LINE กับลูกค้าคนนี้">ทักลูกค้าทาง LINE</button></div></div>';
  }

  function renderRefund(code) {
    var b = B[code], at = where(code), x = S.sc[code], a = x.acct;
    var msg = x.msg != null ? x.msg : refundMsg(code);
    var slip = x.slip
      ? '<div class="cx-slip">' + SLIPDOC + '<div class="m"><b>' + esc(x.slip.name) + "</b><span>แนบเมื่อ " + x.slip.at + "</span></div>" +
          '<label class="u-act cx-file">เปลี่ยนรูป<input type="file" accept="image/*" data-slip hidden></label></div>'
      : '<label class="cx-attach">' + PLUS + 'แนบสลิปโอนคืน<input type="file" accept="image/*" data-slip hidden></label>' +
        '<button class="u-act cx-sample" type="button" data-slip-sample>ต้นแบบ: ใช้รูปตัวอย่าง</button>';
    pane.innerHTML =
      "<div>" +
        head("คืนเงิน" + b.name + " 990 บาท", code + " รอบ" + at.day.full + " " + at.slot.t + " ลูกค้ากรอกบัญชีแล้ว") +
        '<div class="qd-sec"><div class="hrow"><h3>โอนเข้าบัญชีลูกค้า</h3><span class="cap muted">' + (x.byShop ? "ร้านกรอกแทนจากแชท" : "ลูกค้ากรอกมาจากหน้าคิวของคุณ") + "</span></div>" +
          '<div class="cx-acct">' +
            '<label><span>ชื่อบัญชี</span><input data-acct="name" value="' + esc(a.name) + '"></label>' +
            '<label class="via"><span>ช่องทาง</span><select data-acct="via"><option' + (a.via === "พร้อมเพย์" ? " selected" : "") + ">พร้อมเพย์</option><option" + (a.via !== "พร้อมเพย์" ? " selected" : "") + ">บัญชีธนาคาร</option></select></label>" +
            '<label><span>เบอร์หรือเลขบัญชี</span><input data-acct="no" inputmode="numeric" value="' + esc(a.no) + '"></label>' +
          "</div>" +
          '<p class="times-note">ลูกค้าจ่ายมา 990 บาท เมื่อ ' + b.times[1] + ' <button class="u-act" type="button" data-todo="ในของจริงจะเปิดสลิปที่ลูกค้าจ่ายมา">ดูสลิปที่ลูกค้าจ่าย</button></p>' +
        "</div>" +
        '<div class="qd-sec" style="padding-top:28px"><h3>สลิปโอนคืน</h3><div class="cx-slipwrap">' + slip + "</div>" +
          '<p class="times-note">โอนจากแอปร้านค้าของธนาคารแล้วแคปหน้าจอมาแนบ</p></div>' +
        '<div class="qd-sec" style="padding-top:28px;padding-bottom:28px"><div class="hrow"><h3>ลูกค้าจะได้สลิปพร้อมข้อความนี้ทาง LINE</h3><button class="u-act" type="button" data-refund-edit>' + (msgEdit ? "เสร็จแล้ว" : "แก้ข้อความ") + "</button></div>" +
          lineMsg(msg, ["+ รูปสลิปโอนคืน", "ดูรอบที่ว่าง"], msgEdit, "refund", false) +
        "</div>" +
      "</div>" +
      '<div class="qd-foot"><p class="note-foot">กดแล้วส่งสลิปกับข้อความนี้ทันที<br>ระบบบันทึกว่าใครกดและกดเมื่อไร</p>' +
        '<div class="acts"><button class="btn btn-lg" type="button" data-refund-back>ย้อนกลับ</button>' +
        '<button class="btn-primary" type="button" data-refund-ok' + (x.slip ? "" : ' aria-disabled="true"') + ">โอนคืนแล้ว 990 บาท</button></div></div>";
  }

  function renderRefunded(code) {
    var b = B[code], at = where(code), x = S.sc[code], a = x.acct;
    pane.innerHTML =
      "<div>" +
        head(b.name, code + " " + at.day.full + " " + at.slot.t + " ร้านยกเลิก") +
        box("sage", CHECK, "คืนเงินแล้ว 990 บาท", "โอนเข้า" + a.via + " " + esc(a.no) + " ชื่อ " + esc(a.name) + " เมื่อ " + x.refundAt + "<br>ลูกค้าได้สลิปและข้อความทาง LINE แล้ว") +
        logBlock(code) +
      "</div>" +
      '<div class="qd-foot"><p class="note-foot">คิวนี้จบแล้ว<br>ย้ายไปอยู่แท็บที่ผ่านมา</p>' +
        '<div class="acts"><button class="btn btn-lg" type="button" data-todo="ในของจริงจะเปิดรูปสลิปโอนคืนเต็มจอ">ดูสลิปโอนคืน</button></div></div>';
  }

  /* Reschedule: every open slot is a choice; closed days are shown but can't be picked. */
  function renderMove(code) {
    var b = B[code], at = where(code);
    var shopCxl = b.st === "cxl";
    if (!move || move.code !== code) move = { code: code, who: shopCxl ? "shop" : "customer", to: null };
    var rows = [];
    NEXT.forEach(function (d) {
      d.slots.forEach(function (s) {
        if (s.code) return;
        var k = d.id + "|" + s.t;
        var hint = s.closed ? (s.note ? "ปิดไว้หลังร้านยกเลิก" : "ผู้อ่านปิดวันนี้ไว้") : (d.id === at.day.id ? "วันเดิม " + (s.t < at.slot.t ? "เช้ากว่าเดิม" : "ช้ากว่าเดิม") : "");
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
        head("เลื่อนคิว" + b.name, shopCxl ? code + " ร้านยกเลิกรอบ" + at.day.full + " " + at.slot.t + " ลูกค้าขอเลื่อน" : code + " เดิม" + at.day.full + " " + at.slot.t + " เลือกเวลาใหม่ที่ยังว่าง") +
        '<div class="qd-sec"><h3>ใครขอเลื่อน</h3><div class="who-pick" role="radiogroup" aria-label="ใครขอเลื่อน">' +
          (shopCxl
            ? radio("shop", "ร้านยกเลิกเอง", "ไม่นับสิทธิ์เลื่อนของลูกค้า") + radio("customer", "ลูกค้าขอเอง", left ? "ใช้สิทธิ์เลื่อน " + left + " ครั้งของลูกค้า" : "ลูกค้าใช้สิทธิ์ไปแล้ว")
            : radio("customer", "ลูกค้าขอ", left ? "ใช้สิทธิ์เลื่อน " + left + " ครั้งของลูกค้า" : "ลูกค้าใช้สิทธิ์ไปแล้ว") + radio("shop", "ร้านขอเลื่อนเอง", "ไม่นับสิทธิ์ของลูกค้า")) +
        "</div></div>" +
        '<div class="qd-sec" style="padding-top:28px"><div class="hrow"><h3>เวลาที่ว่าง</h3><span class="cap muted">ตั้งแต่พรุ่งนี้ถึงพุธ 18 พ.ย.</span></div>' +
          '<div class="times" role="radiogroup" aria-label="เวลาที่ว่าง">' + rows.map(function (r) {
            return '<button class="time-row" type="button" role="radio" data-to="' + r.k + '" aria-checked="' + (r.k === move.to) + '"' + (r.s.closed ? " disabled" : "") + ">" +
              '<span class="rdot"></span><span class="dd">' + r.d.full + '</span><span class="tt">' + r.s.t + '</span><span class="hint">' + r.hint + "</span></button>";
          }).join("") + "</div>" +
          '<p class="times-note">เวลาที่มีคนจองหรือรอชำระอยู่ไม่ขึ้นที่นี่ ถ้าไม่มีเวลาที่ลูกค้าสะดวก ให้ถามผู้อ่านว่าเปิดรอบเพิ่มได้ไหม' + (shopCxl ? " หรือเปลี่ยนเป็นคืนเงิน" : "") + "</p>" +
        "</div>" +
      "</div>" +
      '<div class="qd-foot"><p class="note-foot">ลูกค้าได้ข้อความทาง LINE<br>' + (shopCxl ? (move.who === "shop" ? "สิทธิ์เลื่อน 1 ครั้งยังอยู่ครบ" : "ใช้สิทธิ์เลื่อนของลูกค้า 1 ครั้ง") : "ผู้อ่านเห็นเวลาใหม่ทันที") + "</p>" +
        '<div class="acts">' + (shopCxl ? '<button class="btn btn-lg" type="button" data-cx-refund>เปลี่ยนเป็นคืนเงิน</button>' : '<button class="btn btn-lg" type="button" data-move-cancel>ไม่เลื่อนแล้ว</button>') +
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
    var el = e.target;
    if (el.matches("[data-other]") && cx) cx.other = el.value;
    if (el.matches('[data-msg="cancel"]') && cx) cx.msg = el.value;
    if (el.matches('[data-msg="refund"]')) { S.sc[S.sel[tab]].msg = el.value; S.sc[S.sel[tab]].msgTouched = true; save(); }
    if (el.matches("[data-acct]")) {
      var ax = S.sc[S.sel[tab]];
      ax.acct[el.dataset.acct] = el.value;
      if (!ax.msgTouched) delete ax.msg; // the message follows the account until it is edited by hand
      save();
      var pv = pane.querySelector("p.cx-bubble");
      if (pv && !ax.msgTouched) pv.textContent = refundMsg(S.sel[tab]);
    }
    if (e.target.matches("[data-past-text]") && pastEdit) pastEdit.text = e.target.value;
    if (e.target.matches("[data-draft]")) {
      S.draft[e.target.dataset.draft] = e.target.value; save();
      var s = pane.querySelector("[data-saved]");
      if (s) s.textContent = "แก้แล้ว เก็บร่างไว้ให้";
    }
  });
  pane.addEventListener("change", function (e) {
    if (!e.target.matches("[data-slip]") || !e.target.files.length) return;
    S.sc[S.sel[tab]].slip = { name: e.target.files[0].name, at: nowStamp() };
    save(); renderDetail();
  });
  pane.addEventListener("click", function (e) {
    var t = e.target;
    if (t.closest("[data-save-memo]")) {
      var ta0 = pane.querySelector("[data-memo]");
      if (!ta0) return;
      var mc = ta0.dataset.memo, v0 = ta0.value.trim(), open = editingIn(mc);
      if (!v0) { ta0.focus(); toast("พิมพ์บันทึกก่อนกดบันทึก"); return; }
      if (open === "new") { notesOf(mc).push({ text: v0, at: stamp() }); S.memo[mc] = ""; }
      else { var n0 = notesOf(mc)[open]; if (n0.text !== v0) { n0.text = v0; n0.edited = stamp(); } }
      edit = null; askDel = null; save(); renderDetail();
      toast("บันทึกโน้ตแล้ว ลูกค้าไม่เห็นโน้ตนี้");
      return;
    }
    var pe = t.closest("[data-past-edit]");
    if (pe) {
      keepMemo();
      pastEdit = { code: S.sel[tab], i: +pe.dataset.pastEdit }; pastDel = null; renderDetail();
      var pt = pane.querySelector("[data-past-text]"); pt.focus(); pt.setSelectionRange(pt.value.length, pt.value.length);
      return;
    }
    if (t.closest("[data-past-cancel]")) { keepMemo(); pastEdit = null; renderDetail(); return; }
    if (t.closest("[data-past-save]")) {
      var pv = pane.querySelector("[data-past-text]").value.trim();
      if (!pv) { pane.querySelector("[data-past-text]").focus(); toast("ถ้าไม่อยากเก็บบันทึกนี้ ให้กดลบแทน"); return; }
      keepMemo();
      var pl = pastOf(pastEdit.code).slice();
      pl[pastEdit.i] = [pl[pastEdit.i][0], pv];
      setPast(pastEdit.code, pl); pastEdit = null; renderDetail();
      toast("แก้บันทึกครั้งก่อนแล้ว");
      return;
    }
    var pdl = t.closest("[data-past-del]");
    if (pdl) { keepMemo(); pastDel = { code: S.sel[tab], i: +pdl.dataset.pastDel }; pastEdit = null; renderDetail(); return; }
    if (t.closest("[data-past-keep]")) { keepMemo(); pastDel = null; renderDetail(); return; }
    var pdo = t.closest("[data-past-del-ok]");
    if (pdo) {
      keepMemo();
      var pc = S.sel[tab], pl2 = pastOf(pc).slice();
      pl2.splice(+pdo.dataset.pastDelOk, 1);
      setPast(pc, pl2); pastDel = null; renderDetail();
      toast("ลบบันทึกครั้งก่อนแล้ว");
      return;
    }
    if (t.closest("[data-memo-cancel]")) {
      if (editingIn(S.sel[tab]) === "new") { S.memo[S.sel[tab]] = ""; save(); }
      edit = null; renderDetail(); return;
    }
    if (t.closest("[data-note-add]")) {
      edit = { code: S.sel[tab], i: "new" }; askDel = null; renderDetail();
      pane.querySelector("[data-memo]").focus(); return;
    }
    var ne = t.closest("[data-note-edit]");
    if (ne) {
      keepMemo();
      edit = { code: S.sel[tab], i: +ne.dataset.noteEdit }; askDel = null; renderDetail();
      var ta1 = pane.querySelector("[data-memo]"); ta1.focus(); ta1.setSelectionRange(ta1.value.length, ta1.value.length);
      return;
    }
    var nd0 = t.closest("[data-note-del]");
    if (nd0) { keepMemo(); askDel = +nd0.dataset.noteDel; renderDetail(); return; }
    if (t.closest("[data-note-keep]")) { askDel = null; renderDetail(); return; }
    var ndk = t.closest("[data-note-del-ok]");
    if (ndk) {
      var dc = S.sel[tab], di = +ndk.dataset.noteDelOk;
      notesOf(dc).splice(di, 1);
      if (edit && edit.code === dc && typeof edit.i === "number" && edit.i > di) edit.i--;
      askDel = null; save(); renderDetail();
      toast("ลบบันทึกแล้ว");
      return;
    }
    if (t.closest("[data-cancel]")) { keepMemo(); mode = "cancel"; cx = null; renderDetail(); return; }
    var rs = t.closest("[data-reason]");
    if (rs) { cx.reason = rs.dataset.reason; renderDetail(); if (cx.reason === "อื่นๆ") pane.querySelector("[data-other]").focus(); return; }
    if (t.closest("[data-cx-edit]")) { cx.editing = !cx.editing; renderDetail(); if (cx.editing) pane.querySelector("[data-msg]").focus(); return; }
    if (t.closest("[data-reopen]")) { cx.reopen = !cx.reopen; renderDetail(); return; }
    if (t.closest("[data-cx-back]")) { mode = "detail"; cx = null; renderDetail(); return; }
    if (t.closest("[data-cx-ok]")) {
      var cc = cx.code, cat = where(cc), cb = B[cc];
      if (cx.reason === "อื่นๆ" && !cx.other.trim()) { pane.querySelector("[data-other]").focus(); toast("บอกเหตุผลสั้นๆ ก่อน เก็บไว้ดูในร้าน ลูกค้าไม่เห็น"); return; }
      if (!cx.msg.trim()) { toast("ข้อความถึงลูกค้าว่างอยู่"); return; }
      var why = cx.reason === "อื่นๆ" ? cx.other.trim() : cx.reason;
      S.sc[cc] = { st: "cxl", reason: why, reopen: cx.reopen, from: cat.day.id + "|" + cat.slot.t, at: nowStamp(), sentMsg: cx.msg, log: [
        [nowStamp(), '<b class="err">ร้านยกเลิก</b> ' + BY + " เหตุผล " + esc(why) + (cx.reopen ? " เปิดรอบให้คนอื่นจอง" : "")],
        [cb.times[2] || cb.times[0], "ยืนยันสลิป 990 บาท โดยฝั่งร้าน"],
        [cb.times[0], "ลูกค้าจองผ่านเว็บ"]
      ] };
      cb.st = "cxl"; cx = null; mode = "detail";
      custWrite(cc, { step: "choose" });
      save(); renderChips(); renderList(); renderDetail();
      toast("ยกเลิกคิว" + cb.name + "แล้ว ส่งข้อความให้ลูกค้าทาง LINE แล้ว");
      return;
    }
    if (t.closest("[data-cx-move]")) { mode = "move"; move = null; renderDetail(); return; }
    if (t.closest("[data-cx-refund]")) {
      var rc = S.sel[tab], rx = S.sc[rc];
      rx.st = "refund"; rx.acct = sampleAcct(rc); rx.byShop = true; B[rc].st = "refund"; mode = "detail";
      logAdd(rc, "ร้านเลือกเงินคืนแทนลูกค้าตามที่บอกในแชท กรอกบัญชีแล้ว สถานะเป็นรอโอนคืน");
      save(); renderChips(); renderList(); renderDetail();
      toast("ต้นแบบ: ใส่บัญชีตัวอย่างไว้ให้ ในของจริงลูกค้ากรอกเองหรือร้านกรอกจากแชท");
      return;
    }
    if (t.closest("[data-slip-sample]")) {
      S.sc[S.sel[tab]].slip = { name: "สลิป-คืนเงิน-" + S.sel[tab].replace("-", "") + ".jpg", at: nowStamp() };
      save(); renderDetail(); return;
    }
    if (t.closest("[data-refund-edit]")) {
      var ex = S.sc[S.sel[tab]];
      if (!msgEdit && ex.msg == null) ex.msg = refundMsg(S.sel[tab]);
      msgEdit = !msgEdit; save(); renderDetail();
      if (msgEdit) pane.querySelector("[data-msg]").focus();
      return;
    }
    if (t.closest("[data-refund-back]")) {
      var bc = S.sel[tab], bx = S.sc[bc];
      bx.st = "cxl"; delete bx.acct; delete bx.slip; delete bx.msg; delete bx.byShop; B[bc].st = "cxl"; msgEdit = false;
      logAdd(bc, "ร้านย้อนกลับไปรอลูกค้าเลือก");
      if (bc === LINKED) custWrite(bc, { step: "choose" });
      save(); renderChips(); renderList(); renderDetail();
      return;
    }
    if (t.closest("[data-refund-ok]")) {
      var oc = S.sel[tab], ox = S.sc[oc];
      if (!ox.slip) { toast("แนบสลิปโอนคืนก่อน ลูกค้าจะได้สลิปพร้อมข้อความ"); return; }
      if (!/\d{4}/.test(ox.acct.no) || !ox.acct.name.trim()) { toast("ตรวจชื่อบัญชีและเลขบัญชีก่อน"); return; }
      ox.st = "refunded"; ox.refundAt = nowStamp(); B[oc].st = "refunded"; msgEdit = false;
      if (ox.msg == null) ox.msg = refundMsg(oc);
      logAdd(oc, '<b class="sage">โอนคืน 990 บาท</b> ' + BY + " แนบสลิปแล้ว");
      custWrite(oc, { step: "refunded", acct: ox.acct, at: ox.refundAt, msg: ox.msg });
      save(); renderChips(); renderList(); renderDetail();
      toast("ส่งสลิปและข้อความให้" + B[oc].name + "ทาง LINE แล้ว");
      return;
    }
    if (t.closest("[data-move]")) { keepMemo(); mode = "move"; move = null; renderDetail(); return; }
    if (t.closest("[data-move-cancel]")) { mode = "detail"; renderDetail(); return; }
    var who = t.closest("[data-who]");
    if (who) { move.who = who.dataset.who; renderDetail(); return; }
    var to = t.closest("[data-to]");
    if (to && !to.disabled) { move.to = to.dataset.to; renderDetail(); return; }
    if (t.closest("[data-move-ok]")) {
      var code = move.code, k = move.to.split("|");
      var nd = doMove(code, move.to, move.who);
      mode = "detail";
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

  syncCustomer();
  renderChips(); renderList(); renderDetail();
  window.addEventListener("storage", function (e) {
    if (e.key === CUST && syncCustomer()) { renderChips(); renderList(); renderDetail(); toast(B[LINKED].name + "เลือกในหน้าคิวของคุณแล้ว"); }
  });
  var flash = sessionStorage.getItem("bo-queue-flash");
  if (flash) { sessionStorage.removeItem("bo-queue-flash"); toast(flash); }
})();
