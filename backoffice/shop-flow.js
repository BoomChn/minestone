/* ร้อยเองรอเช็กของ (custom-check.html) and แพ็กและส่ง (pack.html). Fake data only. */
(function () {
  var detail = document.querySelector("[data-detail]");
  if (!detail) return;
  var flow = detail.dataset.flow;

  function finish(group, code, doneText, emptyTitle, emptyText) {
    var row = group.querySelector('[data-order="' + code + '"]');
    if (row) row.remove();
    var left = group.querySelectorAll("[data-order]");
    group.querySelector("[data-count]").textContent = left.length;
    if (left.length) return left[0].dataset.order;
    group.querySelector(".group-head").insertAdjacentHTML("afterend", '<p class="cap muted" style="padding:4px 16px 8px">' + doneText + "</p>");
    detail.innerHTML = '<div class="empty"><h2 class="h-title">' + emptyTitle + '</h2><p class="ui muted">' + emptyText + "</p></div>";
    return null;
  }

  /* Custom bracelet: every stone must be ticked before the payment link can go out. */
  if (flow === "custom") {
    var group = document.querySelector('[data-group="custom"]');
    var ticks = detail.querySelectorAll("[data-stone]");
    var confirmBtn = detail.querySelector("[data-confirm]");
    var note = detail.querySelector("[data-note]");
    var NOTE = note.textContent;

    function sync() {
      var short = [];
      ticks.forEach(function (t) {
        t.parentNode.querySelector("[data-label]").textContent = t.checked ? t.dataset.ok : "ไม่พอ";
        if (!t.checked) short.push(t.dataset.stone);
      });
      confirmBtn.disabled = short.length > 0;
      confirmBtn.title = short.length ? "ติ๊กหินให้ครบทุกชนิดก่อน" : "";
      note.textContent = short.length ? short.join(" และ ") + " ไม่พอ กดขอเปลี่ยนหินเพื่อถามลูกค้าก่อน" : NOTE;
    }

    ticks.forEach(function (t) { t.addEventListener("change", sync); });
    confirmBtn.addEventListener("click", function () {
      var last = detail.querySelector("[data-last]");
      var msg = "ส่งลิงก์จ่าย SL-0418 ให้คุณต้นข้าวทาง LINE แล้ว เริ่มนับเวลาจ่าย 2 ชั่วโมง";
      if (last && last.checked) msg += " " + last.dataset.stone + "ใช้หมดแล้ว ระบบปิดสวิตช์หินนี้ให้";
      window.boToast(msg);
      finish(group, "SL-0418", "เช็กครบแล้ว", "ไม่มีออเดอร์ร้อยเองรอเช็กของ", "ออเดอร์ร้อยเองใหม่จะขึ้นที่นี่ ต้องตอบลูกค้าภายใน 24 ชั่วโมง");
    });
    sync();
    return;
  }

  /* Pack and ship: pick a carrier, type the tracking number, send it to the customer. */
  if (flow === "pack") {
    var ORDERS = {
      "SL-0409": {
        code: "SL-0409", sub: "คุณเบล กำไลสำเร็จรูป 1 เส้น ชำระแล้ว 3 พ.ย. 19:20 น.", customer: "คุณเบล",
        name: "เบญจมาศ ส.", phone: "081-234-5678",
        addr: "88/14 ซอยลาดพร้าว 71 แขวงสะพานสอง เขตวังทองหลาง กรุงเทพฯ 10310",
        items: [["#BFA36A", "กำไลไหมทอง 8 มม. ธรรมชาติ", "รหัสเส้น RT-08-03"]],
        carrier: "Flash", track: "TH0141 2B7K 9Q"
      },
      "SL-0410": {
        code: "SL-0410", sub: "คุณโอ๊ต กำไล 2 เส้น ชำระแล้ว 2 พ.ย. 11:05 น.", customer: "คุณโอ๊ต",
        name: "ณัฐพล อ.", phone: "089-552-1047",
        addr: "215 หมู่ 3 ถนนเชียงใหม่-ลำปาง ตำบลป่าตัน อำเภอเมือง เชียงใหม่ 50300",
        items: [["#7E5AA6", "กำไลอเมทิสต์ 8 มม. ธรรมชาติ", "รหัสเส้น RT-08-11"], ["#D99AA3", "กำไลโรสควอตซ์ 6 มม. ธรรมชาติ", "รหัสเส้น RT-06-04"]],
        carrier: "Kerry", track: ""
      }
    };
    var group = document.querySelector('[data-group="pack"]');
    var confirmBtn = detail.querySelector("[data-confirm]");
    var input = detail.querySelector("[data-track]");
    var carriers = detail.querySelectorAll("[data-carrier]");
    var current = "SL-0409";
    var carrier = "Flash";

    function ready() { return input.value.replace(/\s/g, "").length >= 8; }
    function sync() {
      confirmBtn.disabled = !ready();
      confirmBtn.title = ready() ? "" : "กรอกเลขพัสดุก่อน";
    }
    function setCarrier(name) {
      carrier = name;
      carriers.forEach(function (c) {
        var on = c.dataset.carrier === name;
        c.classList.toggle("is-on", on);
        c.setAttribute("aria-checked", String(on));
      });
    }
    function show(code) {
      var d = ORDERS[code];
      current = code;
      ["code", "sub", "name", "phone", "addr"].forEach(function (k) {
        detail.querySelector('[data-f="' + k + '"]').textContent = d[k];
      });
      detail.querySelector("[data-items]").innerHTML = d.items.map(function (it) {
        return '<li class="item"><span class="sw" style="background:' + it[0] + '" aria-hidden="true"></span><span class="ui grow">' + it[1] + '</span><span class="cap muted">' + it[2] + "</span></li>";
      }).join("") + '<li class="item"><span class="sw sw-ring" aria-hidden="true"></span><span class="ui grow">การ์ดความหมายหิน และถุงผ้า</span><span class="cap muted">ถ่ายวิดีโอตอนแพ็กเก็บไว้</span></li>';
      setCarrier(d.carrier);
      input.value = d.track;
      sync();
      group.querySelectorAll("[data-order]").forEach(function (r) {
        var on = r.dataset.order === code;
        r.classList.toggle("is-sel", on);
        if (on) r.setAttribute("aria-current", "true"); else r.removeAttribute("aria-current");
      });
      if (!d.track) input.focus();
    }

    group.addEventListener("click", function (e) {
      var r = e.target.closest("[data-order]");
      if (r) show(r.dataset.order);
    });
    carriers.forEach(function (c) {
      c.addEventListener("click", function () { setCarrier(c.dataset.carrier); input.focus(); });
    });
    input.addEventListener("input", function () {
      ORDERS[current].track = input.value;
      sync();
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && ready()) confirmBtn.click();
    });
    detail.querySelector("[data-copy]").addEventListener("click", function () {
      var d = ORDERS[current];
      var text = d.name + " " + d.phone + "\n" + d.addr;
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function () {});
      window.boToast("คัดลอกที่อยู่ " + d.name + " แล้ว");
    });
    detail.querySelector("[data-preview]").addEventListener("click", function () {
      var d = ORDERS[current];
      var t = input.value.trim() || "(ยังไม่กรอกเลขพัสดุ)";
      window.boToast("ข้อความถึง" + d.customer + ": ร้านส่งกำไลแล้ว " + carrier + " เลขพัสดุ " + t);
    });
    confirmBtn.addEventListener("click", function () {
      var d = ORDERS[current];
      window.boToast("ส่งเลขพัสดุ " + carrier + " " + input.value.trim() + " ให้" + d.customer + "ทาง LINE แล้ว " + d.code + " เปลี่ยนเป็นส่งแล้ว");
      var next = finish(group, current, "ส่งครบแล้ว", "ไม่มีออเดอร์รอส่ง", "ออเดอร์ที่ชำระแล้วจะขึ้นที่นี่ให้แพ็กและส่ง");
      if (next) show(next);
    });

    var start = location.hash.slice(1);
    show(ORDERS[start] ? start : "SL-0409");
  }
})();
