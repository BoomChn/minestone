/* วันนี้: switch between slips, confirm or reject. Fake data only. */
(function () {
  var SLIPS = {
    "SL-0412": {
      code: "SL-0412", sub: "คุณแพร ดูดวง 60 นาที เสาร์ 7 พ.ย. 10:00 – 11:00",
      slipTime: "4 พ.ย. 69 14:08 น.", payer: "น.ส. แพรวา ว.", payer2: "น.ส. แพรวา ว.", acct: "xxx-x-x4821-x",
      slipAmt: "990.00", ref: "016308140821BPM04412", attached: "ลูกค้าแนบ 14:11 น.",
      due: "990 บาท", slipMatch: "990.00 ตรงกัน", paidAt: "4 พ.ย. 14:08 น.", bankHint: "990 บาท เวลา 14:08", amount: "990"
    },
    "SL-0421": {
      code: "SL-0421", sub: "คุณมายด์ กำไล 2 เส้น สำเร็จรูปและร้อยเอง",
      slipTime: "4 พ.ย. 69 14:17 น.", payer: "น.ส. ธนพร ม.", payer2: "น.ส. ธนพร ม.", acct: "xxx-x-x0937-x",
      slipAmt: "1,780.00", ref: "016308141702BPM07730", attached: "ลูกค้าแนบ 14:20 น.",
      due: "1,780 บาท", slipMatch: "1,780.00 ตรงกัน", paidAt: "4 พ.ย. 14:17 น.", bankHint: "1,780 บาท เวลา 14:17", amount: "1,780"
    }
  };

  var detail = document.querySelector("[data-detail]");
  var seen = detail.querySelector("[data-seen]");
  var confirmBtn = detail.querySelector("[data-confirm]");
  var rejectBtn = detail.querySelector("[data-reject]");
  var group = document.querySelector('[data-group="slip"]');
  var current = "SL-0412";

  function syncConfirm() {
    confirmBtn.disabled = !seen.checked;
    confirmBtn.title = seen.checked ? "" : "ติ๊ก 'เห็นเงินเข้าในแอปแล้ว' ก่อน";
  }

  function show(code) {
    var d = SLIPS[code];
    current = code;
    Object.keys(d).forEach(function (k) {
      var el = detail.querySelector('[data-f="' + k + '"]');
      if (el) el.textContent = d[k];
    });
    confirmBtn.textContent = "ยืนยันรับเงิน " + d.amount + " บาท";
    seen.checked = false;
    syncConfirm();
    group.querySelectorAll("[data-slip]").forEach(function (r) {
      var on = r.dataset.slip === code;
      r.classList.toggle("is-sel", on);
      if (on) r.setAttribute("aria-current", "true"); else r.removeAttribute("aria-current");
    });
  }

  function done(msg) {
    var row = group.querySelector('[data-slip="' + current + '"]');
    row.remove();
    var left = group.querySelectorAll("[data-slip]");
    group.querySelector("[data-count]").textContent = left.length;
    window.boToast(msg);
    if (left.length) { show(left[0].dataset.slip); return; }
    group.querySelector(".group-head").insertAdjacentHTML("afterend", '<p class="cap muted" style="padding:4px 16px 8px">ตรวจครบแล้ว</p>');
    detail.innerHTML = '<div class="empty"><h2 class="h-title">ไม่มีสลิปรอตรวจ</h2><p class="ui muted">สลิปใหม่จะขึ้นที่นี่ และแจ้งเตือนทาง LINE ของร้าน</p></div>';
  }

  group.addEventListener("click", function (e) {
    var r = e.target.closest("[data-slip]");
    if (r) show(r.dataset.slip);
  });
  seen.addEventListener("change", syncConfirm);
  confirmBtn.addEventListener("click", function () {
    done("ยืนยันรับเงิน " + current + " แล้ว ลูกค้าได้ข้อความทาง LINE");
  });
  rejectBtn.addEventListener("click", function () {
    done(current + " สลิปไม่ผ่าน ระบบส่งข้อความขอสลิปใหม่ให้ลูกค้า");
  });
  syncConfirm();
  var fromHash = decodeURIComponent(location.hash.slice(1));
  if (SLIPS[fromHash] && fromHash !== current) show(fromHash);
})();
