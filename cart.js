// Cart shared by every page. It lives in this browser only (localStorage) and reserves
// nothing: stock is held when the order is placed, not when a bracelet is added.
(() => {
  const KEY = "ms-cart";
  const read = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
  const Cart = {
    items: () => read(KEY, []),
    save(items) { localStorage.setItem(KEY, JSON.stringify(items)); Cart.badge(); },
    add(item) { Cart.save([...Cart.items(), { ...item, id: Date.now().toString(36) }]); Cart.toast(item.name); },
    remove(id) { Cart.save(Cart.items().filter((i) => i.id !== id)); },
    clear() { Cart.save([]); },
    read,
    badge() {
      const n = Cart.items().length;
      document.querySelectorAll("[data-cart-count]").forEach((el) => { el.textContent = n; el.hidden = !n; });
    },
    toast(name) {
      let t = document.getElementById("cart-toast");
      if (!t) {
        t = document.createElement("div");
        t.id = "cart-toast";
        t.className = "cart-toast";
        t.setAttribute("role", "status");
        document.body.append(t);
      }
      t.innerHTML = `<span>ใส่ <b></b> ในตะกร้าแล้ว</span><a href="cart.html">ดูตะกร้า</a>`;
      t.querySelector("b").textContent = name;
      t.classList.add("on");
      clearTimeout(t._h);
      t._h = setTimeout(() => t.classList.remove("on"), 3200);
    },
  };
  window.Cart = Cart;
  Cart.badge();
  addEventListener("storage", (e) => { if (e.key === KEY) Cart.badge(); });
})();
