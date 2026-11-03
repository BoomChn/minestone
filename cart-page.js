// Cart page: lists what's in Cart, totals it, and "orders" it. In the prototype ordering
// skips LINE Login and opens the order's status page with a made-up order code.
const $ = (id) => document.getElementById(id);
const baht = (n) => `${n.toLocaleString("en-US")} บาท`;
const SHIP = 50;
const clock = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';

function thumb(i) {
  const bead = i.kind === "custom";
  return `<div class="thumb${bead ? " bead" : ""}"><img src="${i.img}" alt="" width="120" height="120"></div>`;
}

function render() {
  const items = Cart.items();
  const sub = items.reduce((a, i) => a + i.price, 0);
  const hasCustom = items.some((i) => i.kind === "custom");
  $("items").innerHTML = items.map((i) => `
    <li>
      ${thumb(i)}
      <div class="info">
        <div class="top"><h3></h3><span class="price">${baht(i.price)}</span></div>
        <p class="meta"></p>
        ${i.kind === "custom" ? `<span class="flag">${clock}เราเช็กหินให้ก่อนจ่าย</span>` : ""}
        <div class="acts">${i.kind === "custom" ? '<a href="order.html">แก้แบบ</a>' : ""}<button type="button" data-remove="${i.id}">เอาออก</button></div>
      </div>
    </li>`).join("");
  // Names and details go in as text, never as HTML.
  [...$("items").children].forEach((li, k) => {
    li.querySelector("h3").textContent = items[k].name;
    li.querySelector(".meta").textContent = items[k].meta;
  });
  $("cart-n").textContent = items.length ? `${items.length} เส้น` : "";
  $("empty").hidden = items.length > 0;
  $("more").hidden = !items.length;
  $("sum-col").hidden = !items.length;
  $("buybar").hidden = !items.length;
  $("sum-n").textContent = `กำไล ${items.length} เส้น`;
  $("sum-sub").textContent = baht(sub);
  $("sum-total").textContent = baht(sub + SHIP);
  $("bb-total").textContent = baht(sub + SHIP);
  $("next").hidden = !hasCustom;
}

$("items").addEventListener("click", (e) => {
  const b = e.target.closest("[data-remove]");
  if (b) { Cart.remove(b.dataset.remove); render(); }
});

document.querySelectorAll("[data-checkout]").forEach((b) => b.addEventListener("click", () => {
  const items = Cart.items();
  if (!items.length) return;
  const code = `MO-${String(Date.now() % 9000 + 1000)}`;
  const hasCustom = items.some((i) => i.kind === "custom");
  const order = {
    code, items, ship: SHIP,
    total: items.reduce((a, i) => a + i.price, 0) + SHIP,
    placed: Date.now(),
    // Ready-made only: pay now within 2 hours. Any custom piece: we check stones first.
    status: hasCustom ? "check" : "pay",
    holdUntil: hasCustom ? null : Date.now() + 2 * 36e5,
  };
  localStorage.setItem("ms-order", JSON.stringify(order));
  Cart.clear();
  location.href = "status.html?k=order";
}));

render();
