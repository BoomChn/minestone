// Aquamarine sphere: the water inside drifts like a slow current, the glass does not.
// A flow-map shader nudges the painting along a curl-noise field. Curl noise has no
// divergence, so the "water" swirls without ever pooling or draining. Two phases half a
// cycle apart crossfade so nothing smears for long. Motion fades to zero toward the rim
// (foreshortening on a ball) and under the highlight (a reflection on the surface stays put).
const SPHERE_FRAG = `
precision highp float;
uniform sampler2D u_tex;
uniform float u_t;
varying vec2 v_uv;
const vec2 CENTER = vec2(0.5, 0.5);
const float RADIUS = 0.478;   // painted ball, in texture units
const float CYCLE = 5.0;      // seconds per flow-map phase
const float STRENGTH = 0.032; // max travel per phase, in texture units

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
vec2 curl(vec2 p, float t) {
  const float e = 0.02;
  float dy = noise(vec3(p + vec2(0.0, e), t)) - noise(vec3(p - vec2(0.0, e), t));
  float dx = noise(vec3(p + vec2(e, 0.0), t)) - noise(vec3(p - vec2(e, 0.0), t));
  return vec2(dy, -dx) / (2.0 * e);
}

void main() {
  vec2 d = (v_uv - CENTER) / RADIUS;
  float r2 = dot(d, d);
  if (r2 >= 1.0) {
    gl_FragColor = texture2D(u_tex, v_uv);
    return;
  }
  float z = sqrt(1.0 - r2);
  // Sample the field on the ball's surface, so currents bunch up as they curve away at the rim.
  vec2 s = vec2(asin(d.x), asin(d.y));
  vec2 vel = curl(s * 1.4 + vec2(0.0, u_t * 0.015), u_t * 0.035) * 0.8;
  vel += vec2(-0.22, 0.32); // a gentle current along the painted veins, upper right to lower left
  float highlight = smoothstep(0.24, 0.08, length((v_uv - vec2(0.26, 0.27)) * vec2(1.0, 1.25)));
  vec2 flow = vel * STRENGTH * z * (1.0 - highlight);

  // Stagger the phase across the ball so the crossfade never pulses everywhere at once.
  float jitter = noise(vec3(s * 2.5, 11.0));
  float p0 = fract(u_t / CYCLE + jitter);
  float p1 = fract(u_t / CYCLE + jitter + 0.5);
  vec4 a = texture2D(u_tex, v_uv - flow * (p0 - 0.5));
  vec4 b = texture2D(u_tex, v_uv - flow * (p1 - 0.5));
  gl_FragColor = mix(b, a, 1.0 - abs(1.0 - 2.0 * p0));
}`;

function flowSphere(wrap) {
  const img = wrap.querySelector("img");
  const canvas = wrap.querySelector("canvas");
  const gl = canvas.getContext("webgl", { antialias: false });
  if (!gl) return; // the still painting stays

  const shader = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return sh;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, "attribute vec2 a;varying vec2 v_uv;void main(){v_uv=vec2(a.x*.5+.5,.5-a.y*.5);gl_Position=vec4(a,0.,1.);}"));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, SPHERE_FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const uT = gl.getUniformLocation(prog, "u_t");

  let t = 0, prev = null, raf = 0, visible = false, ready = false;
  const frame = (now) => {
    t += prev === null ? 0 : Math.min(50, now - prev) / 1000; // off-screen time doesn't count
    prev = now;
    gl.uniform1f(uT, t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!wrap.classList.contains("live")) wrap.classList.add("live");
    raf = requestAnimationFrame(frame);
  };
  const run = () => {
    cancelAnimationFrame(raf);
    prev = null;
    if (ready && visible) raf = requestAnimationFrame(frame);
  };
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  const start = () => {
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    resize();
    ready = true;
    run();
  };
  new ResizeObserver(() => ready && resize()).observe(canvas);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    run();
  }).observe(wrap);
  if (img.complete && img.naturalWidth) start();
  else img.addEventListener("load", start, { once: true });
}
const sphereWrap = document.getElementById("sphere");
if (sphereWrap && !matchMedia("(prefers-reduced-motion: reduce)").matches) flowSphere(sphereWrap);
