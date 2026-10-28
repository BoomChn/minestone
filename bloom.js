// Hero watercolour bloom, done the way water actually moves through paper.
// - Capillary spread slows with time (Washburn: reach grows with the square root of time),
//   so the wash races out first and creeps up the crystals last. No easing curve needed.
// - The front is not a clean ellipse: paper fibres (fbm noise) make it finger outward.
// - Water runs faster through paint that is already there, so the front follows the pigment.
// - Freshly wet paint is soft, then sharpens as it settles. Pigment piles up at the wet front.
// When the front has passed everything, the canvas hands back to the plain <img>.
const BLOOM_FRAG = `
precision highp float;
uniform sampler2D u_tex;
uniform float u_p;   // progress 0..1
uniform vec2 u_fit;  // canvas uv -> image uv (object-fit: contain)
varying vec2 v_uv;
const vec2 SOURCE = vec2(0.5, 0.66); // where the water lands: the base of the cluster
const float REACH = 1.25;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec2 iu = (v_uv - 0.5) * u_fit + 0.5;
  if (iu.x < 0.0 || iu.y < 0.0 || iu.x > 1.0 || iu.y > 1.0) { gl_FragColor = vec4(0.0); return; }
  vec3 base = texture2D(u_tex, iu).rgb;
  float ink = 1.0 - dot(base, vec3(0.299, 0.587, 0.114));

  // Distance the water has to travel to get here. Wider than tall: a wash spreads sideways.
  float d = length((iu - SOURCE) * vec2(1.0, 1.6));
  float arrive = d * (0.75 + 0.55 * fbm(iu * vec2(7.0, 9.0))) + 0.04 * noise(iu * 70.0) - 0.25 * ink;
  float behind = REACH * sqrt(u_p) - arrive; // how far back the front passed this point

  float shown = smoothstep(0.0, 0.05, behind);
  float wet = exp(-max(behind, 0.0) / 0.1) * shown;

  // Wet paint is soft: a small blur that tightens as the paper drinks the water.
  vec2 r = vec2(0.007 * wet);
  vec3 soft = (base
    + texture2D(u_tex, iu + vec2(r.x, 0.0)).rgb + texture2D(u_tex, iu - vec2(r.x, 0.0)).rgb
    + texture2D(u_tex, iu + vec2(0.0, r.y)).rgb + texture2D(u_tex, iu - vec2(0.0, r.y)).rgb) / 5.0;
  vec3 col = mix(base, soft, wet);

  // Pigment piles up at the wet edge. col*col darkens paint and leaves bare paper white.
  float edge = smoothstep(0.0, 0.02, behind) * smoothstep(0.07, 0.02, behind);
  col = mix(col, col * col, 0.5 * edge);

  gl_FragColor = vec4(col * shown, shown);
}`;

const BLOOM_MS = 2400;
const BLOOM_DELAY = 150;

function bloomHero(stage) {
  const root = document.documentElement;
  const img = stage.querySelector(".hero-art");
  const canvas = document.createElement("canvas");
  canvas.className = "hero-bloom";
  canvas.setAttribute("aria-hidden", "true");
  img.after(canvas);
  // Anything goes wrong: drop the class, and the CSS bloom plays on the plain image instead.
  const fallBack = () => {
    canvas.remove();
    root.classList.remove("gl-bloom");
  };

  const gl = canvas.getContext("webgl", { antialias: false });
  if (!gl) return fallBack();
  const shader = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return sh;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, "attribute vec2 a;varying vec2 v_uv;void main(){v_uv=vec2(a.x*.5+.5,.5-a.y*.5);gl_Position=vec4(a,0.,1.);}"));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, BLOOM_FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return fallBack();
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const uP = gl.getUniformLocation(prog, "u_p");
  const uFit = gl.getUniformLocation(prog, "u_fit");

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const box = canvas.clientWidth / canvas.clientHeight;
    const pic = img.naturalWidth / img.naturalHeight;
    gl.uniform2f(uFit, box > pic ? box / pic : 1, box > pic ? 1 : pic / box);
  };

  const start = () => {
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    resize();
    let elapsed = -BLOOM_DELAY, prev = null;
    const frame = (now) => {
      elapsed += prev === null ? 0 : Math.min(50, now - prev); // a hidden tab doesn't skip the bloom
      prev = now;
      const p = Math.min(1, Math.max(0, elapsed / BLOOM_MS));
      if (canvas.clientWidth !== Math.round(canvas.width / Math.min(devicePixelRatio || 1, 2))) resize();
      gl.uniform1f(uP, p);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (p < 1) return requestAnimationFrame(frame);
      // Done: the last frame matches the painting, so swap back to the plain image.
      stage.classList.add("bloomed");
      requestAnimationFrame(() => canvas.remove());
    };
    requestAnimationFrame(frame);
  };
  if (img.complete && img.naturalWidth) start();
  else {
    img.addEventListener("load", start, { once: true });
    img.addEventListener("error", fallBack, { once: true });
  }
}
const heroStage = document.getElementById("hero-stage");
if (heroStage && document.documentElement.classList.contains("gl-bloom")) bloomHero(heroStage);
