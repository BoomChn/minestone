// Stand-in for LINE Login, shared by checkout and booking. The real flow redirects to LINE's
// own consent screen (access.line.me) and returns with the profile; LINE skips that screen
// for people who already allowed us. Here the screen is drawn in the page and nothing leaves it.
(() => {
  const KEY = "ms-line";
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const logo = '<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="10.5" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="15" cy="4.5" r="3" fill="currentColor"/><circle cx="24.1" cy="20.2" r="3" fill="currentColor"/><circle cx="5.9" cy="20.2" r="3" fill="currentColor"/></svg>';
  const bubble = '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5 1.1-.5 5.9-3.5 8-5.9C21.5 14.3 22 12.7 22 11c0-4.4-4.5-8-10-8Z" fill="#fff"/></svg>';

  function sheet() {
    let el = document.getElementById("line-login");
    if (el) return el;
    el = document.createElement("div");
    el.id = "line-login";
    el.className = "ll";
    el.hidden = true;
    el.innerHTML = `<div class="ll-card" role="dialog" aria-modal="true" aria-labelledby="ll-title">
      <div class="ll-bar">${bubble}LINE</div>
      <div class="ll-body">
        <span class="ll-app">${logo}</span>
        <h2 id="ll-title">Minestone</h2>
        <p>ขอสิทธิ์เข้าถึงข้อมูลนี้ในบัญชี LINE ของคุณ</p>
        <ul class="ll-list"><li><b>ชื่อที่แสดงและรูปโปรไฟล์</b><span>จำเป็น</span></li><li><b>รหัสผู้ใช้ภายใน</b><span>จำเป็น</span></li></ul>
        <label class="ll-friend"><input type="checkbox" checked> เพิ่มเพื่อน Minestone เพื่อรับแจ้งสถานะ</label>
        <div class="ll-acts"><button type="button" class="ll-btn ghost" data-ll="cancel">ยกเลิก</button><button type="button" class="ll-btn" data-ll="allow">อนุญาต</button></div>
      </div>
      <p class="ll-proto">ต้นแบบ: ของจริงหน้านี้ LINE เป็นคนแสดง ถ้าเคยอนุญาตแล้วจะข้ามไปเลย</p>
    </div>`;
    document.body.append(el);
    return el;
  }

  window.LineLogin = {
    user: read,
    signOut() { localStorage.removeItem(KEY); localStorage.removeItem("ms-address"); },
    // Calls done(user) once signed in; asks first if needed. onCancel runs if they back out.
    ensure(done, onCancel) {
      const u = read();
      if (u) return done(u);
      const el = sheet();
      el.hidden = false;
      document.body.classList.add("ll-open");
      el.querySelector('[data-ll="allow"]').focus();
      el.onclick = (e) => {
        const act = e.target.closest("[data-ll]")?.dataset.ll;
        if (!act) return;
        el.hidden = true;
        document.body.classList.remove("ll-open");
        if (act === "allow") {
          const user = { name: "มิน", userId: "U-demo" };
          localStorage.setItem(KEY, JSON.stringify(user));
          done(user);
        } else if (onCancel) onCancel();
      };
    },
  };
})();
