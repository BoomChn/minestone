// Checkout: LINE Login, then the delivery address, then the order is placed and the status
// page opens. In the prototype LINE Login is a stand-in screen and nothing leaves the browser.
const $ = (id) => document.getElementById(id);
const baht = (n) => `${n.toLocaleString("en-US")} บาท`;
const SHIP = 50;
const items = Cart.items();
if (!items.length) location.replace("cart.html");

const FIELDS = ["name", "tel", "line1", "sub", "dist", "prov", "zip"];
const digits = (s) => s.replace(/\D/g, "");
let useSaved = false;

// Summary
const sub = items.reduce((a, i) => a + i.price, 0);
const hasCustom = items.some((i) => i.kind === "custom");
$("mini").innerHTML = items.map((i) => `<li><div class="thumb${i.kind === "custom" ? " bead" : ""}"><img src="${i.img}" alt="" width="48" height="48"></div><b></b><span>${baht(i.price)}</span></li>`).join("");
[...$("mini").children].forEach((li, k) => { li.querySelector("b").textContent = items[k].name; });
$("sum-n").textContent = `กำไล ${items.length} เส้น`;
$("sum-sub").textContent = baht(sub);
$("sum-total").textContent = $("bb-total").textContent = baht(sub + SHIP);
$("after").textContent = hasCustom
  ? "กดแล้วยังไม่ต้องโอน เราเช็กหินกำไลร้อยเองก่อน ตอบทาง LINE ภายใน 24 ชั่วโมง"
  : "กดแล้วเราเก็บของไว้ให้ 2 ชั่วโมง โอนผ่าน PromptPay แล้วแนบสลิปในหน้าถัดไป";

// LINE account
function signedIn(line) {
  $("login").hidden = true;
  document.body.classList.remove("ll-open");
  $("account").hidden = false;
  $("acc-name").textContent = line.name;
  showSaved(Cart.read("ms-address", null));
}
function askLogin() {
  $("login").hidden = false;
  document.body.classList.add("ll-open");
  $("allow").focus();
}
$("allow").addEventListener("click", () => {
  const line = { name: "มิน", userId: "U-demo" };
  localStorage.setItem("ms-line", JSON.stringify(line));
  signedIn(line);
});
$("switch").addEventListener("click", () => {
  localStorage.removeItem("ms-line");
  localStorage.removeItem("ms-address");
  $("account").hidden = true;
  askLogin();
});

// Saved address: shown as a card, the form opens only to change it.
const oneLine = (a) => `${a.line1} ${a.sub} ${a.dist} ${a.prov} ${a.zip}`;
function showSaved(a) {
  useSaved = !!a;
  $("saved").hidden = !a;
  $("form").classList.toggle("folded", !!a);
  if (!a) return;
  $("sv-name").textContent = `${a.name}  ${a.tel}`;
  $("sv-addr").textContent = oneLine(a);
  FIELDS.forEach((f) => { $(`f-${f}`).value = a[f]; });
  $("f-note").value = a.note || "";
}
$("edit").addEventListener("click", () => {
  useSaved = false;
  $("saved").hidden = true;
  $("form").classList.remove("folded");
  $("f-name").focus();
});

// Validation: say what is wrong under the field, only after the first try.
const HELP = { tel: "ขนส่งโทรหาเบอร์นี้ตอนไปส่ง" };
function check(f) {
  const el = $(`f-${f}`), v = el.value.trim();
  let err = "";
  if (!v) err = "ยังไม่ได้กรอก";
  else if (f === "tel" && !/^0\d{8,9}$/.test(digits(v))) err = "เบอร์โทรควรมี 9 หรือ 10 หลัก ขึ้นต้นด้วย 0";
  else if (f === "zip" && !/^\d{5}$/.test(v)) err = "รหัสไปรษณีย์มี 5 หลัก";
  el.classList.toggle("bad", !!err);
  el.setAttribute("aria-invalid", err ? "true" : "false");
  const note = $(`n-${f}`);
  note.textContent = err || HELP[f] || "";
  note.classList.toggle("err", !!err);
  return !err;
}
let tried = false;
FIELDS.forEach((f) => $(`f-${f}`).addEventListener("input", () => { if (tried) check(f); }));
$("f-zip").addEventListener("input", (e) => { e.target.value = digits(e.target.value); });

$("form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!useSaved) {
    tried = true;
    const bad = FIELDS.filter((f) => !check(f));
    if (bad.length) { $(`f-${bad[0]}`).focus(); return; }
  }
  const address = Object.fromEntries(FIELDS.map((f) => [f, $(`f-${f}`).value.trim()]));
  address.tel = digits(address.tel);
  address.note = $("f-note").value.trim();
  if ($("remember").checked) localStorage.setItem("ms-address", JSON.stringify(address));
  else localStorage.removeItem("ms-address");
  const order = {
    code: `MO-${String(Date.now() % 9000 + 1000)}`,
    items, ship: SHIP, total: sub + SHIP, placed: Date.now(), address,
    // Ready-made only: pay now within 2 hours. Any custom piece: we check stones first.
    status: hasCustom ? "check" : "pay",
    holdUntil: hasCustom ? null : Date.now() + 2 * 36e5,
  };
  localStorage.setItem("ms-order", JSON.stringify(order));
  Cart.clear();
  location.href = "status.html?k=order";
});

const line = Cart.read("ms-line", null);
if (line) signedIn(line); else askLogin();
