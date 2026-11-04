/* ลูกค้า: live search + filter chips on the list; ?name= header swap on the history page. Fake data only. */
(function () {
  // History page: swap only the header name so every row "opens" its own customer.
  var nameEl = document.querySelector("[data-cust-name]");
  if (nameEl) {
    var n = new URLSearchParams(location.search).get("name");
    if (n) {
      nameEl.textContent = n;
      document.title = n + " ประวัติลูกค้า หลังบ้าน Silamani (prototype)";
    }
    return;
  }

  var rows = Array.prototype.slice.call(document.querySelectorAll("[data-rows] .tr"));
  if (!rows.length) return;
  var input = document.querySelector("[data-q]");
  var box = document.querySelector("[data-search]");
  var clearBtn = document.querySelector("[data-clear]");
  var chips = Array.prototype.slice.call(document.querySelectorAll("[data-chip]"));
  var empty = document.querySelector("[data-empty]");
  var emptyTitle = document.querySelector("[data-empty-title]");
  var shown = document.querySelector("[data-shown]");
  var more = document.querySelector("[data-more]");
  var chip = "all";

  function norm(s) { return String(s).toLowerCase().replace(/[\s\-.]/g, ""); }

  function apply() {
    var raw = input.value.trim();
    var q = norm(raw);
    var count = 0;
    rows.forEach(function (r) {
      var hay = norm(r.dataset.name + " " + r.dataset.line + " " + r.dataset.phone);
      var okQ = !q || hay.indexOf(q) !== -1;
      var okC = chip === "all" || (" " + r.dataset.tags + " ").indexOf(" " + chip + " ") !== -1;
      r.hidden = !(okQ && okC);
      if (!r.hidden) count++;
    });
    box.classList.toggle("has-q", raw.length > 0);
    empty.hidden = count > 0;
    if (!count) {
      emptyTitle.textContent = raw ? "ไม่พบลูกค้าที่ตรงกับ “" + raw + "”" : "ไม่พบลูกค้าในกลุ่มนี้";
    }
    var filtered = raw || chip !== "all";
    shown.textContent = filtered
      ? "พบ " + count + " คน ใน 9 คนที่แสดงอยู่"
      : "แสดง 9 จาก 128 คน เรียงจากติดต่อล่าสุด";
    more.hidden = filtered;
  }

  input.addEventListener("input", apply);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { input.value = ""; apply(); }
  });
  clearBtn.addEventListener("click", function (e) {
    e.preventDefault();
    input.value = "";
    apply();
    input.focus();
  });
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      chip = c.dataset.chip;
      chips.forEach(function (o) { o.setAttribute("aria-pressed", String(o === c)); });
      apply();
    });
  });
})();
