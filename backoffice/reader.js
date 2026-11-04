/* ฝั่งผู้อ่าน: คิวของฉัน (my-queue.html) and ปิดวัน (block-day.html). Fake data only.
   State (closed slots, cancelled bookings, added notes) lives in sessionStorage so both pages agree. */
(function () {
  var DAYS = [
    { id: "5", wd: "พรุ่งนี้", soon: true, dn: "พฤ 5", sub: "พฤหัส 5 พ.ย.", full: "พฤหัสบดี 5 พ.ย.",
      slots: [{ t: "20:00", code: "SL-0405" }] },
    { id: "6", wd: "ศุกร์", dn: "ศ 6", sub: "ศุกร์ 6 พ.ย.", full: "ศุกร์ 6 พ.ย.", slots: [] },
    { id: "7", wd: "เสาร์", dn: "ส 7", sub: "เสาร์ 7 พ.ย.", full: "เสาร์ 7 พ.ย.",
      slots: [{ t: "10:00", code: "SL-0412" }, { t: "14:00", code: "SL-0415" }] },
    { id: "8", wd: "อาทิตย์", dn: "อา 8", sub: "อาทิตย์ 8 พ.ย.", full: "อาทิตย์ 8 พ.ย.",
      slots: [{ t: "10:00" }, { t: "14:00", code: "SL-0420" }] },
    { id: "10", wd: "อังคาร", dn: "อ 10", sub: "อังคาร 10 พ.ย.", full: "อังคาร 10 พ.ย.",
      slots: [{ t: "20:00" }] }
  ];

  var BOOKINGS = {
    "SL-0405": {
      name: "คุณจูน", line: "ครั้งที่ 2 เรื่องงานและความรัก", status: "ยืนยันแล้ว", end: "21:00",
      born: "12 มี.ค. 2538", bornAt: "06:40 น.", bornDay: "อาทิตย์",
      ask: "กำลังคิดจะย้ายงานช่วงต้นปีหน้า อยากรู้ว่าจังหวะไหนดี แล้วก็อยากถามเรื่องความรักช่วงนี้ด้วยค่ะ",
      notes: ["14 ก.ย. ครั้งแรก ไพ่เรื่องงานออก The Tower บอกให้รอดูหลังสิ้นปี ครั้งนี้ดูต่อเรื่องจังหวะย้ายงาน"]
    },
    "SL-0412": {
      name: "คุณแพร", line: "ครั้งแรก เรื่องการเงิน", status: "ร้านกำลังตรวจเงิน", wait: true, end: "11:00",
      born: "3 ส.ค. 2541", bornAt: "21:15 น.", bornDay: "จันทร์",
      ask: "ช่วงนี้ใช้เงินเกินตัวบ่อย อยากรู้ว่าปีหน้าการเงินจะดีขึ้นไหม แล้วควรเริ่มเก็บเงินยังไงดีคะ",
      notes: []
    },
    "SL-0415": {
      name: "คุณกาย", line: "ครั้งแรก เรื่องครอบครัว", status: "ยืนยันแล้ว", end: "15:00",
      born: "27 ต.ค. 2533", bornAt: "13:05 น.", bornDay: "เสาร์",
      ask: "แม่กับน้องสาวทะเลาะกันบ่อย ผมอยู่ตรงกลาง อยากรู้ว่าควรวางตัวยังไง และปีหน้าบ้านจะสงบลงไหมครับ",
      notes: []
    },
    "SL-0420": {
      name: "คุณฟ้า", line: "ครั้งที่ 3 เรื่องงาน", status: "ยืนยันแล้ว", end: "15:00",
      born: "11 ม.ค. 2536", bornAt: "09:20 น.", bornDay: "จันทร์",
      ask: "ได้ข้อเสนอให้ไปคุมทีมใหม่ แต่ยังไม่แน่ใจว่าพร้อมไหม อยากรู้ว่ารับเลยดีหรือรอก่อนดีคะ",
      notes: [
        "12 ก.ค. ครั้งแรก ไพ่เรื่องงานออก Eight of Wands งานเริ่มขยับช่วงปลายปี",
        "2 ก.ย. ครั้งที่ 2 หัวหน้าเริ่มเห็นผลงาน ถ้ามีงานใหม่เข้ามาให้ลองรับ ครั้งนี้ดูต่อเรื่องทีมใหม่"
      ]
    }
  };

  var KEY = "bo-reader-v1";
  var state;
  try { state = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { state = null; }
  if (!state) state = { closed: { "10|20:00": true }, cancelled: {}, notes: {}, sel: "SL-0405" };
  function save() { sessionStorage.setItem(KEY, JSON.stringify(state)); }

  var LOCK = '<svg width="12" height="13" viewBox="0 0 12 13" aria-hidden="true"><rect x="1.5" y="5.5" width="9" height="6.5" rx="1.5" fill="none" stroke="#6B7280" stroke-width="1.3"/><path d="M3.5 5.5V4a2.5 2.5 0 015 0v1.5" fill="none" stroke="#6B7280" stroke-width="1.3"/></svg>';
  var CHEV = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5 2.5L9.5 7 5 11.5" fill="none" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ALERT = '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="none" stroke="#9B2C2C" stroke-width="1.5"/><path d="M10 5.5v5.5" fill="none" stroke="#9B2C2C" stroke-width="1.6" stroke-linecap="round"/><circle cx="10" cy="14" r="1" fill="#9B2C2C"/></svg>';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function slotState(day, s) {
    if (state.closed[day.id + "|" + s.t]) return "closed";
    if (s.code && !state.cancelled[s.code]) return "booked";
    return "open";
  }
  function dayById(id) { return DAYS.filter(function (d) { return d.id === id; })[0]; }
  function liveSlots(day) { return day.slots.filter(function (s) { return slotState(day, s) !== "closed"; }); }
  function dayOf(code) {
    for (var i = 0; i < DAYS.length; i++) for (var j = 0; j < DAYS[i].slots.length; j++)
      if (DAYS[i].slots[j].code === code) return { day: DAYS[i], slot: DAYS[i].slots[j] };
  }
  function activeCodes() {
    var out = [];
    DAYS.forEach(function (d) { d.slots.forEach(function (s) { if (slotState(d, s) === "booked") out.push(s.code); }); });
    return out;
  }
  function stColor(b) { return b.wait ? "sand-ink" : "sage"; }

  var mode = document.body.dataset.mode; // "queue" | "block"
  var list = document.querySelector("[data-queue]");
  var pane = document.querySelector("[data-detail]");
  var params = new URLSearchParams(location.search);
  var pickDay = null, picked = {}, wholeDay = false;

  /* ---------- left list (both pages) ---------- */
  function renderList() {
    var confirmed = activeCodes().filter(function (c) { return !BOOKINGS[c].wait; }).length;
    var cnt = document.querySelector("[data-confirmed]");
    if (cnt) cnt.textContent = "7 วันข้างหน้า ยืนยันแล้ว " + confirmed + " คิว";

    list.innerHTML = DAYS.map(function (d) {
      var live = liveSlots(d).length > 0;
      var label = '<span class="wd' + (d.soon ? " soon" : "") + '">' + d.wd + '</span><span class="dn' + (live ? "" : " off") + '">' + d.dn + "</span>";
      var labelEl = mode === "block"
        ? '<button class="day-label" type="button" data-pick="' + d.id + '">' + label + "</button>"
        : (live ? '<a class="day-label" href="block-day.html?day=' + d.id + '" title="ปิดวันนี้">' + label + "</a>"
                : '<div class="day-label">' + label + "</div>");
      var rows = d.slots.length ? d.slots.map(function (s) { return rowHtml(d, s); }).join("")
        : '<div class="slot"><span class="txt">ไม่มีรอบ</span></div>';
      var cls = "day" + (live ? " can-pick" : "") + (mode === "block" && pickDay === d.id ? " is-pick" : "");
      return '<div class="' + cls + '" data-day="' + d.id + '">' + labelEl + '<div class="slots">' + rows + "</div></div>";
    }).join("");
  }

  function rowHtml(d, s) {
    var st = slotState(d, s);
    if (st === "closed") {
      return '<div class="slot"><span class="t strike">' + s.t + '</span><span class="txt">ปิดไว้แล้ว ลูกค้าไม่เห็นรอบนี้</span>' +
        '<button class="reopen" type="button" data-reopen="' + d.id + "|" + s.t + '">เปิดคืน</button></div>';
    }
    if (st === "open") {
      var inner = '<span class="t muted">' + s.t + '</span><span class="txt">ยังว่าง เปิดให้จองอยู่</span>';
      return mode === "block" ? '<div class="slot">' + inner + "</div>"
        : '<a class="slot" href="block-day.html?day=' + d.id + "&slot=" + s.t + '" title="ปิดรอบนี้">' + inner + "</a>";
    }
    var b = BOOKINGS[s.code];
    var body = '<span class="t w6">' + s.t + '</span>' +
      '<span class="who"><span class="ui w6">' + b.name + ' <span class="muted w4">' + s.code + '</span></span><span class="cap muted">' + b.line + "</span></span>" +
      '<span class="st ' + stColor(b) + '">' + b.status + "</span>";
    if (mode === "block") return '<div class="slot">' + body + "</div>";
    var sel = state.sel === s.code;
    return '<button class="slot' + (sel ? " is-sel" : "") + '" type="button" data-code="' + s.code + '"' + (sel ? ' aria-current="true"' : "") + ">" + body + "</button>";
  }

  list.addEventListener("click", function (e) {
    var re = e.target.closest("[data-reopen]");
    if (re) {
      e.stopPropagation();
      var k = re.dataset.reopen.split("|");
      delete state.closed[re.dataset.reopen];
      save();
      window.boToast("เปิดรอบ " + dayById(k[0]).dn + " " + k[1] + " คืนแล้ว ลูกค้าจองได้อีกครั้ง");
      if (mode === "block" && (pickDay === k[0] || !pickDay)) resetPick(k[0]);
      refresh();
      return;
    }
    if (mode === "queue") {
      var r = e.target.closest("[data-code]");
      if (r) { state.sel = r.dataset.code; save(); refresh(); }
      return;
    }
    var day = e.target.closest("[data-day]");
    if (!day) return;
    var d = dayById(day.dataset.day);
    if (!liveSlots(d).length) {
      window.boToast(d.slots.length ? "วัน" + d.full + " ปิดไว้แล้ว" : "วัน" + d.full + " ไม่มีรอบให้ปิด");
      return;
    }
    if (pickDay !== d.id) { resetPick(d.id); refresh(); }
  });

  function refresh() { renderList(); if (mode === "queue") renderDetail(); else renderBlock(); }

  /* ---------- my-queue.html: booking detail ---------- */
  function renderDetail() {
    var codes = activeCodes();
    if (codes.indexOf(state.sel) < 0) { state.sel = codes[0] || null; save(); renderList(); }
    var nav = document.querySelector("[data-block-link]");
    if (!state.sel) {
      nav.href = "block-day.html";
      pane.innerHTML = '<div class="empty"><h2 class="h-title">ยังไม่มีคิวใน 7 วันข้างหน้า</h2><p class="ui muted">คิวที่ร้านยืนยันแล้วจะขึ้นที่นี่</p></div>';
      return;
    }
    var code = state.sel, b = BOOKINGS[code], at = dayOf(code);
    nav.href = "block-day.html?day=" + at.day.id;
    var notes = b.notes.concat(state.notes[code] || []);
    var notesHtml = notes.length ? notes.map(function (n) { return '<p class="note">' + esc(n) + "</p>"; }).join("")
      : '<p class="note muted">ยังไม่มีโน้ต ครั้งแรกที่ดูกับเรา</p>';

    pane.innerHTML =
      '<div>' +
        '<div class="detail-head">' +
          '<div><h2 class="h-sm" id="detail-h">' + b.name + '</h2><p class="ui muted sub">' + code + " " + at.day.sub + " " + at.slot.t + " – " + b.end + ' โทรทาง LINE</p></div>' +
          '<a class="link ui-tight" href="customer.html" style="height:40px">ประวัติลูกค้า ' + CHEV + "</a>" +
        "</div>" +
        '<div class="detail-body">' +
          '<div class="facts">' +
            '<div><span class="cap muted">วันเกิด</span><span class="v num">' + b.born + "</span></div>" +
            '<div><span class="cap muted">เวลาเกิด</span><span class="v num">' + b.bornAt + "</span></div>" +
            '<div><span class="cap muted">เกิดวัน</span><span class="v">' + b.bornDay + "</span></div>" +
          "</div>" +
          '<div class="ask"><h3 class="h-group">เรื่องที่อยากถาม</h3><p>' + b.ask + "</p></div>" +
          '<div class="card notes">' +
            '<div class="notes-head"><h3 class="h-group">โน้ตของฉัน</h3><span class="lock">' + LOCK + "ลูกค้าไม่เห็น</span></div>" +
            notesHtml +
            '<button class="note-add" type="button" data-note-add>เพิ่มโน้ตใหม่</button>' +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div class="detail-foot">' +
        '<p class="note-foot">ปุ่มด้านขวาใช้ได้เมื่อถึงเวลานัด ถ้ารอ 15 นาทีแล้ว<br>ลูกค้าไม่เข้า กด "ไม่มา"' +
          (code === "SL-0405" ? '<br><a class="u-act" href="live.html">ดูหน้าจอตอนถึงเวลานัด (ต้นแบบ)</a>' : "") + "</p>" +
        '<div class="acts">' +
          '<button class="btn btn-lg" type="button" disabled title="ใช้ได้เมื่อถึงเวลานัด">ไม่มา</button>' +
          '<button class="btn-primary" type="button" disabled title="ใช้ได้เมื่อถึงเวลานัด">ดูดวงแล้ว</button>' +
        "</div>" +
      "</div>";
  }

  function wireNotes() {
    pane.addEventListener("click", function (e) {
      if (e.target.closest("[data-note-add]")) {
        var add = e.target.closest("[data-note-add]");
        var form = document.createElement("div");
        form.className = "note-form";
        form.innerHTML = '<textarea aria-label="โน้ตใหม่" placeholder="จดสิ่งที่อยากจำไว้ดูต่อครั้งหน้า"></textarea>' +
          '<div class="acts"><button class="btn" type="button" data-note-save>บันทึกโน้ต</button><button class="cancel" type="button" data-note-cancel>ยกเลิก</button></div>';
        add.replaceWith(form);
        form.querySelector("textarea").focus();
        return;
      }
      if (e.target.closest("[data-note-cancel]")) { renderDetail(); return; }
      if (e.target.closest("[data-note-save]")) {
        var txt = pane.querySelector(".note-form textarea").value.trim();
        if (!txt) { pane.querySelector(".note-form textarea").focus(); return; }
        (state.notes[state.sel] = state.notes[state.sel] || []).push("4 พ.ย. " + txt);
        save();
        renderDetail();
        window.boToast("บันทึกโน้ตแล้ว ลูกค้าไม่เห็นโน้ตนี้");
      }
    });
  }

  /* ---------- block-day.html: pick slots and close ---------- */
  function resetPick(id, onlySlot) {
    pickDay = id; picked = {}; wholeDay = false;
    liveSlots(dayById(id)).forEach(function (s) { if (!onlySlot || onlySlot === s.t) picked[s.t] = true; });
  }

  function renderBlock() {
    var d = dayById(pickDay);
    var live = liveSlots(d);
    var hits = live.filter(function (s) { return picked[s.t] && slotState(d, s) === "booked"; });
    var nPicked = live.filter(function (s) { return picked[s.t]; }).length;
    var n = hits.length;

    var chips = live.map(function (s) {
      return '<button class="chip num" type="button" data-chip="' + s.t + '" aria-pressed="' + !!picked[s.t] + '">' + s.t + "</button>";
    }).join("") + '<button class="chip" type="button" data-whole aria-pressed="' + wholeDay + '">ทั้งวัน</button>';

    var warn = n ? '<div class="warn">' +
        '<div class="warn-top">' + ALERT + '<div><div class="ttl">วันนี้มีคิวอยู่แล้ว ' + n + ' คิว</div>' +
        '<p>ระบบไม่ปิดเงียบๆ ถ้าปิด คิวเหล่านี้เข้าขั้นตอนร้านยกเลิก ลูกค้าเลือกได้ว่าจะเลื่อนไปรอบใหม่โดยได้สิทธิ์จองก่อน หรือรับเงินคืนเต็มจำนวน</p></div></div>' +
        '<div class="warn-list">' + hits.map(function (s) {
          var b = BOOKINGS[s.code];
          return '<div><span class="t num">' + s.t + '</span><span class="n">' + b.name + ' <span class="muted">' + s.code + '</span></span><span class="st ' + stColor(b) + '">' + b.status + "</span></div>";
        }).join("") + "</div></div>" : "";

    var after = n ? (n > 1 ? "ฝั่งร้านทักลูกค้าทั้ง " + n + " คนทาง LINE" : "ฝั่งร้านทักลูกค้าทาง LINE") + " เพื่อถามว่าจะเลื่อนหรือรับเงินคืน คุณไม่ต้องคุยกับลูกค้าเอง"
      : "รอบที่ปิดจะหายจากหน้าจองบนเว็บทันที เปิดคืนได้จากหน้าคิวของฉัน";

    var verb = nPicked && nPicked < live.length ? "ปิด " + nPicked + " รอบ" : "ปิดวัน";
    var label = n ? verb + " และยกเลิก " + n + " คิว" : verb;

    pane.innerHTML =
      '<div>' +
        '<div class="detail-head"><div><h2 class="h-sm" id="detail-h">ปิดวัน' + d.full + '</h2><p class="ui muted sub">ลูกค้าจะไม่เห็นรอบของวันนี้บนเว็บ</p></div></div>' +
        '<div class="detail-body">' +
          '<div class="blk-sec"><h3 class="h-group">รอบที่จะปิด</h3><div class="chips">' + chips + "</div></div>" +
          warn +
          '<div class="after"><h3 class="h-group">หลังกดปิด</h3><p>' + after + "</p></div>" +
        "</div>" +
      "</div>" +
      '<div class="detail-foot">' +
        '<p class="note-foot">ระบบบันทึกว่าใครกดและกด<br>เมื่อไร ฝั่งร้านได้แจ้งเตือนทันที</p>' +
        '<div class="acts">' +
          '<a class="btn btn-lg ink" href="my-queue.html">ไม่ปิดแล้ว</a>' +
          '<button class="btn-primary" type="button" data-close' + (nPicked ? "" : ' disabled title="เลือกรอบที่จะปิดก่อน"') + ">" + label + "</button>" +
        "</div>" +
      "</div>";
  }

  function wireBlock() {
    pane.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-chip]");
      if (chip) { picked[chip.dataset.chip] = !picked[chip.dataset.chip]; wholeDay = false; renderBlock(); return; }
      if (e.target.closest("[data-whole]")) {
        wholeDay = !wholeDay;
        if (wholeDay) liveSlots(dayById(pickDay)).forEach(function (s) { picked[s.t] = true; });
        renderBlock();
        return;
      }
      if (e.target.closest("[data-close]")) {
        var d = dayById(pickDay), n = 0;
        liveSlots(d).forEach(function (s) {
          if (!picked[s.t]) return;
          if (slotState(d, s) === "booked") { state.cancelled[s.code] = true; n++; }
          state.closed[d.id + "|" + s.t] = true;
        });
        save();
        sessionStorage.setItem("bo-reader-flash", "ปิดวัน" + d.full + " แล้ว" + (n ? " ฝั่งร้านได้แจ้งเตือนให้ทักลูกค้า " + n + " คน" : ""));
        location.href = "my-queue.html";
      }
    });
    document.querySelector("[data-block-hint]").addEventListener("click", function () {
      window.boToast("กดวันที่มีคิวในรายการ แล้วเลือกรอบที่จะปิด");
    });
  }

  /* ---------- boot ---------- */
  if (mode === "block") {
    wireBlock();
    var want = dayById(params.get("day") || "7");
    if (!want || !liveSlots(want).length) want = DAYS.filter(function (d) { return liveSlots(d).length; })[0];
    if (!want) {
      renderList();
      pane.innerHTML = '<div class="empty"><h2 class="h-title" id="detail-h">ไม่มีรอบให้ปิดแล้ว</h2><p class="ui muted">ทุกรอบใน 7 วันข้างหน้าปิดไว้แล้ว เปิดคืนได้จากรายการทางซ้าย</p></div>';
      return;
    }
    resetPick(want.id, params.get("slot"));
    if (!Object.keys(picked).length) resetPick(want.id);
  } else {
    wireNotes();
  }
  refresh();

  var flash = sessionStorage.getItem("bo-reader-flash");
  if (flash) { sessionStorage.removeItem("bo-reader-flash"); window.boToast(flash); }
})();
