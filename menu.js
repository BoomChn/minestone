// Mobile menu: the hamburger opens the main links as a panel under the nav.
document.querySelectorAll(".menu-btn").forEach((btn) => {
  const nav = btn.closest(".nav");
  const set = (open) => {
    nav.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "ปิดเมนู" : "เมนู");
  };
  btn.addEventListener("click", () => set(!nav.classList.contains("open")));
  nav.querySelectorAll(".nav-links a").forEach((a) => a.addEventListener("click", () => set(false)));
  document.addEventListener("click", (e) => { if (!nav.contains(e.target)) set(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) { set(false); btn.focus(); }
  });
});
