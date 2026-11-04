/* ประวัติลูกค้า: "รวมกับลูกค้าคนอื่น". Search, compare, pick conflicting fields, merge.
   Built from the Paper row "รวมจากหน้าประวัติลูกค้า". Fake data only; nothing is saved. */
(function () {
  var pane = document.querySelector("[data-cmerge]");
  var history = document.querySelector("[data-history]");
  var entry = document.querySelector("[data-cmerge-open]");
  if (!pane || !history || !entry) return;

  var ME = { initial: "จ", src: "LINE junejune", nick: "จูน", phone: "089-412-7730", birth: "12 มี.ค. 2538 06:40 น.", addr: "12/5 ถ.นิมมานเหมินท์ เชียงใหม่", hist: "ดูดวง 2 ครั้ง กำไล 1 ออเดอร์", since: "14 ก.ย. 2569", line: true };
  var PEOPLE = [
    { id: "junek", name: "June.k", ch: "IG", initial: "J", src: "IG ร้านกรอกจากแชท", nick: "June.k", phone: "089-412-7730", birth: "", addr: "หอพักใกล้ มช. เชียงใหม่", hist: "กำไล 1 ออเดอร์ SL-0398 ส่งแล้ว", since: "28 ต.ค. 2569", line: false,
      meta: "กำไล 1 ออเดอร์ SL-0398 เบอร์ 089-412-7730", keys: "june.k จูน june 0894127730 089-412-7730 sl-0398 ig",
      order: { code: "SL-0398", when: "28 ต.ค. 2569", what: "กำไลสำเร็จรูป มูนสโตน 8 มม.", st: "ส่งแล้ว", amt: "690 ฿" },
      past: "2 พ.ย. 10:15 น." },
    { id: "junjira", name: "คุณจูนจิรา", ch: "LINE", initial: "จ", src: "LINE jjira", nick: "จูนจิรา", phone: "081-990-2214", birth: "3 ส.ค. 2540", addr: "", hist: "ดูดวง 1 ครั้ง SL-0352", since: "2 ต.ค. 2569", line: true,
      meta: "ดูดวง 1 ครั้ง SL-0352 เบอร์ 081-990-2214", keys: "คุณจูนจิรา จูนจิรา จูน jjira 0819902214 081-990-2214 sl-0352 line" }
  ];
  var other = null, pick = "a", asked = false, done = false;

  var CHECK = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#2E6A5C"/><path d="M4.6 8.2l2.2 2.2 4.6-4.8" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var TICK = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2l2.2 2.2 4.8-5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var BACK = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M9 2.5L4.5 7 9 11.5" fill="none" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function myName() { return document.querySelector("[data-cust-name]").textContent.trim(); }
  function disp() { return pick === "a" ? myName() : other.name; }
  function head(title, sub, link) {
    return '<div class="cm-head"><div><h2 class="h-title" tabindex="-1" data-focus>' + title + '</h2><p class="ui muted">' + sub + "</p></div>" + (link || "") + "</div>";
  }
  function foot(note, acts) {
    return '<div class="detail-foot"><p class="note cap muted" style="line-height:20px;max-width:300px">' + note + '</p><div class="acts">' + acts + "</div></div>";
  }
  function person(name, initial, src, tone) {
    return '<span class="m-who"><span class="m-av' + (tone ? " " + tone : "") + '">' + initial + '</span><span><span class="m-name">' + name + '</span><span class="cap muted">' + src + "</span></span></span>";
  }
  function cmp(label, a, b) {
    var strong = ["ชื่อเรียก", "เบอร์โทร", "วันเกิด"].indexOf(label) !== -1;
    var kind = a && b ? (a === b ? "same" : strong ? "diff" : "") : "";
    var mark = kind === "same" ? CHECK : kind === "diff" ? '<span class="m-dot" aria-hidden="true"></span>' : '<span class="m-gap" aria-hidden="true"></span>';
    var aria = kind === "same" ? " (ตรงกัน)" : kind === "diff" ? " (ต่างกัน)" : "";
    function v(x) { return x ? '<span class="m-v">' + x + "</span>" : '<span class="m-v muted">ไม่มี</span>'; }
    return '<div class="m-row' + (kind ? " is-" + kind : "") + '"><span class="m-k">' + mark + "<span>" + label + '<span class="sr">' + aria + "</span></span></span>" + v(a) + v(b) + "</div>";
  }
  function kv(k, v) { return '<div class="m-kv"><span class="m-k2 ui muted">' + k + '</span><span class="ui">' + v + "</span></div>"; }

  function results(q) {
    q = q.trim().toLowerCase().replace(/^คุณ/, "");
    if (!q) return '<p class="cap muted cm-empty">พิมพ์ชื่อ ชื่อบัญชี เบอร์โทร หรือรหัสคิวและออเดอร์</p>';
    var hit = PEOPLE.filter(function (p) { return p.keys.toLowerCase().indexOf(q) !== -1; });
    if (!hit.length) return '<p class="ui muted cm-empty">ไม่พบลูกค้าที่ตรงกับ "' + q + '"</p>';
    return '<p class="cap muted" style="padding:0 0 8px">พบ ' + hit.length + " คน</p>" + hit.map(function (p) {
      var why = p.phone === ME.phone
        ? '<span class="pill pill-sage">เบอร์ตรงกัน</span>' + (p.past ? '<span class="cap sand-ink">เคยกดว่าไม่ใช่คนเดียวกัน ' + p.past.split(" ")[0] + " " + p.past.split(" ")[1] + "</span>" : "")
        : '<span class="cap muted">ชื่อคล้ายกัน</span>';
      return '<button class="cm-row" type="button" data-person="' + p.id + '"><span class="m-av' + (p.ch === "LINE" ? " sage" : "") + '">' + p.initial + '</span><span class="who"><span class="ui w6">' + p.name + ' <span class="w4 muted">' + p.ch + '</span></span><span class="cap muted">' + p.meta + '</span></span><span class="why">' + why + "</span></button>";
    }).join("") + '<p class="cap muted" style="padding:16px 16px 0;line-height:20px">กดคนที่ใช่แล้วเทียบก่อน ยังไม่รวมทันที</p>';
  }

  var views = {
    search: function () {
      return '<div class="cm-top">' + head("รวม" + myName() + "กับลูกค้าคนอื่น", "ค้นคนที่คิดว่าเป็นคนเดียวกัน แล้วเทียบก่อนรวม", '<button class="link ui-tight" type="button" data-close>ปิด</button>') +
        '<label class="cm-search"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="#6B7280" stroke-width="1.5"/><path d="M11 11l3.5 3.5" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round"/></svg><span class="sr">ค้นหาลูกค้า</span><input type="search" value="จูน" placeholder="ชื่อ ชื่อบัญชี เบอร์ หรือรหัส" data-q autocomplete="off"></label>' +
        '<div class="cm-res" data-res>' + results("จูน") + "</div></div>";
    },
    compare: function () {
      var o = other;
      var pairs = [[ME.phone, o.phone], [ME.nick, o.nick], [ME.birth, o.birth]];
      var same = pairs.filter(function (p) { return p[0] && p[1] && p[0] === p[1]; }).length;
      var diff = pairs.filter(function (p) { return p[0] && p[1] && p[0] !== p[1]; }).length;
      var sub = (same ? "ตรงกัน " + same + " ช่อง " : "ไม่มีช่องไหนตรงกัน ") + "ต่างกัน " + diff + " ช่อง ที่เหลือมีฝั่งเดียวหรือเทียบไม่ได้";
      return '<div class="cm-top">' + head("เทียบ" + myName() + "กับ " + o.name, sub, '<button class="link ui-tight" type="button" data-go="search">' + BACK + "ค้นใหม่</button>") +
          '<div class="m-table" role="table" aria-label="เทียบข้อมูลสองคน">' +
            '<div class="m-row m-heads"><span class="m-k cap muted"><span class="m-gap"></span>ข้อมูล</span>' + person(myName(), ME.initial, ME.src, "sage") + person(o.name, o.initial, o.src, o.ch === "LINE" ? "sage" : "") + "</div>" +
            cmp("เบอร์โทร", ME.phone, o.phone) + cmp("ชื่อเรียก", ME.nick, o.nick) +
            '<div class="m-row"><span class="m-k"><span class="m-gap"></span><span>LINE</span></span><span class="m-v">เชื่อมแล้ว</span><span class="m-v' + (o.line ? "" : " muted") + '">' + (o.line ? "เชื่อมแล้ว คนละบัญชี" : "ยังไม่เชื่อม") + "</span></div>" +
            cmp("วันเกิด", ME.birth, o.birth) + cmp("ที่อยู่ส่งของ", ME.addr, o.addr) + cmp("ประวัติ", ME.hist, o.hist) + cmp("ลูกค้าตั้งแต่", ME.since, o.since) +
          "</div>" +
          '<div class="card m-note">' + (o.past
            ? '<p class="ui" style="line-height:24px">ฝั่งร้านเคยกด<b class="w6">ไม่ใช่คนเดียวกัน</b>เมื่อ ' + o.past + " ถ้ารวมตอนนี้ ระบบบันทึกทั้งสองครั้งไว้ในประวัติลูกค้า</p>"
            : '<p class="ui" style="line-height:24px">เบอร์และวันเกิดไม่ตรงกัน ระบบไม่มีอะไรบอกว่าเป็นคนเดียวกัน นอกจากชื่อคล้ายกัน</p>') +
            '<p class="cap muted" style="line-height:20px">ถ้าไม่แน่ใจ ทักถาม ' + o.name + " ว่าเคยจองดูดวงกับร้านไหม</p></div>" +
        "</div>" +
        foot("ขั้นต่อไปเลือกข้อมูลที่ขัดกัน แล้วติ๊กยืนยันก่อนรวม", '<button class="btn btn-lg" type="button" data-close>ยกเลิก</button><button class="btn-primary" type="button" data-go="pick">รวมเป็นคนเดียวกัน</button>');
    },
    pick: function () {
      var o = other;
      function opt(id, nick, note) {
        return '<label class="m-opt"><input type="radio" name="cm-nick" value="' + id + '"' + (pick === id ? " checked" : "") + '><span class="m-radio" aria-hidden="true"></span><span><span class="ui w6" style="display:block">' + nick + '</span><span class="cap muted">' + note + "</span></span></label>";
      }
      return '<div class="cm-top">' + head("รวมเป็นคนเดียวกัน", "เลือกข้อมูลที่ขัดกัน ที่เหลือรวมเข้าด้วยกันทั้งหมด") +
          '<fieldset class="m-pick"><legend><span class="h-group">ชื่อเรียก</span><span class="cap sand-ink">ต่างกัน เลือก 1 อย่าง</span></legend>' +
            '<div class="m-opts">' + opt("a", ME.nick, "จาก LINE ลูกค้าตั้งเอง") + opt("b", o.nick, "จากชื่อบัญชี " + o.ch) + "</div>" +
            '<p class="cap muted" style="line-height:20px">ชื่อที่ไม่ได้เลือกยังเก็บไว้เป็นชื่อบัญชี ' + o.ch + " ค้นหาเจอเหมือนเดิม</p></fieldset>" +
          '<div><h3 class="h-group" style="padding-bottom:6px">หลังรวมเป็นแบบนี้</h3>' +
            kv("ชื่อเรียก", '<span data-nick>' + (pick === "a" ? ME.nick : o.nick) + "</span>") +
            kv("ช่องทาง", "LINE และ " + o.ch + " " + o.name + " ข้อความจากร้านส่งทาง OA") +
            kv("วันเกิด", ME.birth) +
            kv("ที่อยู่ส่งของ", "เก็บไว้ทั้งสองที่ ออเดอร์เดิมใช้ที่อยู่เดิมของมัน") +
            kv("ประวัติ", "ดูดวง 2 ครั้ง กำไล 2 ออเดอร์ อยู่หน้าเดียวกัน") +
          "</div>" +
          '<div class="card m-confirm"><label class="tick"><input type="checkbox" data-asked' + (asked ? " checked" : "") + '><span class="box">' + TICK + '</span><span class="ui-tight w5">ถามลูกค้าแล้ว หรือมั่นใจว่าเป็นคนเดียวกัน</span></label></div>' +
        "</div>" +
        foot("รวมแล้วแยกคืนเองไม่ได้ ระบบบันทึกว่าใครกดและกดเมื่อไร", '<button class="btn btn-lg" type="button" data-go="compare">กลับไปเทียบ</button><button class="btn-primary" type="button" data-merge-btn>รวมเป็น' + disp() + "</button>");
    }
  };

  function render(v) {
    pane.innerHTML = views[v]();
    pane.scrollTop = 0;
    if (v === "pick") syncMerge();
    var h = pane.querySelector("[data-focus]");
    if (h) h.focus({ preventScroll: true });
    if (v === "search") { var q = pane.querySelector("[data-q]"); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  }
  function syncMerge() {
    var b = pane.querySelector("[data-merge-btn]");
    b.disabled = !asked;
    b.title = asked ? "" : "ติ๊ก 'ถามลูกค้าแล้ว หรือมั่นใจว่าเป็นคนเดียวกัน' ก่อน";
  }
  function open() {
    if (done) { window.boToast("รวมกับ " + other.name + " แล้ว รวมเพิ่มได้ในของจริง"); return; }
    history.hidden = true; pane.hidden = false;
    entry.setAttribute("aria-expanded", "true");
    other = null; pick = "a"; asked = false;
    render("search");
  }
  function close() {
    pane.hidden = true; history.hidden = false;
    entry.setAttribute("aria-expanded", "false");
    entry.focus();
  }
  function merge() {
    var o = other, name = disp();
    done = true;
    close();
    var nameEl = document.querySelector("[data-cust-name]");
    nameEl.textContent = name;
    var note = document.querySelector("[data-merged-note]");
    note.textContent = "รวมกับ " + (pick === "a" ? o.name : ME.src) + " แล้ว 4 พ.ย. ฝั่งร้านเป็นคนกด";
    note.hidden = false;
    if (o.order) {
      var sec = document.querySelector('[aria-labelledby="o-h"]');
      sec.querySelector(".n").textContent = "2";
      sec.querySelector(".sec-head").insertAdjacentHTML("afterend",
        '<div class="hrow is-new"><a class="code" href="#" data-todo="หน้ารายละเอียดออเดอร์ยังไม่ได้ออกแบบ">' + o.order.code + '</a><span class="what">' + o.order.when + ' <span class="muted">' + o.order.what + '</span></span><span class="st">' + o.order.st + '</span><span class="amt num">' + o.order.amt + "</span></div>");
    }
    window.boToast("รวมแล้ว " + o.name + " อยู่ในประวัติ" + name);
  }

  entry.addEventListener("click", function () { if (pane.hidden) open(); else close(); });
  pane.addEventListener("input", function (e) {
    if (e.target.matches("[data-q]")) pane.querySelector("[data-res]").innerHTML = results(e.target.value);
  });
  pane.addEventListener("click", function (e) {
    var p = e.target.closest("[data-person]");
    if (p) { other = PEOPLE.filter(function (x) { return x.id === p.dataset.person; })[0]; render("compare"); return; }
    var g = e.target.closest("[data-go]");
    if (g) { render(g.dataset.go); return; }
    if (e.target.closest("[data-close]")) { close(); return; }
    if (e.target.closest("[data-merge-btn]")) merge();
  });
  pane.addEventListener("change", function (e) {
    if (e.target.name === "cm-nick") {
      pick = e.target.value;
      pane.querySelector("[data-merge-btn]").textContent = "รวมเป็น" + disp();
      pane.querySelector("[data-nick]").textContent = pick === "a" ? ME.nick : other.nick;
    }
    if (e.target.matches("[data-asked]")) { asked = e.target.checked; syncMerge(); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !pane.hidden) close(); });

  if (location.hash === "#merge") open();
})();
