/* วันนี้ / อาจเป็นคนเดียวกัน: compare two profiles, pick conflicting fields, merge or keep apart.
   Built from the Paper row "รวมลูกค้าที่อาจเป็นคนเดียวกัน". Fake data only; nothing is saved. */
(function () {
  var pane = document.querySelector("[data-merge]");
  var slipPane = document.querySelector("[data-detail]");
  var row = document.querySelector("[data-merge-row]");
  var group = document.querySelector('[data-group="merge"]');
  if (!pane || !row) return;

  var A = { name: "คุณนุ่น", nick: "นุ่น", initial: "น", src: "LINE จองบนเว็บ" };
  var B = { name: "Noon.p", nick: "Noon.p", initial: "N", src: "IG ร้านกรอกจากแชท" };
  var pick = "a";
  var asked = false;

  var CHECK = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#2E6A5C"/><path d="M4.6 8.2l2.2 2.2 4.6-4.8" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var TICK = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2l2.2 2.2 4.8-5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function head(title, sub) {
    return '<div class="detail-head"><div><h2 class="h-sm" tabindex="-1" data-focus>' + title + '</h2><p class="ui muted">' + sub + "</p></div></div>";
  }
  function foot(note, acts) {
    return '<div class="detail-foot"><p class="note cap muted" style="line-height:20px">' + note + '</p><div class="acts">' + acts + "</div></div>";
  }
  function cmp(label, a, b, kind) {
    var mark = kind === "same" ? CHECK : kind === "diff" ? '<span class="m-dot" aria-hidden="true"></span>' : '<span class="m-gap" aria-hidden="true"></span>';
    var cls = kind === "same" ? " is-same" : kind === "diff" ? " is-diff" : "";
    var aria = kind === "same" ? " (ตรงกัน)" : kind === "diff" ? " (ต่างกัน)" : "";
    function v(x) { return x ? '<span class="m-v">' + x + "</span>" : '<span class="m-v muted">ไม่มี</span>'; }
    return '<div class="m-row' + cls + '"><span class="m-k">' + mark + "<span>" + label + '<span class="sr">' + aria + "</span></span></span>" + v(a) + v(b) + "</div>";
  }
  function kv(k, v) { return '<div class="m-kv"><span class="m-k2 ui muted">' + k + '</span><span class="ui">' + v + "</span></div>"; }
  function person(p, tone) {
    return '<span class="m-who"><span class="m-av' + (tone ? " " + tone : "") + '">' + p.initial + '</span><span><span class="m-name">' + p.name + '</span><span class="cap muted">' + p.src + "</span></span></span>";
  }

  var views = {
    compare: function () {
      return "<div>" + head("อาจเป็นคนเดียวกัน", "คุณนุ่น กับ Noon.p ใช้เบอร์โทรเดียวกัน ระบบเจอเมื่อ 3 พ.ย. 16:20 น.") +
        '<div class="m-body">' +
          '<div class="m-table" role="table" aria-label="เทียบข้อมูลสองคน">' +
            '<div class="m-row m-heads"><span class="m-k cap muted"><span class="m-gap"></span>ข้อมูล</span>' + person(A, "sage") + person(B) + "</div>" +
            cmp("เบอร์โทร", "081-552-4417", "081-552-4417", "same") +
            cmp("ชื่อเรียก", "นุ่น", "Noon.p", "diff") +
            cmp("LINE", "เชื่อมแล้ว", "", "") .replace('<span class="m-v muted">ไม่มี</span>', '<span class="m-v muted">ยังไม่เชื่อม</span>') +
            cmp("วันเกิด", "12 มี.ค. 2541 06:40 น.", "", "") +
            cmp("ที่อยู่ส่งของ", "", "ลาดพร้าว 71 กรุงเทพฯ 10230", "") +
            cmp("ประวัติ", "ดูดวง 1 ครั้ง SL-0388", "กำไล 1 ออเดอร์ SL-0423 รอชำระ", "") +
            cmp("ลูกค้าตั้งแต่", "12 ต.ค. 2569", "3 พ.ย. 2569", "") +
          "</div>" +
          '<div class="card m-note"><p class="ui" style="line-height:24px">เบอร์เดียวกันอาจเป็นคนในบ้านเดียวกัน รวมผิดแปลว่าผู้อ่านเห็นดวงของคนอื่นปน ถ้าไม่แน่ใจ ทักถาม Noon.p ใน IG ว่า<b class="w6">เคยจองดูดวงกับร้านไหม</b></p><p class="cap muted" style="line-height:20px">วันเกิดมีฝั่งเดียว เทียบกันไม่ได้</p></div>' +
        "</div></div>" +
        foot("ระบบไม่รวมให้เอง ทั้งสองปุ่มบันทึกว่าใครกดและกดเมื่อไร",
          '<button class="btn btn-lg" type="button" data-go="apart">ไม่ใช่คนเดียวกัน</button><button class="btn-primary" type="button" data-go="pick">รวมเป็นคนเดียวกัน</button>');
    },
    pick: function () {
      var keep = pick === "a" ? A : B;
      function opt(id, p, note) {
        return '<label class="m-opt"><input type="radio" name="m-nick" value="' + id + '"' + (pick === id ? " checked" : "") + '><span class="m-radio" aria-hidden="true"></span><span><span class="ui w6" style="display:block">' + p.nick + '</span><span class="cap muted">' + note + "</span></span></label>";
      }
      return "<div>" + head("รวมเป็นคนเดียวกัน", "เลือกข้อมูลที่ขัดกัน ที่เหลือรวมเข้าด้วยกันทั้งหมด") +
        '<div class="m-body">' +
          '<fieldset class="m-pick"><legend><span class="h-group">ชื่อเรียก</span><span class="cap sand-ink">ต่างกัน เลือก 1 อย่าง</span></legend>' +
            '<div class="m-opts">' + opt("a", A, "จาก LINE ลูกค้าตั้งเอง") + opt("b", B, "จากชื่อบัญชี IG") + "</div>" +
            '<p class="cap muted" style="line-height:20px">ชื่อที่ไม่ได้เลือกยังเก็บไว้เป็นชื่อบัญชี IG ค้นหาเจอเหมือนเดิม</p>' +
          "</fieldset>" +
          '<div><h3 class="h-group" style="padding-bottom:6px">หลังรวมเป็นแบบนี้</h3>' +
            kv("ชื่อเรียก", keep.nick) +
            kv("ช่องทาง", "LINE และ IG Noon.p ข้อความจากร้านส่งทาง OA") +
            kv("วันเกิด", "12 มี.ค. 2541 06:40 น.") +
            kv("ที่อยู่ส่งของ", "ลาดพร้าว 71 กรุงเทพฯ 10230") +
            kv("ประวัติ", "ดูดวง 1 ครั้ง กำไล 1 ออเดอร์ อยู่หน้าเดียวกัน") +
          "</div>" +
          '<div class="card m-confirm"><label class="tick"><input type="checkbox" data-asked' + (asked ? " checked" : "") + '><span class="box">' + TICK + '</span><span class="ui-tight w5">ถามลูกค้าแล้ว หรือมั่นใจว่าเป็นคนเดียวกัน</span></label></div>' +
        "</div></div>" +
        foot("รวมแล้วแยกคืนเองไม่ได้ ระบบบันทึกว่าใครกดและกดเมื่อไร",
          '<button class="btn btn-lg" type="button" data-go="compare">กลับไปเทียบ</button><button class="btn-primary" type="button" data-go="merged" data-merge-btn>รวมเป็น' + disp() + "</button>");
    },
    merged: function () {
      var keep = pick === "a" ? A : B;
      var display = disp();
      return "<div>" + head("รวมแล้วเป็น" + display, "ฝั่งร้านกดรวมเมื่อ 4 พ.ย. " + now() + " น. บันทึกไว้ในประวัติลูกค้าแล้ว") +
        '<div class="m-body">' +
          '<div class="m-merged"><span class="m-av big sage">' + keep.initial + '</span><span><span class="m-title"><span class="h-title">' + display + '</span><span class="pill pill-sage">รวมแล้ว</span></span><span class="ui muted">LINE และ IG Noon.p เบอร์ 081-552-4417</span></span></div>' +
          '<div><h3 class="h-group m-rule">สิ่งที่เปลี่ยน</h3>' +
            kv("ออเดอร์ SL-0423", "ย้ายมาอยู่ในประวัติ" + display + " ยังรอชำระเหมือนเดิม ข้อความเรื่องออเดอร์นี้ส่งทาง LINE ร้านได้แล้ว") +
            kv("วันเกิด", "12 มี.ค. 2541 06:40 น. จาก LINE จองดูดวงครั้งหน้าระบบกรอกให้ก่อน") +
            kv("ฝั่งผู้อ่าน", "เห็นคิวดูดวงและกำไลของ" + display + "ในหน้าประวัติเดียว") +
          "</div>" +
        "</div></div>" +
        foot("คู่นี้หายจากรายการ งานที่เหลือวันนี้ " + left() + " รายการ",
          '<a class="btn btn-lg" href="customer.html">ดูประวัติ' + display + "</a>" + nextBtn());
    },
    apart: function () {
      return "<div>" + head("แยกกันไว้เหมือนเดิม", 'ฝั่งร้านกด "ไม่ใช่คนเดียวกัน" เมื่อ 4 พ.ย. ' + now() + " น.") +
        '<div class="m-body">' +
          '<div class="m-two"><div class="card m-card">' + person({ name: "คุณนุ่น", initial: "น", src: "LINE ดูดวง 1 ครั้ง" }, "sage") + '</div><div class="card m-card">' + person({ name: "Noon.p", initial: "N", src: "IG กำไล 1 ออเดอร์" }) + "</div></div>" +
          "<div>" +
            kv("เตือนซ้ำไหม", "ไม่ ระบบจำคู่นี้ไว้ เบอร์เดียวกันจะไม่ขึ้นในรายการนี้อีก") +
            kv("เปลี่ยนใจ", "กดรวมเองได้ในหน้าประวัติของคนใดคนหนึ่ง") +
          "</div>" +
        "</div></div>" +
        foot("คู่นี้หายจากรายการ งานที่เหลือวันนี้ " + left() + " รายการ",
          '<a class="btn btn-lg" href="customer.html">ดูประวัติ Noon.p</a>' + nextBtn());
    }
  };

  function disp() { return pick === "a" ? "คุณนุ่น" : "Noon.p"; }
  function now() {
    var d = new Date();
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  function left() {
    var c = document.querySelector('.nav-item[aria-current="page"] .count');
    return c ? c.textContent : "5";
  }
  function nextSlip() { return document.querySelector('[data-group="slip"] [data-slip]'); }
  function nextBtn() {
    var s = nextSlip();
    return s ? '<button class="btn-primary" type="button" data-next>งานถัดไป ตรวจสลิป ' + s.dataset.slip + "</button>" : "";
  }

  function render(view, focus) {
    pane.innerHTML = views[view]();
    pane.dataset.view = view;
    pane.scrollTop = 0;
    if (view === "pick") syncMerge();
    if (focus) { var h = pane.querySelector("[data-focus]"); if (h) h.focus({ preventScroll: true }); }
  }
  function syncMerge() {
    var b = pane.querySelector("[data-merge-btn]");
    b.disabled = !asked;
    b.title = asked ? "" : "ติ๊ก 'ถามลูกค้าแล้ว หรือมั่นใจว่าเป็นคนเดียวกัน' ก่อน";
  }

  function open() {
    slipPane.hidden = true;
    pane.hidden = false;
    document.querySelectorAll('[data-group="slip"] [data-slip]').forEach(function (r) { r.classList.remove("is-sel"); r.removeAttribute("aria-current"); });
    row.classList.add("is-sel");
    row.setAttribute("aria-current", "true");
    render("compare", true);
  }
  function close() {
    pane.hidden = true;
    row.classList.remove("is-sel");
    row.removeAttribute("aria-current");
    slipPane.hidden = false;
  }
  function resolve(view, msg) {
    var c = document.querySelector('.nav-item[aria-current="page"] .count');
    if (c) c.textContent = Math.max(0, Number(c.textContent) - 1);
    group.remove();
    render(view, true);
    window.boToast(msg);
  }

  row.addEventListener("click", open);
  document.querySelector('[data-group="slip"]').addEventListener("click", function (e) {
    if (e.target.closest("[data-slip]") && !pane.hidden) close();
  }, true);

  pane.addEventListener("click", function (e) {
    var go = e.target.closest("[data-go]");
    if (go) {
      var v = go.dataset.go;
      if (v === "merged") resolve("merged", "รวมแล้ว เหลือ" + disp() + "คนเดียว");
      else if (v === "apart") resolve("apart", "แยกไว้แล้ว ระบบจะไม่เตือนคู่นี้ซ้ำ");
      else render(v, true);
      return;
    }
    if (e.target.closest("[data-next]")) {
      var s = nextSlip();
      close();
      if (s) s.click();
    }
  });
  pane.addEventListener("change", function (e) {
    if (e.target.name === "m-nick") {
      pick = e.target.value;
      var keep = pick === "a" ? A : B;
      pane.querySelector("[data-merge-btn]").textContent = "รวมเป็น" + disp();
      pane.querySelectorAll(".m-kv .ui")[0].textContent = keep.nick;
    }
    if (e.target.matches("[data-asked]")) { asked = e.target.checked; syncMerge(); }
  });

  if (location.hash === "#merge") open();
})();
