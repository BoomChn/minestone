/* Login flow behaviour. Prototype only: no server, fake accounts. */
(function () {
  var ROLE_KEY = "bo-role";
  var ACCOUNTS = {
    "shop@silamani.co": { role: "shop", home: "today.html" },
    "reader@silamani.co": { role: "reader", home: "my-queue.html" }
  };
  var page = document.body.dataset.auth;
  var params = new URLSearchParams(location.search);
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function $(s) { return document.querySelector(s); }
  function goHome(email) {
    var acc = ACCOUNTS[email] || ACCOUNTS["shop@silamani.co"];
    localStorage.setItem(ROLE_KEY, acc.role);
    location.href = acc.home;
  }

  // Show / hide password toggles
  document.querySelectorAll("[data-reveal]").forEach(function (btn) {
    var input = document.getElementById(btn.getAttribute("aria-controls"));
    btn.addEventListener("click", function () {
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "ซ่อน" : "แสดง";
      btn.setAttribute("aria-pressed", String(show));
      input.focus();
    });
  });

  // Fill in the email from the URL where the page shows it
  var shown = params.get("email") || "reader@silamani.co";
  document.querySelectorAll("[data-email]").forEach(function (el) { el.textContent = shown; });
  document.querySelectorAll("[data-pass-email]").forEach(function (a) {
    a.href = a.getAttribute("href") + "?email=" + encodeURIComponent(shown);
  });

  if (page === "login") {
    var form = $("#login");
    var email = $("#email");
    var pass = $("#password");
    var passBox = pass.closest(".box");
    var err = $("[data-err]");
    var left = $("[data-left]");
    var note = $("[data-note]");
    var remember = $("#remember");
    var noteOk = note.textContent;
    var noteErr = "ผิดครบ 5 ครั้ง ระบบจะพักบัญชี 15 นาที ถ้าจำรหัสไม่ได้ กดลืมรหัสผ่าน เราจะส่งลิงก์ตั้งรหัสใหม่ไปที่อีเมลนี้";
    var misses = 0;

    remember.checked = localStorage.getItem("bo-remember") !== "0";
    remember.addEventListener("change", function () {
      localStorage.setItem("bo-remember", remember.checked ? "1" : "0");
    });

    function showError() {
      misses = Math.min(misses + 1, 4);
      left.textContent = String(Math.max(5 - misses, 1));
      err.hidden = false;
      passBox.classList.add("is-err");
      pass.setAttribute("aria-invalid", "true");
      note.textContent = noteErr;
    }
    function clearError() {
      err.hidden = true;
      passBox.classList.remove("is-err");
      pass.removeAttribute("aria-invalid");
      note.textContent = noteOk;
    }
    pass.addEventListener("input", function () { if (!err.hidden) clearError(); });

    if (params.get("error")) {
      misses = 1;
      pass.value = "wrongpass";
      showError();
    } else {
      pass.focus();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = email.value.trim().toLowerCase();
      if (!v) { email.focus(); return; }
      if (!pass.value) { pass.focus(); return; }
      if (ACCOUNTS[v]) { goHome(v); return; }
      showError();
      pass.select();
    });
  }

  if (page === "forgot") {
    var fEmail = $("#email");
    var fBox = fEmail.closest(".box");
    fEmail.addEventListener("input", function () { fBox.classList.remove("is-err"); });
    $("#forgot").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = fEmail.value.trim();
      if (!EMAIL_RE.test(v)) { fBox.classList.add("is-err"); fEmail.focus(); return; }
      location.href = "sent.html?email=" + encodeURIComponent(v);
    });
  }

  if (page === "sent") {
    var btn = $("[data-resend]");
    var timerTimeout;
    function fmt(s) { return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
    function run(secs) {
      clearTimeout(timerTimeout);
      btn.disabled = true;
      (function tick() {
        if (secs <= 0) { btn.disabled = false; btn.textContent = "ส่งอีกครั้ง"; return; }
        btn.innerHTML = 'ส่งอีกครั้งได้ใน <span class="num">' + fmt(secs) + "</span>";
        secs -= 1;
        timerTimeout = setTimeout(tick, 1000);
      })();
    }
    btn.addEventListener("click", function () {
      if (btn.disabled) return;
      if (window.boToast) window.boToast("ส่งลิงก์ใหม่ไปที่ " + shown + " แล้ว");
      run(60);
    });
    run(48);
  }

  if (page === "reset") {
    var p1 = $("#new-pass");
    var p2 = $("#new-pass-2");
    var lenRule = $('[data-rule="len"]');
    var matchRule = $('[data-rule="match"]');
    var submit = $("[data-submit]");
    function check() {
      var len = p1.value.length >= 12;
      var match = p2.value.length > 0 && p1.value === p2.value;
      lenRule.classList.toggle("is-met", len);
      matchRule.classList.toggle("is-met", match);
      submit.disabled = !(len && match);
    }
    p1.addEventListener("input", check);
    p2.addEventListener("input", check);
    check();
    p1.focus();
    $("#reset").addEventListener("submit", function (e) {
      e.preventDefault();
      if (submit.disabled) return;
      goHome(shown);
    });
  }
})();
