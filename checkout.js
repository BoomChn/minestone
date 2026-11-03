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

// LINE account (line-login.js). Backing out of LINE returns to the cart.
const toCart = () => location.assign("cart.html");
function signedIn(line) {
  $("account").hidden = false;
  $("acc-name").textContent = line.name;
  showSaved(Cart.read("ms-address", null));
}
$("switch").addEventListener("click", () => {
  LineLogin.signOut();
  $("account").hidden = true;
  showSaved(null);
  LineLogin.ensure(signedIn, toCart);
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
const HELP = { tel: "ขนส่งโทรหาเบอร์นี้ตอนไปส่ง", zip: "พิมพ์แล้วเราเติมเขตและจังหวัดให้" };
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
$("f-zip").addEventListener("input", (e) => { e.target.value = digits(e.target.value); fillFromZip(e.target.value); });

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

LineLogin.ensure(signedIn, toCart);

// Postcode first: fill province and district, and let the customer pick the subdistrict
// when one postcode covers several. Everything stays editable.
function setField(f, v) { const el = $(`f-${f}`); el.value = v; if (tried) check(f); }
function fillFromZip(zip) {
  $("pick").hidden = true;
  if (zip.length !== 5 || !window.ZIP_TH) return;
  const { P, A, Z } = window.ZIP_TH;
  const rows = (Z[zip] || []).map(([sub, a]) => ({ sub, dist: A[a][0], prov: P[A[a][1]] }));
  const note = $("n-zip");
  note.classList.remove("err");
  if (!rows.length) { note.textContent = "ไม่พบรหัสนี้ กรอกเขตและจังหวัดเองได้"; return; }
  setField("prov", rows[0].prov);
  const dists = [...new Set(rows.map((r) => r.dist))];
  setField("dist", dists.length === 1 ? dists[0] : "");
  setField("sub", rows.length === 1 ? rows[0].sub : "");
  note.textContent = "เติมให้แล้ว แก้ได้ถ้าไม่ตรง";
  if (rows.length === 1) return;
  const unit = rows[0].prov === "กรุงเทพมหานคร" ? "แขวง" : "ตำบล";
  $("pick-label").textContent = dists.length === 1 ? `รหัสนี้มีหลาย${unit} เลือกของคุณ` : "รหัสนี้มีหลายพื้นที่ เลือกของคุณ";
  $("chips").innerHTML = rows.map((r, i) => `<button type="button" class="ck-chip" data-i="${i}" aria-pressed="false"></button>`).join("");
  [...$("chips").children].forEach((b, i) => { b.textContent = dists.length === 1 ? rows[i].sub : `${rows[i].sub} ${unit === "แขวง" ? "เขต" : "อำเภอ"}${rows[i].dist}`; });
  $("chips").onclick = (e) => {
    const b = e.target.closest(".ck-chip");
    if (!b) return;
    const r = rows[b.dataset.i];
    setField("sub", r.sub);
    setField("dist", r.dist);
    [...$("chips").children].forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
  };
  $("pick").hidden = false;
}
