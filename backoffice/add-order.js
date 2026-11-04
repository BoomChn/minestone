/* เพิ่มออเดอร์จากแชท: channel picker, paste-to-AI (faked locally), items, live summary. Fake data only. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var baht = function (n) { return n.toLocaleString("en-US"); };

  var CH = {
    line: { name: "LINE ร้าน" },
    ig: { name: "Instagram", handle: "ชื่อบัญชี Instagram" },
    tt: { name: "TikTok", handle: "ชื่อบัญชี TikTok" },
    fb: { name: "Facebook", handle: "ชื่อใน Facebook" },
    other: { name: "แชทนั้น", handle: "ช่องทางและชื่อบัญชี" }
  };
  var PEOPLE = [
    { id: "praew", name: "คุณแพร", line: "Praewa.k", sub: "ทักล่าสุด 14:02 น. เคยจองดูดวง 1 ครั้ง", av: "พ" },
    { id: "praepp", name: "Prae.pp", line: "", sub: "ทักล่าสุดเมื่อวาน 21:40 น.", av: "P", g: true, note: "ยังไม่เคยสั่ง" },
    { id: "mind", name: "คุณมายด์", line: "mind_m", sub: "ทักล่าสุด 13:40 น. สั่งมาแล้ว 1 ครั้ง", av: "ม" },
    { id: "fah", name: "คุณฟ้า", line: "fah.sky", sub: "ทักล่าสุดเมื่อวาน 18:05 น. ลูกค้าเก่า", av: "ฟ", g: true }
  ];
  var READY = [
    { key: "gold8", name: "ไหมทอง 8 มม.", sub: "สำเร็จรูป หินธรรมชาติ เหลือ 3 เส้น", price: 690, pic: "gold", match: /ไหมทอง\s*8/ },
    { key: "rqmoon", name: "โรสควอตซ์คั่นมูนสโตน", sub: "สำเร็จรูป หินธรรมชาติ เหลือ 2 เส้น", price: 890, pic: "rose", match: /โรสควอตซ์คั่น/ },
    { key: "moon6", name: "มูนสโตน 6 มม.", sub: "สำเร็จรูป หินธรรมชาติ เหลือ 1 เส้น", price: 590, pic: "moon", match: /มูนสโตน\s*6/ }
  ];
  var CUSTOM = { name: "ร้อยเอง 21 เม็ด", sub: "อเมทิสต์ 9 โรสควอตซ์ 8 ไหมทอง 4\nข้อมือ 15.5 ซม.", price: 1190 };
  var SIZES = ["14 ซม.", "15 ซม.", "15.5 ซม.", "16 ซม.", "16.5 ซม.", "17 ซม.", "18 ซม."];
  var SAMPLE = "สวัสดีค่ะ อยากได้ไหมทอง 8 มม. 1 เส้นค่ะ\nอีกเส้นอยากร้อยเอง อเมทิสต์ 9 โรสควอตซ์ 8 ไหมทอง 4 ข้อมือ 15.5\nเกิด 12 มี.ค. 38 นะคะ เผื่อช่วยดูหินให้\nส่งที่ มิ้นท์ จิรารัตน์ 0812345678 59/2 ถ.นิมมานเหมินท์ ต.สุเทพ อ.เมือง เชียงใหม่ 50200";

  var state = { ch: "line", person: null, items: [], fee: 50, carrier: "Flash", made: false };
  var seq = 0;

  var paste = $("[data-paste]"), pasteIn = $("[data-paste-in]"), aiBtn = $("[data-ai]"), aiLabel = $("[data-ai-label]");
  var result = $("[data-result]");
  var f = { handle: $('[data-f="handle"]'), name: $('[data-f="name"]'), phone: $('[data-f="phone"]'), addr: $('[data-f="addr"]') };
  var itemsEl = $("[data-items]"), menu = $("[data-ready-menu]"), addReady = $("[data-add-ready]");
  var createBtn = $("[data-create]"), why = $("[data-why]");

  /* ---------- Paste + AI ---------- */
  function syncPaste() {
    var has = pasteIn.value.trim().length > 0;
    paste.classList.toggle("has-text", has);
    aiBtn.disabled = !has;
  }
  pasteIn.addEventListener("input", syncPaste);
  $("[data-sample]").addEventListener("click", function () {
    pasteIn.value = SAMPLE;
    setChannel("ig");
    f.handle.value = "@mint.jrr";
    syncPaste();
    pasteIn.focus();
  });

  function markAI(el) { el.classList.add("is-ai", "flash"); setTimeout(function () { el.classList.remove("flash"); }, 800); }

  aiBtn.addEventListener("click", function () {
    var raw = pasteIn.value;
    // Birth dates never leave the shop: strip them before "sending" to the AI.
    var bday = /(วันเกิด|เกิด)[^\n]*/.test(raw);
    var text = raw.replace(/[^\n]*(วันเกิด|เกิด)[^\n]*\n?/g, "");
    aiBtn.disabled = true; aiBtn.classList.add("is-busy"); aiLabel.textContent = "AI กำลังอ่านแชท…";
    setTimeout(function () { fillFromText(text, bday); }, 900);
  });

  function fillFromText(text, bday) {
    var filled = 0, miss = [];
    var PH = /0\d{2}[\s-]?\d{3}[\s-]?\d{4}(?!\d)/;
    var phone = (text.match(PH) || [])[0];
    var ship = (text.match(/ส่งที่\s*([^\n]+)/) || [])[1];
    if (state.ch !== "line") {
      var nm = ship ? ship.trim().split(/\s+/)[0] : "";
      if (nm) { f.name.value = "คุณ" + nm; markAI(f.name); filled++; }
      if (phone) { f.phone.value = phone.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3"); markAI(f.phone); filled++; }
    }
    if (ship) {
      var addr = ship.replace(PH, function (m) { return m.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3"); });
      f.addr.value = addr.replace(/(\d{3}-\d{3}-\d{4})\s*/, "$1\n");
      markAI(f.addr); filled++;
    }
    text.split("\n").forEach(function (line) {
      READY.forEach(function (r) {
        if (!r.match.test(line)) return;
        var size = (line.match(/ข้อมือ\s*(\d+(?:\.\d)?)/) || [])[1];
        var it = addItem({ type: "ready", r: r, size: size ? size + " ซม." : "", ai: true });
        filled++;
        if (!it.size) miss.push("ขนาดข้อมือ" + r.name.replace(/\s.*/, ""));
      });
      if (/ร้อยเอง/.test(line)) { addItem({ type: "custom", ai: true }); filled++; }
    });
    aiBtn.classList.remove("is-busy"); aiLabel.textContent = "ให้ AI ช่วยกรอก";
    paste.hidden = true; result.hidden = false;
    $("[data-r-count]").textContent = filled ? "AI กรอกให้ " + filled + " ช่อง" : "AI หาข้อมูลออเดอร์ในแชทไม่เจอ";
    $("[data-r-miss]").textContent = miss.length ? "ไม่เจอในแชท " + miss.length + " ช่อง: " + miss.join(" ") : "";
    $("[data-r-bday]").hidden = !bday;
    render();
  }

  $("[data-repaste]").addEventListener("click", function () {
    result.hidden = true; paste.hidden = false;
    $$(".is-ai").forEach(function (el) { el.classList.remove("is-ai"); });
    pasteIn.value = ""; syncPaste(); pasteIn.focus();
  });

  /* ---------- Channel + customer ---------- */
  var chBtns = $$("[data-ch]");
  function setChannel(ch) {
    state.ch = ch;
    chBtns.forEach(function (b) { var on = b.dataset.ch === ch; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", String(on)); });
    $("[data-cust-line]").hidden = ch !== "line";
    $("[data-cust-other]").hidden = ch === "line";
    if (ch !== "line") {
      $("[data-handle-label]").textContent = CH[ch].handle;
      $("[data-nl-text]").textContent = "ระบบส่งข้อความหาลูกค้าไม่ได้ ให้คัดลอกลิงก์ไปส่งใน " + CH[ch].name + " เอง ลูกค้าเข้าสู่ระบบด้วย LINE ตอนเปิดลิงก์ แล้วระบบเชื่อมให้ ข้อความหลังจากนั้นส่งทาง LINE ได้";
    }
    render();
  }
  chBtns.forEach(function (b) { b.addEventListener("click", function () { setChannel(b.dataset.ch); }); });

  var peopleEl = $("[data-people]"), q = $("[data-q]");
  var CHK = '<svg class="chk" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#111827"/><path d="M4.6 8.2l2.2 2.2 4.6-4.8" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function renderPeople() {
    var term = q.value.trim().toLowerCase();
    var list = PEOPLE.filter(function (p) { return !term || (p.name + " " + p.line).toLowerCase().indexOf(term) > -1; });
    peopleEl.innerHTML = list.length ? list.map(function (p) {
      var sel = state.person === p.id;
      var tag = p.line ? '<span class="w4 muted">LINE ' + p.line + "</span>" : '<span class="w4 muted">' + p.note + "</span>";
      return '<button class="person" type="button" role="option" aria-selected="' + sel + '" data-p="' + p.id + '">' +
        '<span class="av' + (p.g ? " g" : "") + '">' + p.av + "</span>" +
        '<span class="who"><span class="ui w6">' + p.name + " " + tag + '</span><span class="cap muted">' + p.sub + "</span></span>" + CHK + "</button>";
    }).join("") : '<p class="people-empty small muted">ไม่เจอในคนที่ทักแชท LINE ร้าน ถ้าลูกค้าทักมาทางอื่น เลือกช่องทางด้านบน</p>';
  }
  q.addEventListener("input", renderPeople);
  peopleEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-p]"); if (!b) return;
    state.person = state.person === b.dataset.p ? null : b.dataset.p;
    renderPeople(); render();
  });

  [f.handle, f.name, f.phone, f.addr].forEach(function (el) {
    el.addEventListener("input", function () { el.classList.remove("is-ai"); render(); });
  });

  /* ---------- Items ---------- */
  function addItem(o) {
    var it = { id: ++seq, type: o.type, ai: !!o.ai, checked: false };
    if (o.type === "ready") { it.name = o.r.name; it.sub = o.r.sub; it.price = o.r.price; it.pic = o.r.pic; it.size = o.size || ""; it.aiMiss = o.ai && !o.size; }
    else { it.name = CUSTOM.name; it.sub = CUSTOM.sub; it.price = CUSTOM.price; }
    state.items.push(it);
    renderItems();
    return it;
  }
  var X = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  var TICK = '<span class="box"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2l2.2 2.2 4.8-5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  function renderItems() {
    itemsEl.innerHTML = state.items.map(function (it) {
      var pic = it.type === "custom"
        ? '<span class="it-pic mix" aria-hidden="true"><i style="background:#7B5EA7"></i><i style="background:#E8B4B8"></i><i style="background:#7B5EA7"></i><i style="background:#E8B4B8"></i><i style="background:#C9973F"></i><i style="background:#E8B4B8"></i></span>'
        : '<span class="it-pic ' + it.pic + '" aria-hidden="true"></span>';
      var bot;
      if (it.type === "ready") {
        var miss = !it.size;
        bot = '<div class="it-bot"><label class="size"><span class="cap muted">ขนาดข้อมือ</span><select data-size="' + it.id + '" class="' + (miss ? "is-miss" : "") + '">' +
          '<option value="">เลือกขนาด</option>' + SIZES.map(function (s) { return "<option" + (s === it.size ? " selected" : "") + ">" + s + "</option>"; }).join("") +
          "</select>" + (miss && it.aiMiss ? '<span class="cap miss-note">ไม่เจอในแชท ถามลูกค้าก่อน</span>' : "") + "</label></div>";
      } else {
        bot = '<div class="it-bot"><label class="tick"><input type="checkbox" data-check="' + it.id + '"' + (it.checked ? " checked" : "") + ">" + TICK + '<span class="small w5">เช็กเม็ดหินแล้ว มีครบ</span></label>' +
          '<a class="small w5 ink" href="../order.html" target="_blank" rel="noopener">แก้สูตรหิน</a></div>';
      }
      return '<div class="it' + (it.ai ? " is-ai" : "") + '" data-it="' + it.id + '"><div class="it-top">' + pic +
        '<span class="it-name"><span class="ui w6">' + it.name + '</span><span class="cap muted" style="white-space:pre-line">' + it.sub + "</span></span>" +
        '<span class="it-price ui w5 num">' + baht(it.price) + ' ฿</span><button class="it-x" type="button" aria-label="เอา' + it.name + 'ออก" data-rm="' + it.id + '">' + X + "</button></div>" + bot + "</div>";
    }).join("");
    $("[data-items-h]").textContent = state.items.length ? "กำไล " + state.items.length + " เส้น" : "กำไล";
    render();
  }
  function byId(id) { return state.items.filter(function (i) { return i.id === +id; })[0]; }
  itemsEl.addEventListener("click", function (e) {
    var rm = e.target.closest("[data-rm]");
    if (rm) { state.items = state.items.filter(function (i) { return i.id !== +rm.dataset.rm; }); renderItems(); }
  });
  itemsEl.addEventListener("change", function (e) {
    var t = e.target;
    if (t.dataset.size) { var it = byId(t.dataset.size); it.size = t.value; renderItems(); }
    if (t.dataset.check) { byId(t.dataset.check).checked = t.checked; render(); }
  });

  menu.innerHTML = READY.map(function (r) {
    return '<button type="button" role="menuitem" data-pick="' + r.key + '"><span class="it-pic ' + r.pic + '" aria-hidden="true"></span><span class="grow"><span class="small w6">' + r.name + '</span><span class="cap muted">' + r.sub.replace("สำเร็จรูป ", "") + '</span></span><span class="small w5 num">' + baht(r.price) + " ฿</span></button>";
  }).join("");
  function closeMenu() { menu.hidden = true; addReady.setAttribute("aria-expanded", "false"); }
  addReady.addEventListener("click", function (e) {
    e.stopPropagation();
    var open = menu.hidden; menu.hidden = !open; addReady.setAttribute("aria-expanded", String(open));
  });
  menu.addEventListener("click", function (e) {
    var b = e.target.closest("[data-pick]"); if (!b) return;
    addItem({ type: "ready", r: READY.filter(function (r) { return r.key === b.dataset.pick; })[0] });
    closeMenu();
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".add-wrap")) closeMenu(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  $("[data-add-custom]").addEventListener("click", function () { addItem({ type: "custom" }); });

  /* ---------- Carrier + source ---------- */
  $$("[data-carrier]").forEach(function (b) {
    b.addEventListener("click", function () {
      $$("[data-carrier]").forEach(function (x) { var on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-checked", String(on)); });
      state.fee = +b.dataset.fee; state.carrier = b.dataset.carrier; render();
    });
  });
  $$("[data-src] .chip").forEach(function (c) {
    c.addEventListener("click", function () {
      $$("[data-src] .chip").forEach(function (x) { x.setAttribute("aria-checked", String(x === c)); });
    });
  });

  /* ---------- Summary ---------- */
  function custName() {
    if (state.ch === "line") { var p = PEOPLE.filter(function (x) { return x.id === state.person; })[0]; return p ? p.name : ""; }
    return f.name.value.trim();
  }
  function render() {
    if (state.made) return;
    var total = state.items.reduce(function (s, i) { return s + i.price; }, 0);
    var lines = state.items.map(function (i) { return '<div class="ln ui"><span>' + i.name + '</span><span class="num">' + baht(i.price) + " ฿</span></div>"; });
    lines.push('<div class="ln ui"><span class="muted">ค่าส่ง ' + state.carrier + '</span><span class="num">' + state.fee + " ฿</span></div>");
    lines.push('<div class="ln total"><span class="ui muted">ลูกค้าต้องจ่าย</span><span class="big num">' + (state.items.length ? baht(total + state.fee) + " ฿" : "–") + "</span></div>");
    $("[data-lines]").innerHTML = lines.join("");

    var name = custName();
    var need = [];
    if (state.ch === "line" ? !state.person : !(name && (f.handle.value.trim() || f.phone.value.trim()))) need.push(state.ch === "line" ? "เลือกลูกค้า" : "ชื่อเรียกกับชื่อบัญชีหรือเบอร์");
    if (!state.items.length) need.push("ใส่กำไลอย่างน้อย 1 เส้น");
    if (state.items.some(function (i) { return i.type === "ready" && !i.size; })) need.push("เลือกขนาดข้อมือ");
    if (!f.addr.value.trim()) need.push("ที่อยู่จัดส่ง");
    createBtn.disabled = need.length > 0;
    why.textContent = need.length ? "ยังขาด: " + need.join(" ") : "";
    var sum = baht(total + state.fee);
    createBtn.textContent = state.ch === "line" ? "สร้างออเดอร์และส่งลิงก์ " + (state.items.length ? sum + " บาท" : "") : "สร้างออเดอร์และคัดลอกลิงก์";

    var next = $("[data-next]");
    next.hidden = !state.items.length;
    if (!state.items.length) return;
    var customs = state.items.filter(function (i) { return i.type === "custom"; });
    var readies = state.items.filter(function (i) { return i.type === "ready"; });
    var waiting = customs.some(function (i) { return !i.checked; });
    var li = [];
    if (waiting) li.push("เป็น <b class=\"w6\">รอเช็กของ</b> ก่อน เพราะร้อยเองยังไม่ได้เช็กเม็ดหิน ลูกค้าได้ลิงก์จ่ายหลังกด \"มีของ\"");
    else li.push("เป็น <b class=\"w6\">รอชำระ</b> ทันที" + (customs.length ? " เพราะเช็กเม็ดหินแล้ว" : ""));
    if (readies.length) li.push("จอง" + readies.map(function (r) { return r.name.replace(/\s.*/, ""); }).join(" ") + "ไว้ " + (waiting ? "ระหว่างรอเช็กของ ไม่เกิน 24 ชม." : "ถึง 16:30 น."));
    var who = name || "ลูกค้า";
    li.push(state.ch === "line"
      ? who + "ได้ลิงก์หน้าออเดอร์ทาง LINE จ่ายพร้อมเพย์และแนบสลิปในหน้านั้น"
      : "คัดลอกลิงก์ไปส่งให้" + who + "ใน " + CH[state.ch].name + " ลูกค้าเข้าสู่ระบบด้วย LINE แล้วจ่ายพร้อมเพย์ในหน้านั้น");
    $("[data-next-list]").innerHTML = li.map(function (t) { return "<li><span>" + t + "</span></li>"; }).join("");
  }

  createBtn.addEventListener("click", function () {
    if (createBtn.disabled) return;
    var line = state.ch === "line";
    var name = custName();
    var link = new URL("../status.html?k=order", location.href).href;
    if (!line && navigator.clipboard) navigator.clipboard.writeText(link).catch(function () {});
    state.made = true;
    $("[data-next]").hidden = true;
    $("[data-made]").hidden = false;
    $("[data-made-p]").textContent = line
      ? "ส่งลิงก์หน้าออเดอร์ให้" + name + "ทาง LINE แล้ว ออเดอร์ขึ้นในหน้าวันนี้"
      : "คัดลอกลิงก์แล้ว วางในแชท " + CH[state.ch].name + " ของ " + name + "ได้เลย ออเดอร์ขึ้นในหน้าวันนี้";
    createBtn.disabled = true;
    createBtn.textContent = "สร้างแล้ว";
    why.textContent = "";
    window.boToast(line ? "สร้าง SL-0423 แล้ว ส่งลิงก์ทาง LINE ให้" + name : "สร้าง SL-0423 แล้ว คัดลอกลิงก์ไว้ให้");
  });
  $("[data-draft]").addEventListener("click", function () { window.boToast("ต้นแบบนี้ยังไม่เก็บร่าง ในของจริงจะเก็บไว้ในหน้าออเดอร์"); });

  syncPaste();
  renderPeople();
  render();
})();
