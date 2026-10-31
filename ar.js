// Try on through the camera. MediaPipe finds the hand; the chosen beads are drawn as a loop around
// the wrist, sized from the hand itself so 6, 8 and 10 mm read true. Everything runs on the phone:
// no frame is uploaded or kept unless the person taps the shutter and saves it themselves.
const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const $ = (id) => document.getElementById(id);
const root = $("ar"), video = $("ar-video"), canvas = $("ar-canvas"), ctx = canvas.getContext("2d");
const statusEl = $("ar-status"), aim = $("ar-aim"), shot = $("ar-shot");

let landmarkerP = null, landmarker = null;
let stream = null, opts = null, raf = 0, running = false, lastTime = -1;
let mirror = false, pose = null, lostAt = 0, rot = 0, dpr = 1;

/* ---------- Small vector helpers (x, y in canvas pixels, z in the same scale) ---------- */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => mul(a, 1 / (len(a) || 1));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp = (a, b, t) => add(a, mul(sub(b, a), t));

/* ---------- Bead pictures: the photographed beads, cut out, plus a darker copy for the far side ---------- */
const sprites = {};
function sprite(id) {
  if (sprites[id]) return sprites[id];
  const s = { img: new Image(), dark: null };
  s.img.onload = () => {
    const c = document.createElement("canvas");
    c.width = c.height = s.img.naturalWidth;
    const g = c.getContext("2d");
    g.drawImage(s.img, 0, 0);
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = "rgba(24, 16, 10, 0.3)";
    g.fillRect(0, 0, c.width, c.height);
    s.dark = c;
  };
  s.img.src = `assets/ar-${id}.png`;
  return (sprites[id] = s);
}
// A soft contact shadow under each bead, so the loop sits on skin instead of floating over it.
const shade = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 6, 32, 32, 32);
  r.addColorStop(0, "rgba(54, 32, 18, 0.34)");
  r.addColorStop(1, "rgba(54, 32, 18, 0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return c;
})();

/* ---------- Hand finder (loaded once, about 17 MB the first time) ---------- */
function loadLandmarker() {
  return (landmarkerP ||= (async () => {
    const { FilesetResolver, HandLandmarker } = await import(`${MP}/vision_bundle.mjs`);
    const files = await FilesetResolver.forVisionTasks(`${MP}/wasm`);
    const make = (delegate) => HandLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: MODEL, delegate },
      runningMode: "VIDEO", numHands: 1,
      minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
    });
    try { return await make("GPU"); } catch { return await make("CPU"); }
  })().catch((e) => { landmarkerP = null; throw e; }));
}

/* ---------- Status pill ---------- */
function status(text, kind = "") {
  statusEl.className = `ar-status ${kind}`;
  statusEl.querySelector("span").textContent = text;
}
function setFound(found) {
  aim.classList.toggle("off", found);
  shot.disabled = !found;
  if (found) status("เจอข้อมือแล้ว ขยับดูได้เลย", "ok");
  else status("กำลังหาข้อมือ");
}

/* ---------- Camera ---------- */
async function openStream(face) {
  if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error("no camera API"), { name: "Unsupported" });
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: face }, width: { ideal: 1280 }, height: { ideal: 720 } },
  });
}
function useStream(s, face) {
  stream?.getTracks().forEach((t) => t.stop());
  stream = s;
  const setting = s.getVideoTracks()[0]?.getSettings?.().facingMode;
  // Selfie cameras (and desktop webcams, which rarely report a direction) show as a mirror.
  mirror = setting ? setting === "user" : face === "user";
  root.classList.toggle("mirror", mirror);
  video.srcObject = s;
  opts.facing = face;
}

export async function start(o) {
  opts = o;
  const s = await openStream(o.facing); // throws to the caller, which explains what went wrong
  useStream(s, o.facing);
  show();
  try { await video.play(); } catch { /* autoplay with muted + playsinline normally succeeds */ }
  if (!landmarker) {
    status("กำลังเตรียมตัวหาข้อมือ ครั้งแรกอาจใช้เวลาสักครู่");
    try { landmarker = await loadLandmarker(); }
    catch { status("โหลดตัวหาข้อมือไม่สำเร็จ แตะตรงนี้เพื่อลองใหม่", "err"); return; }
    if (!running) return; // closed while loading
  }
  setFound(false);
  loop();
}

function show() {
  root.hidden = false;
  document.documentElement.classList.add("ar-on");
  running = true; pose = null; lostAt = 0; rot = 0;
  aim.classList.remove("off");
  shot.disabled = true;
  status("กำลังเปิดกล้อง");
  pill();
  resize();
  root.focus({ preventScroll: true }); // the overlay itself, so the first Tab lands on Close
}

export function stop() {
  if (root.hidden) return;
  running = false;
  cancelAnimationFrame(raf);
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  video.srcObject = null;
  root.hidden = true;
  document.documentElement.classList.remove("ar-on");
  pose = null;
  opts?.onClose?.();
}

function pill() {
  const d = opts.design();
  const ids = Object.keys(d.by).sort((a, b) => (a === d.main ? -1 : b === d.main ? 1 : d.by[b] - d.by[a]));
  const shown = ids.slice(0, 2);
  const more = ids.length - shown.length;
  $("ar-design").innerHTML =
    `<span class="dots">${shown.map((id) => `<i style="background-image:url(assets/ar-${id}.png)"></i>`).join("")}</span>` +
    `<span>${shown.map((id) => `${opts.names[id]} ${d.by[id]}`).join(" ")}${more ? ` และอีก ${more} ชนิด` : ""}</span>`;
  ids.forEach(sprite);
}

/* ---------- Every frame: find the hand, then draw ---------- */
function loop() {
  if (!running) return;
  raf = requestAnimationFrame(loop);
  if (video.readyState < 2 || !landmarker) return;
  const now = performance.now();
  if (video.currentTime !== lastTime) {
    lastTime = video.currentTime;
    track(landmarker.detectForVideo(video, now), now);
  }
  draw();
}

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
}

// Landmarks come in the video's own 0..1 space; the video is shown "cover", so map through that crop.
function mapper() {
  const W = canvas.width, H = canvas.height, vw = video.videoWidth, vh = video.videoHeight;
  const s = Math.max(W / vw, H / vh), ox = (W - vw * s) / 2, oy = (H - vh * s) / 2;
  return (p) => {
    let x = ox + p.x * vw * s;
    if (mirror) x = W - x;
    return [x, oy + p.y * vh * s, p.z * vw * s];
  };
}

function track(r, now) {
  const lm = r?.landmarks?.[0];
  if (!lm) {
    if (!lostAt) lostAt = now;
    // Keep the last pose briefly so a dropped frame doesn't blink the bracelet away.
    if (pose && now - lostAt > 400) { pose = null; setFound(false); }
    return;
  }
  lostAt = 0;
  const P = lm.map(mapper());
  const wrist = P[0], middle = P[9], index = P[5], pinky = P[17];
  const ax = unit(sub(middle, wrist));                     // along the hand, towards the fingers
  let ac = sub(pinky, index);
  ac = unit(sub(ac, mul(ax, dot(ac, ax))));                // across the back of the hand
  // Wrist to middle knuckle is about 90 mm and knuckle to knuckle about 58 mm on an adult hand.
  // Whichever is less foreshortened right now gives the scale.
  const pxmm = Math.max(len(sub(middle, wrist)) / 90, len(sub(pinky, index)) / 58);
  // The bracelet sits just above the wrist crease, towards the arm.
  const next = { c: sub(wrist, mul(ax, 9 * pxmm)), ax, ac, pxmm };
  if (!pose) { pose = next; setFound(true); return; }
  const t = 0.5;
  const nax = unit(lerp(pose.ax, next.ax, t));
  let nac = lerp(pose.ac, next.ac, t);
  nac = unit(sub(nac, mul(nax, dot(nac, nax))));
  pose = { c: lerp(pose.c, next.c, t), ax: nax, ac: nac, pxmm: pose.pxmm + (next.pxmm - pose.pxmm) * t };
}

// Ramanujan's perimeter of an ellipse with semi-axes a and k·a, solved for a.
const semiAxis = (perimeter, k) => perimeter / (Math.PI * (3 * (1 + k) - Math.sqrt((3 + k) * (1 + 3 * k))));

function draw() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (!pose) return;
  const d = opts.design(), n = d.beads.length;
  const { c, ax, ac, pxmm } = pose;
  const nm = cross(ax, ac);                                // out of the back of the hand
  // The loop of bead centres is n × bead size long; a loose bracelet sits a little flatter than round.
  const A = semiAxis(n * d.size, 0.8), B = A * 0.8;
  // The wrist itself, for hiding beads that pass behind it.
  const Aw = semiAxis(d.wrist * 10, 0.72), Bw = Aw * 0.72;
  const a2 = Math.hypot(ax[0], ax[1]) || 1, perp = [-ax[1] / a2, ax[0] / a2];
  const half = Math.hypot(Aw * (ac[0] * perp[0] + ac[1] * perp[1]), Bw * (nm[0] * perp[0] + nm[1] * perp[1])) * pxmm;
  const r = (d.size / 2) * pxmm;

  const items = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 2 * Math.PI + rot;
    const off = mul(add(mul(ac, Math.cos(t) * A), mul(nm, Math.sin(t) * B)), pxmm);
    const x = c[0] + off[0], y = c[1] + off[1];
    const depth = off[2] / (len(off) || 1);                // below 0 faces the camera
    const across = Math.abs((x - c[0]) * perp[0] + (y - c[1]) * perp[1]);
    if (depth > 0.05 && across < half - r * 0.35) continue; // behind the arm
    items.push({ x, y, z: off[2], depth, id: d.beads[i] });
  }
  items.sort((p, q) => q.z - p.z);
  for (const it of items) {
    const s = sprite(it.id);
    const rr = r * (1 - 0.07 * it.depth);
    if (it.depth < 0.25) ctx.drawImage(shade, it.x - rr * 0.95, it.y - rr * 0.8, rr * 2.3, rr * 2.3);
    const im = it.depth > 0 && s.dark ? s.dark : s.img;
    if (im.width || im.naturalWidth) ctx.drawImage(im, it.x - rr, it.y - rr, rr * 2, rr * 2);
  }
}

/* ---------- Controls ---------- */
$("ar-close").addEventListener("click", stop);
$("ar-edit").addEventListener("click", () => { stop(); opts?.onEdit?.(); });
$("ar-line").addEventListener("click", () => { stop(); opts?.onLine?.(); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden) stop(); });
addEventListener("resize", () => { if (!root.hidden) resize(); });
statusEl.addEventListener("click", async () => {
  if (!statusEl.classList.contains("err") || !running) return;
  status("กำลังเตรียมตัวหาข้อมือ ครั้งแรกอาจใช้เวลาสักครู่");
  try { landmarker = await loadLandmarker(); if (running) { setFound(false); loop(); } }
  catch { status("โหลดตัวหาข้อมือไม่สำเร็จ แตะตรงนี้เพื่อลองใหม่", "err"); }
});

$("ar-flip").addEventListener("click", async () => {
  const face = opts.facing === "user" ? "environment" : "user";
  try {
    stream?.getTracks().forEach((t) => t.stop());
    useStream(await openStream(face), face);
    await video.play().catch(() => {});
    pose = null; setFound(false);
  } catch {
    // The other camera isn't there (most laptops); go back to the one that worked.
    try { useStream(await openStream(opts.facing), opts.facing); await video.play().catch(() => {}); } catch { stop(); }
  }
});

// Drag sideways anywhere on the picture to turn the bracelet round the wrist.
let drag = null;
root.addEventListener("pointerdown", (e) => {
  if (e.target.closest("button, .ar-bottom, .ar-top")) return;
  drag = { x: e.clientX, rot };
  root.setPointerCapture(e.pointerId);
});
root.addEventListener("pointermove", (e) => { if (drag) rot = drag.rot + (e.clientX - drag.x) / 70; });
const endDrag = () => { drag = null; };
root.addEventListener("pointerup", endDrag);
root.addEventListener("pointercancel", endDrag);

// Shutter: the camera picture and the bracelet as one photo, shared or saved on the phone.
shot.addEventListener("click", async () => {
  const W = canvas.width, H = canvas.height, vw = video.videoWidth, vh = video.videoHeight;
  if (!vw) return;
  const out = document.createElement("canvas");
  out.width = W; out.height = H;
  const g = out.getContext("2d"), s = Math.max(W / vw, H / vh);
  g.save();
  if (mirror) { g.translate(W, 0); g.scale(-1, 1); }
  g.drawImage(video, (W - vw * s) / 2, (H - vh * s) / 2, vw * s, vh * s);
  g.restore();
  g.drawImage(canvas, 0, 0);
  root.classList.remove("flash"); void root.offsetWidth; root.classList.add("flash");
  const blob = await new Promise((ok) => out.toBlob(ok, "image/jpeg", 0.92));
  if (!blob) return;
  const file = new File([blob], "minestone-bracelet.jpg", { type: "image/jpeg" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return; }
    catch (e) { if (e.name === "AbortError") return; }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = file.name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
});

document.addEventListener("visibilitychange", () => {
  // Phones stop the camera in the background; start the loop again on return.
  if (!document.hidden && running) { cancelAnimationFrame(raf); loop(); }
});
