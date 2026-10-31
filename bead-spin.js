// Drag-to-spin beads. There is only one photo of each bead, so a shader fakes the turn:
// every pixel on the ball is lifted onto a unit sphere, rotated back, and read from the photo
// again. The back of the ball reuses the front (orthographic, so the seam at the rim lines up).
// Only the fine grain turns. The soft light (bright top, darker base) and the sharp glint stay
// where the lamp put them, otherwise the bead reads as a sticker sliding over a ball.
const BEAD_FRAG = `
precision highp float;
uniform sampler2D u_tex;
uniform mat3 u_rot;     // material -> view
uniform vec3 u_ball;    // centre x, centre y, radius, in texture units
varying vec2 v_uv;
const float LIGHT_LOD = 6.0;  // mip level holding the lamp's soft light, not the stone's pattern

vec3 unpm(vec4 c) { return c.a > 0.001 ? c.rgb / c.a : vec3(0.0); }
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
// A glint is a small spot much brighter than what is around it.
float glint(vec3 c, vec3 around) { return smoothstep(0.07, 0.2, luma(c) - luma(around)) * smoothstep(0.7, 0.88, luma(c)); }

void main() {
  vec4 orig = texture2D(u_tex, v_uv);
  vec2 d = (v_uv - u_ball.xy) / u_ball.z;
  float r2 = dot(d, d);
  if (r2 >= 1.0 || orig.a < 0.004) { gl_FragColor = orig; return; }

  vec3 p = vec3(d.x, -d.y, sqrt(1.0 - r2));
  vec3 q = p * u_rot;                      // transpose = inverse rotation
  vec2 uv = u_ball.xy + vec2(q.x, -q.y) * u_ball.z * 0.985;

  vec3 s = unpm(texture2D(u_tex, uv));
  vec3 sLight = unpm(texture2D(u_tex, uv, LIGHT_LOD));
  s = mix(s, sLight, glint(s, sLight));    // the glint must not travel with the stone

  vec3 o = unpm(orig);
  vec3 oLight = unpm(texture2D(u_tex, v_uv, LIGHT_LOD));
  vec3 grain = clamp(s / max(sLight, vec3(0.04)), 0.0, 2.5);
  // Grain read from near the photo's rim is squeezed thin; turned to face us it smears into
  // streaks. Where that stretch is large, fall back to a softer, quieter grain.
  float stretch = smoothstep(1.6, 4.5, p.z / max(abs(q.z), 0.02));
  vec3 soft = clamp(unpm(texture2D(u_tex, uv, 3.0)) / max(sLight, vec3(0.04)), 0.0, 2.5);
  grain = mix(grain, mix(soft, vec3(1.0), 0.4), stretch);
  vec3 c = clamp(grain * oLight, 0.0, 1.0);

  c = mix(c, o, glint(o, oLight));
  c = mix(c, o, smoothstep(0.9, 0.99, sqrt(r2)));   // keep the photographed rim and edge
  gl_FragColor = vec4(c * orig.a, orig.a);
}`;

const BEAD_VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() { v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5); gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const beadReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

function rotAxis(x, y, z, a) {
  const c = Math.cos(a), s = Math.sin(a), t = 1 - c;
  // column-major 3x3
  return [
    t * x * x + c, t * x * y + s * z, t * x * z - s * y,
    t * x * y - s * z, t * y * y + c, t * y * z + s * x,
    t * x * z + s * y, t * y * z - s * x, t * z * z + c,
  ];
}
function mul(a, b) {
  const o = new Array(9);
  for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++)
    o[c * 3 + r] = a[r] * b[c * 3] + a[3 + r] * b[c * 3 + 1] + a[6 + r] * b[c * 3 + 2];
  return o;
}

function spinBead(plate) {
  const img = plate.querySelector("img:not(.wash)");
  const ball = plate.dataset.spin.split(" ").map(Number);
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
  if (!gl) return;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, BEAD_VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, BEAD_FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const uRot = gl.getUniformLocation(prog, "u_rot");
  gl.uniform3fv(gl.getUniformLocation(prog, "u_ball"), ball);

  let rot = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  let base = rot;   // rotation the intro nudge starts from
  let frame = 0;
  const draw = () => {
    frame = 0;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix3fv(uRot, false, rot);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const request = () => { if (!frame) frame = requestAnimationFrame(draw); };

  const fit = () => {
    const w = Math.round(img.getBoundingClientRect().width * Math.min(devicePixelRatio || 1, 2));
    if (w && canvas.width !== w) { canvas.width = canvas.height = w; request(); }
  };

  const start = () => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    img.after(canvas);
    fit();
    draw();
    plate.classList.add("spin-live");
    new ResizeObserver(fit).observe(plate);
  };
  if (img.complete && img.naturalWidth) start();
  else img.addEventListener("load", start, { once: true });

  // Drag: the ball follows the finger, so dragging across its whole width turns it half a turn.
  let drag = null, vel = [0, 0], coast = 0, nudge = 0, touched = false;
  const turn = (dx, dy) => {
    const len = Math.hypot(dx, dy);
    if (!len) return;
    const ballPx = canvas.getBoundingClientRect().width * ball[2] * 2;
    rot = mul(rotAxis(dy / len, dx / len, 0, (len / ballPx) * Math.PI), rot);
    request();
  };
  const stopMotion = () => { cancelAnimationFrame(coast); cancelAnimationFrame(nudge); coast = nudge = 0; };

  canvas.addEventListener("pointerdown", (e) => {
    if (drag || !e.isPrimary) return;
    stopMotion();
    drag = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    vel = [0, 0];
    canvas.setPointerCapture(e.pointerId);
    plate.classList.add("spinning");
    if (!touched) { touched = true; plate.classList.add("spun"); }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || !e.isPrimary) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y, dt = Math.max(e.timeStamp - drag.t, 1);
    turn(dx, dy);
    // Smooth the release speed so one jittery last event does not decide the throw.
    vel = [vel[0] * 0.6 + (dx / dt) * 0.4, vel[1] * 0.6 + (dy / dt) * 0.4];
    drag = { x: e.clientX, y: e.clientY, t: e.timeStamp };
  });
  const release = (e) => {
    if (!drag || !e.isPrimary) return;
    const idle = e.timeStamp - drag.t;
    drag = null;
    plate.classList.remove("spinning");
    if (beadReduce || idle > 80) return;
    // Let go and it keeps turning, slowing like a bead on a string.
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(now - last, 40);
      last = now;
      const k = Math.exp(-dt / 420);
      vel = [vel[0] * k, vel[1] * k];
      turn(vel[0] * dt, vel[1] * dt);
      coast = Math.hypot(vel[0], vel[1]) > 0.004 ? requestAnimationFrame(step) : 0;
    };
    coast = requestAnimationFrame(step);
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  // Once, when the bead first comes into view, it turns a little and back to show it can.
  if (!beadReduce) {
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting || !plate.classList.contains("spin-live")) return;
      io.disconnect();
      setTimeout(() => {
        if (touched) return;
        base = rot;
        const t0 = performance.now(), dur = 1600;
        const step = (now) => {
          const t = Math.min((now - t0) / dur, 1);
          rot = mul(rotAxis(0, 1, 0, 0.45 * Math.sin(Math.PI * t) ** 2), base);
          request();
          nudge = t < 1 && !touched ? requestAnimationFrame(step) : 0;
        };
        nudge = requestAnimationFrame(step);
      }, 500);
    }, { threshold: 0.6 });
    io.observe(plate);
  }
}

document.querySelectorAll(".plate[data-spin]").forEach(spinBead);
