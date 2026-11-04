/* Backoffice prototype shell: sidebar, account menu, "not designed yet" toast.
   A page declares <body data-page="today" data-role="shop"> and an empty <aside class="side" data-side>.
   data-role is optional: only reader-only pages set it; the rest read the role saved at login. */
(function () {
  var ROLE_KEY = "bo-role";
  var body = document.body;
  var role = body.dataset.role || localStorage.getItem(ROLE_KEY) || "shop";
  localStorage.setItem(ROLE_KEY, role);

  var NAV = {
    shop: [
      { id: "today", label: "วันนี้", href: "today.html", count: 6 },
      { id: "queue", label: "คิวดูดวง", href: "queue.html", count: 9 },
      { id: "orders", label: "ออเดอร์", count: 14 },
      { id: "customers", label: "ลูกค้า", href: "customers.html" },
      { id: "stock", label: "สต็อกและหิน" },
      { id: "settings", label: "ตั้งค่า" }
    ],
    reader: [
      { id: "queue", label: "คิวของฉัน", href: "my-queue.html", count: 3 },
      { id: "today", label: "ต้องทำตอนนี้", href: "today.html", count: 6 },
      { id: "orders", label: "ออเดอร์", count: 14 },
      { id: "customers", label: "ลูกค้า", href: "customers.html" },
      { id: "stock", label: "สต็อกและหิน" },
      { id: "settings", label: "ตั้งค่า" }
    ]
  };
  var ACCOUNT = {
    shop: { initial: "ร", name: "ฝั่งร้าน", email: "shop@silamani.co" },
    reader: { initial: "อ", name: "ฝั่งผู้อ่าน", email: "reader@silamani.co" }
  };

  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "bo-toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2400);
  }
  window.boToast = toast;

  // Anything marked data-todo is not designed yet.
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-todo]");
    if (!t) return;
    e.preventDefault();
    toast(t.dataset.todo || "หน้านี้ยังไม่ได้ออกแบบ");
  });

  // Copy a shop link to send in any chat. data-copy is relative to this page.
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]");
    if (!b) return;
    var url = new URL(b.dataset.copy, location.href).href;
    var label = b.querySelector("[data-label]");
    if (!b.dataset.idle) b.dataset.idle = label.textContent;
    function shown() {
      b.classList.add("is-done");
      label.textContent = b.dataset.done || "คัดลอกแล้ว";
      clearTimeout(b._t);
      b._t = setTimeout(function () { b.classList.remove("is-done"); label.textContent = b.dataset.idle; }, 2000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(shown, shown);
    else shown();
  });

  var side = document.querySelector("[data-side]");
  if (!side) return;
  var page = body.dataset.page;
  var acc = ACCOUNT[role];
  var items = NAV[role].map(function (n) {
    var cur = n.id === page ? ' aria-current="page"' : "";
    var href = n.href ? ' href="' + n.href + '"' : ' href="#" data-todo="หน้า' + n.label + 'ยังไม่ได้ออกแบบ"';
    var count = n.count ? '<span class="count">' + n.count + "</span>" : "";
    return '<a class="nav-item"' + href + cur + "><span>" + n.label + "</span>" + count + "</a>";
  }).join("");

  side.innerHTML =
    '<div class="side-top">' +
      '<a class="side-brand" href="' + (role === "reader" ? "my-queue.html" : "today.html") + '" aria-label="Silamani หลังบ้าน">' +
        '<span class="mark"><svg width="24" height="24" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="10.5" fill="none" stroke="#111827" stroke-width="1.4"/><circle cx="15" cy="4.5" r="3" fill="#111827"/><circle cx="24.1" cy="20.2" r="3" fill="#111827"/><circle cx="5.9" cy="20.2" r="3" fill="#111827"/></svg><span>Silamani</span></span>' +
        '<span class="sub">หลังบ้าน</span>' +
      "</a>" +
      '<nav class="side-nav" aria-label="เมนูหลังบ้าน">' + items + "</nav>" +
    "</div>" +
    '<div class="side-foot">' +
      '<button class="side-switch" type="button" aria-pressed="true">' +
        '<span><span class="small">รับจองบนเว็บ</span><span class="state">เปิดอยู่</span></span>' +
        '<span class="toggle" aria-hidden="true"></span>' +
      "</button>" +
      '<button class="account" type="button" aria-haspopup="true" aria-expanded="false">' +
        '<span class="avatar' + (role === "reader" ? " reader" : "") + '">' + acc.initial + "</span>" +
        '<span><span class="small" style="display:block">' + acc.name + '</span><span class="cap muted">' + acc.email + "</span></span>" +
      "</button>" +
      '<div class="account-menu"><a href="index.html" data-logout>ออกจากระบบ</a></div>' +
    "</div>";

  var sw = side.querySelector(".side-switch");
  sw.addEventListener("click", function () {
    var on = sw.classList.toggle("is-off") === false;
    sw.setAttribute("aria-pressed", String(on));
    sw.querySelector(".state").textContent = on ? "เปิดอยู่" : "ปิดอยู่ ลูกค้าจองใหม่ไม่ได้";
  });

  var accBtn = side.querySelector(".account");
  var menu = side.querySelector(".account-menu");
  accBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    var open = menu.classList.toggle("is-open");
    accBtn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", function () {
    menu.classList.remove("is-open");
    accBtn.setAttribute("aria-expanded", "false");
  });
  side.querySelector("[data-logout]").addEventListener("click", function () {
    localStorage.removeItem(ROLE_KEY);
  });
})();
