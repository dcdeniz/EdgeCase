"use client";

/**
 * Lightfall — WebGL backdrop for onboarding.
 *
 * Adapted from the React Bits component. Four changes were needed before it
 * could ship here, and each one is load-bearing:
 *
 * 1. REDUCED MOTION GATES IT. A full-screen animated shader is precisely what
 *    `prefers-reduced-motion` exists for, and the in-app `data-motion` setting
 *    has to be honoured too. Under either, nothing renders and the static
 *    fallback shows instead. The original had no such check.
 *
 * 2. THE COLOUR ARRAY IS HASHED, NOT COMPARED BY REFERENCE. The original lists
 *    `colors` in its effect dependencies, so an inline array literal tears down
 *    and rebuilds the entire WebGL context on every render. Here the effect
 *    depends on a joined string.
 *
 * 3. POINTER INTERACTION IS OFF. It is meaningless on touch, and this is a
 *    mobile-first product.
 *
 * 4. DPR IS CAPPED AT 1.5. The fragment shader raymarches up to 39 iterations
 *    per pixel per frame; uncapped on a high-DPR phone that is a thermal
 *    problem, not a visual improvement.
 *
 * It also pauses when the tab is hidden, and unmounts cleanly.
 */

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

const vertex = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;

uniform vec3  iResolution;
uniform float iTime;
uniform vec3  uColor0;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uBgColor;
uniform float uSpeed;
uniform int   uStreakCount;
uniform float uStreakWidth;
uniform float uStreakLength;
uniform float uGlow;
uniform float uDensity;
uniform float uTwinkle;
uniform float uZoom;
uniform float uBgGlow;
uniform float uOpacity;

varying vec2 vUv;

vec3 palette(float h) {
  int idx = int(floor(clamp(h, 0.0, 0.999999) * 3.0));
  if (idx <= 0) return uColor0;
  if (idx == 1) return uColor1;
  return uColor2;
}

vec3 tanhv(vec3 x) {
  vec3 e = exp(-2.0 * x);
  return (1.0 - e) / (1.0 + e);
}

vec2 sceneC(vec2 frag, vec2 r) {
  vec2 P = (frag + frag - r) / r.x;
  float z = 0.0;
  float d = 1e3;
  vec4 O = vec4(0.0);
  for (int k = 0; k < 39; k++) {
    if (d <= 1e-4) break;
    O = z * normalize(vec4(P, uZoom, 0.0)) - vec4(0.0, 4.0, 1.0, 0.0) / 4.5;
    d = 1.0 - sqrt(length(O * O));
    z += d;
  }
  return vec2(O.x, atan(O.z, O.y));
}

void mainImage(out vec4 o, vec2 C) {
  vec2 r = iResolution.xy;
  vec2 uv0 = (C + C - r) / r.x;
  float T = 0.1 * iTime * uSpeed + 9.0;
  float angRings = max(1.0, floor(6.28318530718 * max(uDensity, 0.05) + 0.5));
  vec2 Y = vec2(5e-3, 6.28318530718 / angRings);

  vec2 c0 = sceneC(C, r);
  vec2 cdx = sceneC(C + vec2(1.0, 0.0), r);
  vec2 cdy = sceneC(C + vec2(0.0, 1.0), r);
  vec2 dCx = cdx - c0;
  vec2 dCy = cdy - c0;
  dCx.y -= 6.28318530718 * floor(dCx.y / 6.28318530718 + 0.5);
  dCy.y -= 6.28318530718 * floor(dCy.y / 6.28318530718 + 0.5);
  vec2 fw = abs(dCx) + abs(dCy);
  C = c0;

  vec2 P = vec2(2.0, 1.0) * uv0 - (r / r.x) * vec2(0.0, 1.0);
  vec4 O = vec4(uBgColor * 90.0 * uBgGlow / (1e3 * dot(P, P) + 6.0), 0.0);

  float zr = 5e-4 * uStreakWidth;
  vec2 rr = vec2(max(length(fw), 1e-5));
  float tail = 19.0 / max(uStreakLength, 0.05);

  for (int m = 0; m < 16; m++) {
    if (m >= uStreakCount) break;
    float jf = float(m) + 1.0;
    float ic = fract(sin(dot(vec2(jf, floor(C.x / Y.x + 0.5)), vec2(7.0, 11.0)) * 73.0));
    vec2 Pp = C - (T + T * ic) * vec2(0.0, 1.0);
    Pp -= floor(Pp / Y + 0.5) * Y;
    float h = fract(8663.0 * ic);
    vec3 col = palette(h);
    float weight = mix(1.5, 1.0 + sin(T + 7.0 * h + 4.0), uTwinkle);
    vec2 inner = vec2(length(max(Pp, vec2(-1.0, 0.0))), length(Pp) - zr) - zr;
    vec2 sm = vec2(1.0) - smoothstep(-rr, rr, inner);
    O.rgb += dot(sm, vec2(exp(tail * Pp.y), 3.0)) * col * weight;
    C.x += Y.x / 8.0;
  }

  vec3 colr = sqrt(tanhv(max(O.rgb * uGlow - vec3(0.04, 0.08, 0.02), 0.0)));
  o = vec4(colr, uOpacity);
}

void main() {
  vec4 color;
  mainImage(color, vUv * iResolution.xy);
  gl_FragColor = color;
}
`;

/**
 * Reduced-motion preference, from the OS query and the in-app setting.
 *
 * `useSyncExternalStore` rather than an effect: the server snapshot reports
 * reduced, so SSR and hydration both render the static fallback and the canvas
 * only appears once the client has actually decided. That avoids a hydration
 * mismatch and the cascading render an effect-driven setState would cause.
 */
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", notify);
      const observer = new MutationObserver(notify);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-motion"],
      });
      return () => {
        query.removeEventListener("change", notify);
        observer.disconnect();
      };
    },
    () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.getAttribute("data-motion") === "reduced",
    () => true,
  );
}

function hexToRGB(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").padEnd(6, "0");
  return [
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255,
  ];
}

export function Lightfall({
  colors = ["#4fc2b5", "#0a6e66", "#8fb3ce"],
  backgroundColor = "#0a2e2b",
  speed = 0.45,
  streakCount = 3,
  className,
}: {
  colors?: string[];
  backgroundColor?: string;
  speed?: number;
  streakCount?: number;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const enabled = !useReducedMotion();

  // Joined, so an inline array literal does not rebuild the GL context.
  const colourKey = colors.join(",");

  useEffect(() => {
    const node = container.current;
    if (!node || !enabled) return;

    const palette = colourKey.split(",");
    const renderer = new Renderer({
      dpr: Math.min(1.5, window.devicePixelRatio || 1),
      alpha: true,
      antialias: false,
    });
    const gl = renderer.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    node.appendChild(canvas);

    const uniforms = {
      iResolution: { value: [gl.drawingBufferWidth, gl.drawingBufferHeight, 1] },
      iTime: { value: 0 },
      uColor0: { value: hexToRGB(palette[0] ?? "#4fc2b5") },
      uColor1: { value: hexToRGB(palette[1] ?? palette[0] ?? "#4fc2b5") },
      uColor2: { value: hexToRGB(palette[2] ?? palette[0] ?? "#4fc2b5") },
      uBgColor: { value: hexToRGB(backgroundColor) },
      uSpeed: { value: speed },
      uStreakCount: { value: Math.max(1, Math.min(16, Math.round(streakCount))) },
      uStreakWidth: { value: 1 },
      uStreakLength: { value: 1 },
      uGlow: { value: 1 },
      uDensity: { value: 0.6 },
      uTwinkle: { value: 1 },
      uZoom: { value: 3 },
      uBgGlow: { value: 0.5 },
      uOpacity: { value: 1 },
    };

    const program = new Program(gl, { vertex, fragment, uniforms });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      const rect = node.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight, 1];
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);

    let frame = 0;
    let running = true;
    const loop = (time: number) => {
      frame = requestAnimationFrame(loop);
      if (!running) return;
      uniforms.iTime.value = time * 0.001;
      renderer.render({ scene: mesh });
    };
    frame = requestAnimationFrame(loop);

    // Stop burning GPU on a tab nobody is looking at.
    const onVisibility = () => {
      running = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
      if (canvas.parentElement === node) node.removeChild(canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [enabled, colourKey, backgroundColor, speed, streakCount]);

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      {/* Static fallback. Also what reduced-motion users get. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(120% 80% at 50% 100%, ${colors[0]}33, transparent 70%), ${backgroundColor}`,
        }}
      />
      <div ref={container} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
