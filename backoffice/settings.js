/* ตั้งค่า prototype: everything lives in memory (fake data), nothing is saved. */
(function () {
  var toast = window.boToast || function () {};
  var role = localStorage.getItem("bo-role") || "shop";
  var EMAIL = { shop: "shop@silamani.co", reader: "reader@silamani.co" };

  // บัญชีของฉัน follows the role used at login.
  document.querySelector("[data-my-email]").textContent = EMAIL[role];

  var other = document.querySelector("[data-signout-others]");
  other.addEventListener("click", function () {
    var row = document.querySelector("[data-other-device]");
    if (!row) return;
    row.classList.add("is-gone");
    setTimeout(function () { row.remove(); }, 200);
    other.disabled = true;
    other.textContent = "ไม่มีเครื่องอื่นแล้ว";
    toast("ออกจากเครื่องอื่นแล้ว");
  });

  // บัญชีหลังบ้าน: actions only on the other account.
  document.querySelectorAll("[data-acc]").forEach(function (row) {
    var mine = row.dataset.acc === role;
    row.querySelector("[data-this]").hidden = !mine;
    if (mine) return;
    var acts = row.querySelector("[data-acts]");
    acts.innerHTML =
      '<button class="act" type="button" data-todo="ต้นแบบ: ของจริงจะส่งลิงก์ยืนยันไปที่อีเมลใหม่ และแจ้งเตือนทั้งสองบัญชี">เปลี่ยนอีเมล</button>' +
      '<button class="act warn" type="button" data-close>ปิดบัญชี</button>';
    acts.querySelector("[data-close]").addEventListener("click", function (e) {
      var b = e.currentTarget;
      var closed = row.classList.toggle("is-closed");
      b.textContent = closed ? "เปิดบัญชีอีกครั้ง" : "ปิดบัญชี";
      b.classList.toggle("warn", !closed);
      toast(closed ? "ปิดบัญชีแล้ว บัญชีนี้เข้าระบบไม่ได้จนกว่าจะเปิดอีกครั้ง" : "เปิดบัญชีอีกครั้งแล้ว");
    });
  });

  // รับจองบนเว็บ, kept in step with the sidebar switch.
  var bookSw = document.querySelector("[data-book-switch]");
  var bookState = document.querySelector("[data-book-state]");
  function paintBook(on) {
    bookSw.setAttribute("aria-checked", String(on));
    bookState.textContent = on ? "เปิดอยู่" : "ปิดอยู่";
    bookState.className = "small " + (on ? "sage" : "muted");
  }
  bookSw.addEventListener("click", function () {
    var side = document.querySelector(".side-switch");
    if (side) side.click();
    else paintBook(bookSw.getAttribute("aria-checked") !== "true");
  });
  var sideSw = document.querySelector(".side-switch");
  if (sideSw) sideSw.addEventListener("click", function () {
    setTimeout(function () { paintBook(!sideSw.classList.contains("is-off")); }, 0);
  });

  // Weekly hours.
  var DAYS = [
    ["จันทร์", []], ["อังคาร", ["20:00"]], ["พุธ", []], ["พฤหัสบดี", ["20:00"]],
    ["ศุกร์", []], ["เสาร์", ["10:00", "14:00"]], ["อาทิตย์", ["10:00", "14:00"]]
  ];
  var TIMES = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
  var X = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M4 4l6 6M10 4l-6 6" stroke="#6B7280" stroke-width="1.4" stroke-linecap="round"/></svg>';
  var week = document.querySelector("[data-week]");
  function renderWeek() {
    var total = 0;
    week.innerHTML = DAYS.map(function (d, i) {
      total += d[1].length;
      var slots = d[1].length
        ? d[1].map(function (t, j) {
            return '<span class="slot num">' + t + '<button type="button" aria-label="เอา ' + d[0] + " " + t + ' ออก" data-del="' + i + "," + j + '">' + X + "</button></span>";
          }).join("")
        : '<span class="none">ไม่รับ</span>';
      var free = TIMES.filter(function (t) { return d[1].indexOf(t) < 0; });
      var add = free.length ? '<button class="add-time" type="button" data-add="' + i + '">+ เพิ่มเวลา</button>' : '<span class="add-time"></span>';
      return '<li class="day"><span class="d">' + d[0] + '</span><span class="slots">' + slots + "</span>" + add + "</li>";
    }).join("");
    document.querySelector("[data-week-sum]").textContent = "คิวละ 60 นาที " + total + " คิวต่อสัปดาห์";
  }
  week.addEventListener("click", function (e) {
    var del = e.target.closest("[data-del]");
    var add = e.target.closest("[data-add]");
    if (del) {
      var p = del.dataset.del.split(",");
      DAYS[+p[0]][1].splice(+p[1], 1);
      renderWeek();
    } else if (add) {
      var d = DAYS[+add.dataset.add][1];
      var free = TIMES.filter(function (t) { return d.indexOf(t) < 0; });
      // Pick the free time nearest the evening default, then keep the day sorted.
      d.push(free.indexOf("20:00") >= 0 ? "20:00" : free[free.length - 1]);
      d.sort();
      renderWeek();
    }
  });
  renderWeek();

  // Number fields stay within their limits.
  document.querySelectorAll(".num-field input").forEach(function (inp) {
    inp.addEventListener("change", function () {
      var v = Math.round(+inp.value) || +inp.min;
      inp.value = Math.min(+inp.max, Math.max(+inp.min, v));
      toast("บันทึกแล้ว");
    });
  });

  // Stones.
  var STONES = [
    ["อเมทิสต์", "ธรรมชาติ", "#D9C6E8,#8E6AAE,#5E4280", true],
    ["โรสควอตซ์", "ธรรมชาติ", "#FBE3E6,#E6A9B3,#C47F8C", true],
    ["ไหมทอง", "ธรรมชาติ", "#F4EBD3,#CDB37A,#9C7D3E", true],
    ["ลาพิส ลาซูลี", "ธรรมชาติ", "#9DB2E0,#2F4F9C,#1C2E63", true],
    ["ไทเกอร์อาย", "ธรรมชาติ", "#E9C38A,#A0662A,#5C3814", true],
    ["มูนสโตน", "ธรรมชาติ", "#FFFFFF,#EEF0F4,#D5DAE3", false, "ปิดเมื่อ 2 พ.ย. โดยฝั่งร้าน"],
    ["ซิทริน", "ผ่านความร้อน", "#FBE7B0,#E3A93E,#B1741C", true],
    ["ออบซิเดียน", "ธรรมชาติ", "#6B6E75,#23252A,#0B0C0E", true]
  ];
  var WHO = { shop: "ฝั่งร้าน", reader: "ฝั่งผู้อ่าน" };
  var list = document.querySelector("[data-stones]");
  function renderStones() {
    var on = 0;
    list.innerHTML = STONES.map(function (s, i) {
      if (s[3]) on++;
      var c = s[2].split(",");
      var bead = "background-image:radial-gradient(circle at 35% 30%," + c[0] + " 0%," + c[1] + " 58%," + c[2] + " 100%)" + (i === 5 ? ";box-shadow:inset 0 0 0 1px #E8E6E2" : "");
      return '<li class="stone' + (s[3] ? "" : " is-off") + '">' +
        '<span class="bead" style="' + bead + '"></span>' +
        '<span class="nm"><span class="ui w5 ink">' + s[0] + '</span><span class="cap muted">' + (s[3] ? s[1] : s[4]) + "</span></span>" +
        '<button class="sw" type="button" role="switch" aria-checked="' + s[3] + '" aria-label="' + s[0] + ' ในหน้าร้อยเอง" data-stone="' + i + '"></button>' +
        "</li>";
    }).join("");
    document.querySelector("[data-stone-sum]").textContent = "เปิดอยู่ " + on + " จาก " + STONES.length + " ชนิด";
  }
  list.addEventListener("click", function (e) {
    var b = e.target.closest("[data-stone]");
    if (!b) return;
    var s = STONES[+b.dataset.stone];
    s[3] = !s[3];
    if (!s[3]) s[4] = "ปิดเมื่อวันนี้ โดย" + WHO[role];
    renderStones();
    list.querySelector('[data-stone="' + b.dataset.stone + '"]').focus();
    toast(s[3] ? s[0] + " กลับมาในหน้าร้อยเองแล้ว" : "ซ่อน" + s[0] + "จากหน้าร้อยเองแล้ว");
  });
  renderStones();

  // Connection tests and CSV.
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-test]");
    if (t) toast(t.dataset.test);
    var c = e.target.closest("[data-csv]");
    if (c) toast("ต้นแบบ: ของจริงจะดาวน์โหลดไฟล์ " + c.textContent + ".csv");
  });
})();
