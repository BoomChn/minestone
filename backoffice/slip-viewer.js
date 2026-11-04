/* ดูรูปสลิปเต็ม: reads the slip shown in the วันนี้ detail pane, opens it full screen,
   zoom / pan / rotate, and mirrors the bank tick + confirm/reject so the check can finish here. */
(function () {
  var detail = document.querySelector("[data-detail]");
  if (!detail) return;

  var BASE_W = 360, BASE_H = 780, FILE_W = 1080; // the uploaded screenshot is 1080 × 2340
  var MINI = 64 / BASE_W;
  var QR = '<svg width="72" height="72" viewBox="0 0 84 84" aria-hidden="true"><rect width="84" height="84" fill="#fff"/><path d="M0 0h28v28H0zM4 4v20h20V4zM8 8h12v12H8zM56 0h28v28H56zM60 4v20h20V4zM64 8h12v12H64zM0 56h28v28H0zM4 60v20h20V60zM8 64h12v12H8z" fill="#111" fill-rule="evenodd"/><path d="M36 0h4v4h-4zM44 4h4v8h-4zM32 12h8v4h-8zM36 20h4v8h-4zM44 24h8v4h-8zM0 36h8v4H0zM12 32h4v8h-4zM20 40h8v4h-8zM32 32h12v4H32zM48 36h4v8h-4zM56 32h8v4h-8zM68 36h4v4h-4zM76 32h8v8h-8zM36 44h4v12h-4zM44 48h8v4h-8zM56 44h4v8h-4zM64 48h12v4H64zM32 60h8v4h-8zM44 56h4v8h-4zM52 60h12v4H52zM68 60h4v12h-4zM76 64h8v4h-8zM36 72h12v4H36zM52 68h4v12h-4zM60 76h4v8h-4zM76 76h8v8h-8zM40 80h8v4h-8zM4 44h4v4H4zM24 48h4v4h-4z" fill="#111"/></svg>';
  var CHECK = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#2E6A5C"/><path d="M4.6 8.2l2.2 2.2 4.6-4.8" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function f(k) { var el = detail.querySelector('[data-f="' + k + '"]'); return el ? el.textContent : ""; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function slipHTML(d) {
    var initial = d.payer.replace(/^(น\.ส\.|นาย|นาง)\s*/, "").charAt(0);
    return '<div class="sv-slip">' +
      '<div class="bar"><span>' + esc(d.time) + '</span><svg width="40" height="12" viewBox="0 0 40 12" fill="none" aria-hidden="true"><rect x="0" y="6" width="3" height="6" rx="1" fill="#000"/><rect x="5" y="4" width="3" height="8" rx="1" fill="#000"/><rect x="10" y="2" width="3" height="10" rx="1" fill="#000"/><rect x="18" y="1" width="20" height="10" rx="3" stroke="#000" stroke-opacity=".4"/><rect x="20" y="3" width="13" height="6" rx="1.5" fill="#000"/></svg></div>' +
      '<div class="head"><svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="26" fill="#1B7F4B"/><path d="M15.5 26.5l7 7 14-14.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg><b>โอนเงินสำเร็จ</b><span>' + esc(d.slipTime) + '</span></div>' +
      '<div class="c party">' +
        '<div class="p"><span class="av">' + esc(initial) + '</span><span><span class="l">จาก</span><span class="n">' + esc(d.payer) + '</span><span class="s">' + esc(d.acct) + '</span></span></div>' +
        '<div class="arrow"><svg width="12" height="18" viewBox="0 0 12 18" fill="none" aria-hidden="true"><path d="M6 1v15M1.5 11.5 6 16l4.5-4.5" stroke="#9CA3AF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
        '<div class="p"><span class="av to">S</span><span><span class="l">ไปยัง</span><span class="n">ร้าน Silamani</span><span class="s">พร้อมเพย์ xxx-xxx-7720</span></span></div>' +
      '</div>' +
      '<div class="c money">' +
        '<div class="kv2"><span class="muted">จำนวนเงิน</span><span class="amt">' + esc(d.slipAmt) + ' <small>บาท</small></span></div>' +
        '<div class="kv2"><span class="muted">ค่าธรรมเนียม</span><span>0.00 บาท</span></div>' +
        '<div class="ref"><span class="s">เลขที่รายการ</span><b>' + esc(d.ref) + '</b></div>' +
      '</div>' +
      '<div class="c qr">' + QR + '<span><b>สแกนตรวจสอบสลิป</b><span class="s">ใช้ยืนยันรายการกับธนาคารผู้รับ</span></span></div>' +
    '</div>';
  }

  // ----- dialog shell -----
  var dlg = document.createElement("dialog");
  dlg.className = "sv";
  dlg.setAttribute("aria-labelledby", "sv-h");
  dlg.innerHTML =
    '<div class="sv-top">' +
      '<div class="sv-title"><h2 id="sv-h" data-sv="title"></h2><p data-sv="meta"></p></div>' +
      '<div class="sv-tools" role="toolbar" aria-label="ซูมและหมุนสลิป">' +
        '<button class="sv-tool icon" type="button" data-z="out" aria-label="ซูมออก" title="ซูมออก (−)"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>' +
        '<span class="sv-zoom" data-sv="zoom" aria-live="polite">33%</span>' +
        '<button class="sv-tool icon" type="button" data-z="in" aria-label="ซูมเข้า" title="ซูมเข้า (+)"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9h10M9 4v10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>' +
        '<span class="sep"></span>' +
        '<button class="sv-tool" type="button" data-z="fit" aria-pressed="true" title="พอดีจอ (0)">พอดีจอ</button>' +
        '<button class="sv-tool" type="button" data-z="real" aria-pressed="false" title="ขนาดจริง (1)">ขนาดจริง</button>' +
        '<span class="sep"></span>' +
        '<button class="sv-tool" type="button" data-z="rot" title="หมุน (R)"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M14.5 9a5.5 5.5 0 1 1-1.8-4.07" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M13.2 2.2v3.2H10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>หมุน</button>' +
      '</div>' +
      '<div class="sv-right">' +
        '<button class="sv-dl" type="button" data-todo="ในของจริงจะดาวน์โหลดไฟล์สลิปต้นฉบับ"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 3v8.5M5.5 8.2 9 11.6l3.5-3.4M3.5 14.5h11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>ดาวน์โหลดไฟล์</button>' +
        '<button class="sv-close" type="button" data-sv-close>ปิด <kbd>Esc</kbd></button>' +
      '</div>' +
    '</div>' +
    '<div class="sv-body">' +
      '<div class="sv-stage" data-sv="stage" aria-label="รูปสลิป ลากเพื่อเลื่อน ดับเบิลคลิกเพื่อซูม">' +
        '<div class="sv-move" data-sv="move"></div>' +
        '<div class="sv-nav" data-sv="nav"><span class="sv-hint">ลากเพื่อเลื่อน  ดับเบิลคลิกเพื่อกลับไปพอดีจอ</span><div class="sv-mini" data-sv="mini"></div></div>' +
      '</div>' +
      '<aside class="sv-rail" aria-label="เทียบกับออเดอร์">' +
        '<div class="sv-rail-top">' +
          '<div><h3 class="h-title ink">เทียบกับออเดอร์</h3><p class="small muted" data-sv="sub"></p></div>' +
          '<div data-sv="kv"></div>' +
        '</div>' +
        '<div class="sv-rail-bottom">' +
          '<div class="card bank"><p class="ui" style="line-height:24px">สลิปปลอมได้ ยอดในแอปธนาคารปลอมไม่ได้ เปิด <b class="w6">K SHOP</b> แล้วหารายการ <b class="w6" data-sv="hint"></b></p>' +
            '<label class="tick"><input type="checkbox" data-sv="seen"><span class="box"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2l2.2 2.2 4.8-5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="ui-tight w5">เห็นเงินเข้าในแอปแล้ว</span></label></div>' +
          '<div class="sv-acts"><button class="btn btn-lg err" type="button" data-sv="reject">สลิปไม่ผ่าน</button><button class="btn-primary num" type="button" data-sv="confirm"></button></div>' +
        '</div>' +
      '</aside>' +
    '</div>';
  document.body.appendChild(dlg);

  function q(k) { return dlg.querySelector('[data-sv="' + k + '"]'); }
  var stage = q("stage"), move = q("move"), nav = q("nav"), mini = q("mini"), zoomEl = q("zoom");
  var seenV = q("seen"), confirmV = q("confirm");
  var tools = {}; dlg.querySelectorAll("[data-z]").forEach(function (b) { tools[b.dataset.z] = b; });

  // ----- view state -----
  var s = 1, tx = 0, ty = 0, rot = 0, fitS = 1;
  function dims() { return rot % 180 ? [BASE_H, BASE_W] : [BASE_W, BASE_H]; }
  function stageSize() { return [stage.clientWidth, stage.clientHeight]; }
  function computeFit() {
    var d = dims(), st = stageSize();
    fitS = Math.min((st[0] - 48) / d[0], (st[1] - 16) / d[1]);
  }
  var MAX = 4; // 133% of the file
  function clampPan() {
    var d = dims(), st = stageSize();
    var ox = Math.max(0, (d[0] * s - st[0]) / 2 + 24), oy = Math.max(0, (d[1] * s - st[1]) / 2 + 24);
    tx = Math.max(-ox, Math.min(ox, tx));
    ty = Math.max(-oy, Math.min(oy, ty));
  }
  function render(anim) {
    clampPan();
    move.classList.toggle("anim", !!anim);
    move.style.transform = "translate(-50%,-50%) translate(" + tx + "px," + ty + "px) rotate(" + rot + "deg) scale(" + s + ")";
    var pct = Math.round(s * BASE_W / FILE_W * 100);
    var atFit = Math.abs(s - fitS) < 0.001, atReal = Math.abs(s - 3) < 0.001;
    zoomEl.textContent = pct + "%";
    tools.fit.setAttribute("aria-pressed", atFit ? "true" : "false");
    tools.real.setAttribute("aria-pressed", atReal ? "true" : "false");
    tools.out.disabled = s <= fitS + 0.001;
    tools["in"].disabled = s >= MAX - 0.001;
    var d = dims(), st = stageSize();
    var big = d[0] * s > st[0] + 1 || d[1] * s > st[1] + 1;
    stage.classList.toggle("can-pan", big);
    nav.classList.toggle("is-on", big);
    mini.style.display = rot % 360 === 0 ? "" : "none";
    if (big && rot % 360 === 0) {
      // visible stage rect in slip coordinates
      var x0 = (BASE_W / 2) + (-st[0] / 2 - tx) / s, y0 = (BASE_H / 2) + (-st[1] / 2 - ty) / s;
      var x1 = x0 + st[0] / s, y1 = y0 + st[1] / s;
      x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(BASE_W, x1); y1 = Math.min(BASE_H, y1);
      var vp = mini.querySelector(".vp");
      vp.style.left = x0 * MINI + "px"; vp.style.top = y0 * MINI + "px";
      vp.style.width = (x1 - x0) * MINI + "px"; vp.style.height = (y1 - y0) * MINI + "px";
    }
  }
  function zoomTo(ns, px, py, anim) { // px,py: point relative to stage centre that stays put
    ns = Math.max(fitS, Math.min(MAX, ns));
    px = px || 0; py = py || 0;
    tx = px - (px - tx) * (ns / s);
    ty = py - (py - ty) * (ns / s);
    s = ns;
    if (Math.abs(s - fitS) < 0.001) { tx = 0; ty = 0; }
    render(anim);
  }
  function fit(anim) { computeFit(); s = fitS; tx = 0; ty = 0; render(anim); }
  function rel(e) { var r = stage.getBoundingClientRect(); return [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2]; }

  tools.out.addEventListener("click", function () { zoomTo(s / 1.25, 0, 0, true); });
  tools["in"].addEventListener("click", function () { zoomTo(s * 1.25, 0, 0, true); });
  tools.fit.addEventListener("click", function () { fit(true); });
  tools.real.addEventListener("click", function () { zoomTo(3, 0, 0, true); });
  tools.rot.addEventListener("click", function () { rot += 90; fit(true); });

  stage.addEventListener("dblclick", function (e) {
    var p = rel(e);
    if (s > fitS + 0.001) fit(true); else zoomTo(2.4, p[0], p[1], true);
  });
  stage.addEventListener("wheel", function (e) {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) { var p = rel(e); zoomTo(s * Math.exp(-e.deltaY * 0.01), p[0], p[1], false); return; }
    tx -= e.deltaX; ty -= e.deltaY; render(false);
  }, { passive: false });

  var drag = null;
  stage.addEventListener("pointerdown", function (e) {
    if (!stage.classList.contains("can-pan") || e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, tx: tx, ty: ty };
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("is-dragging");
  });
  stage.addEventListener("pointermove", function (e) {
    if (!drag) return;
    tx = drag.tx + e.clientX - drag.x; ty = drag.ty + e.clientY - drag.y; render(false);
  });
  function endDrag() { drag = null; stage.classList.remove("is-dragging"); }
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  dlg.addEventListener("keydown", function (e) {
    if (e.target.tagName === "INPUT" && e.key === " ") return;
    var k = e.key, step = 60;
    if (k === "+" || k === "=") zoomTo(s * 1.25, 0, 0, true);
    else if (k === "-" || k === "_") zoomTo(s / 1.25, 0, 0, true);
    else if (k === "0") fit(true);
    else if (k === "1") zoomTo(3, 0, 0, true);
    else if (k === "r" || k === "R") { rot += 90; fit(true); }
    else if (k === "ArrowUp") { ty += step; render(true); }
    else if (k === "ArrowDown") { ty -= step; render(true); }
    else if (k === "ArrowLeft" && document.activeElement === stage) { tx += step; render(true); }
    else if (k === "ArrowRight" && document.activeElement === stage) { tx -= step; render(true); }
    else return;
    e.preventDefault();
  });
  stage.tabIndex = 0;

  window.addEventListener("resize", function () { if (dlg.open) { var wasFit = Math.abs(s - fitS) < 0.001; computeFit(); if (wasFit) s = fitS; else s = Math.max(s, fitS); render(false); } });

  // ----- sync with the detail pane -----
  var seenMain = detail.querySelector("[data-seen]");
  var confirmMain = detail.querySelector("[data-confirm]");
  var rejectMain = detail.querySelector("[data-reject]");

  function syncConfirm() {
    confirmV.textContent = confirmMain.textContent;
    confirmV.disabled = !seenV.checked;
    confirmV.title = seenV.checked ? "" : "ติ๊ก 'เห็นเงินเข้าในแอปแล้ว' ก่อน";
  }
  seenV.addEventListener("change", function () {
    seenMain.checked = seenV.checked;
    seenMain.dispatchEvent(new Event("change"));
    syncConfirm();
  });
  confirmV.addEventListener("click", function () { dlg.close(); confirmMain.click(); });
  q("reject").addEventListener("click", function () { dlg.close(); rejectMain.click(); });
  dlg.querySelector("[data-sv-close]").addEventListener("click", function () { dlg.close(); });

  function open() {
    var sub = f("sub");
    var name = sub.split(" ")[0];
    var d = { time: (f("paidAt").match(/\d{1,2}:\d{2}/) || [""])[0], slipTime: f("slipTime"), payer: f("payer"), acct: f("acct"), slipAmt: f("slipAmt"), ref: f("ref") };
    q("title").textContent = "สลิป " + f("code") + " " + name;
    q("meta").textContent = f("attached").replace("ลูกค้าแนบ ", "ลูกค้าแนบ 4 พ.ย. ") + "  ไฟล์ JPG 1080 × 2340";
    q("sub").textContent = sub.slice(name.length + 1);
    q("hint").textContent = f("bankHint");
    q("kv").innerHTML =
      '<div class="kv"><span class="ui muted">ยอดที่ต้องได้</span><span class="h-title num">' + esc(f("due")) + '</span></div>' +
      '<div class="kv"><span class="ui muted">ยอดในสลิป</span><span class="match">' + CHECK + '<span class="ui-tight w5 num">' + esc(f("slipMatch")) + '</span></span></div>' +
      '<div class="kv"><span class="ui muted">เวลาโอน</span><span class="ui-tight">' + esc(f("paidAt")) + '</span></div>' +
      '<div class="kv"><span class="ui muted">ผู้โอน</span><span class="ui-tight">' + esc(f("payer2")) + '</span></div>' +
      '<div class="kv"><span class="ui muted">สลิปนี้เคยใช้ไหม</span><span class="ui-tight">ไม่เคย</span></div>';
    move.innerHTML = slipHTML(d);
    mini.innerHTML = slipHTML(d) + '<span class="vp"></span>';
    seenV.checked = seenMain.checked;
    syncConfirm();
    rot = 0;
    dlg.showModal();
    fit(false);
    stage.focus();
  }

  detail.addEventListener("click", function (e) {
    if (e.target.closest("[data-view-slip]")) { e.preventDefault(); open(); }
  });
})();
