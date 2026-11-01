import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import puppeteer from "puppeteer";

// Browser checks for the cinematic WebGL layer (YERIEL → MOFUNDO):
// - the default visit stays on the DOM tier;
// - the opt-in visit renders the canvas and loads the lazy renderer chunk;
// - reduced motion and no-WebGL fall back to the DOM tier with the text intact and no renderer chunk loaded;
// - a forced context loss drops to the DOM tier without errors;
// - a phone viewport mounts the layer without horizontal overflow.
const port = Number(process.env.MUSEUM_WEBGL_TEST_PORT || 3197);
const base = `http://127.0.0.1:${port}`;
const shotDir = process.env.MUSEUM_WEBGL_SHOTS || null;
const GL_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"];

const child = spawn(
  process.platform === "win32" ? "cmd.exe" : "npm",
  process.platform === "win32" ? ["/d", "/s", "/c", `npm run start -- -p ${port}`] : ["run", "start", "--", "-p", String(port)],
  {
    env: { ...process.env, M3_PERSISTENCE: "sqlite", M3_ADMIN_AUTH: "local", DATABASE_PATH: `.m3-memory/museum-webgl-${port}.sqlite`, ADMIN_PASSWORD: "fictional-webgl-password", SESSION_SECRET: "fictional-webgl-session-secret-length" },
    stdio: "ignore",
    windowsHide: true,
  }
);

/**
 * Records every chunk a page requests, and whether its code is the three.js renderer. Identified by content,
 * not by file name: Next also loads small router chunks after hydration, which are not the renderer.
 */
function recordChunks(page) {
  const pending = [];
  page.on("response", (response) => {
    if (!/\/static\/chunks\/.*\.js/.test(response.url())) return;
    const name = response.url().split("/").pop();
    pending.push(
      response
        .text()
        .then((body) => ({ name, renderer: /ShaderMaterial|PointsMaterial|WebGLRenderer/.test(body) }))
        .catch(() => ({ name, renderer: false }))
    );
  });
  return async () => Promise.all(pending);
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${base}/api/health`)).ok) return;
    } catch {}
    await delay(500);
  }
  throw new Error("museum webgl test server did not start");
}

/** Scroll so the sequence sits at normalized progress p (0..1). */
async function scrollToProgress(page, p) {
  await page.evaluate((target) => {
    const track = document.querySelector(".museum-track");
    const top = track.getBoundingClientRect().top + window.scrollY;
    const scrollable = track.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + target * scrollable, behavior: "instant" });
  }, p);
  await delay(300);
}

/** Collects uncaught page errors, failed HTTP responses, and console errors. */
function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("response", (r) => {
    // The favicon is a known, documented 404 (no project favicon exists). Any other 4xx/5xx is a real failure.
    if (r.status() >= 400 && !r.url().endsWith("/favicon.ico")) errors.push(`http ${r.status()}: ${r.url()}`);
  });
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource: the server responded with a status of 404/.test(m.text())) {
      errors.push(`console: ${m.text()}`);
    }
  });
  return errors;
}

/** Renderer chunks among the recorded requests (see recordChunks). */
async function rendererChunks(readChunks) {
  return (await readChunks()).filter((c) => c.renderer).map((c) => c.name);
}

/** Errors that are expected when WebGL is unavailable or lost. */
const isGlError = (e) => /WebGL|GL_|context|GPU/i.test(e);

try {
  await waitForServer();

  // ---- A. Cinematic tier in a WebGL-capable browser ----
  const browser = await puppeteer.launch({ headless: true, args: GL_ARGS });
  try {
    // Default visit: DOM tier, no canvas, no renderer chunk.
    const defaultPage = await browser.newPage();
    await defaultPage.setViewport({ width: 1440, height: 900 });
    const defaultChunks = recordChunks(defaultPage);
    await defaultPage.goto(`${base}/museum`, { waitUntil: "networkidle0" });
    await delay(500);
    assert.equal(await defaultPage.$(".museum-root.is-cinematic"), null, "default visit is the DOM tier");
    assert.equal(await defaultPage.$(".museum-webgl canvas"), null, "default visit renders no canvas");
    assert.deepEqual(await rendererChunks(defaultChunks), [], "default visit downloads no renderer chunk");
    await defaultPage.close();

    // Opt-in visit: the cinematic experiment.
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    const errors = watchErrors(page);
    const cinematicChunks = recordChunks(page);
    await page.goto(`${base}/museum?cinematic=1`, { waitUntil: "networkidle0" });
    await page.waitForSelector(".museum-root.is-cinematic", { timeout: 20000 });
    await page.waitForSelector(".museum-webgl canvas", { timeout: 20000 });
    assert.ok((await rendererChunks(cinematicChunks)).length > 0, "cinematic visit loads the renderer chunk");

    const canvas = await page.$eval(".museum-webgl canvas", (c) => ({ w: c.width, h: c.height }));
    assert.ok(canvas.w > 0 && canvas.h > 0, "canvas has a drawing surface");
    assert.equal(await page.$eval(".museum-webgl", (el) => el.getAttribute("aria-hidden")), "true", "canvas layer is decorative");
    assert.equal(await page.$eval(".museum-scene-01 .museum-portrait", (el) => getComputedStyle(el).display), "none", "DOM portrait is replaced by the canvas");
    assert.ok(await page.$eval(".museum-name", (el) => el.textContent.includes("YERIEL")), "DOM name is still present");
    assert.equal(await page.$eval(".museum-cta-slot", (el) => el.inert), true, "CTA inert before its beat, as before");

    if (shotDir) {
      // Representative frames across the cinematic arc, for visual review. Named by scroll progress.
      for (const p of [0.02, 0.06, 0.13, 0.2, 0.27, 0.3, 0.33, 0.37, 0.41, 0.44, 0.46]) {
        await scrollToProgress(page, p);
        await page.screenshot({ path: `${shotDir}/desktop-${p.toFixed(2)}.png` });
      }
    }

    // Phone viewport: the layer mounts and nothing overflows horizontally.
    const mobile = await browser.newPage();
    await mobile.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    const mobileErrors = watchErrors(mobile);
    await mobile.goto(`${base}/museum?cinematic=1`, { waitUntil: "networkidle0" });
    await mobile.waitForSelector(".museum-webgl canvas", { timeout: 20000 });
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `no horizontal overflow on a phone (overflow ${overflow}px)`);
    if (shotDir) {
      for (const p of [0.06, 0.2, 0.3, 0.37, 0.44]) {
        await scrollToProgress(mobile, p);
        await mobile.screenshot({ path: `${shotDir}/mobile-${p.toFixed(2)}.png` });
      }
    }
    assert.deepEqual(mobileErrors.filter((e) => !isGlError(e)), [], "no unexpected errors on a phone");
    await mobile.close();

    // Context loss drops to the DOM tier cleanly.
    await page.evaluate(() => {
      const gl = document.querySelector(".museum-webgl canvas").getContext("webgl2");
      gl.getExtension("WEBGL_lose_context").loseContext();
    });
    await page.waitForFunction(() => !document.querySelector(".museum-webgl canvas") && !document.querySelector(".museum-root.is-cinematic"), { timeout: 10000 });
    assert.ok(await page.$eval(".museum-name", (el) => el.textContent.includes("YERIEL")), "DOM text survives context loss");
    await scrollToProgress(page, 0.4);
    assert.ok(await page.$(".museum-scene-02 .museum-plate"), "DOM Scene 02 plates return after context loss");
    assert.deepEqual(errors.filter((e) => !isGlError(e)), [], "no unexpected page errors in the cinematic visit");
    await page.close();
  } finally {
    await browser.close();
  }

  // ---- B. Reduced motion: DOM tier, no canvas, no renderer chunk downloaded ----
  const reducedBrowser = await puppeteer.launch({ headless: true, args: GL_ARGS });
  try {
    const page = await reducedBrowser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    const errors = watchErrors(page);
    const chunks = recordChunks(page);
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.goto(`${base}/museum?cinematic=1`, { waitUntil: "networkidle0" });
    await delay(500);
    assert.equal(await page.$(".museum-root.is-cinematic"), null, "reduced motion is never cinematic");
    assert.equal(await page.$(".museum-webgl canvas"), null, "reduced motion renders no canvas");
    assert.deepEqual(await rendererChunks(chunks), [], "reduced motion downloads no renderer chunk");
    assert.ok(await page.$(".museum-name"), "DOM sequence still present");
    assert.deepEqual(errors, [], "no page errors under reduced motion");
    await page.close();
  } finally {
    await reducedBrowser.close();
  }

  // ---- C. WebGL disabled: DOM tier with the full content ----
  const noGl = await puppeteer.launch({ headless: true, args: ["--disable-webgl", "--disable-webgl2", "--disable-3d-apis"] });
  try {
    const page = await noGl.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    const errors = watchErrors(page);
    await page.goto(`${base}/museum?cinematic=1`, { waitUntil: "networkidle0" });
    await delay(500);
    assert.equal(await page.$(".museum-root.is-cinematic"), null, "no WebGL means the DOM tier");
    assert.equal(await page.$(".museum-webgl canvas"), null, "no WebGL renders no canvas");
    assert.ok(await page.$eval(".museum-name", (el) => el.textContent.includes("YERIEL")), "DOM content intact without WebGL");
    assert.deepEqual(errors.filter((e) => !isGlError(e)), [], "no unexpected errors without WebGL");
    await page.close();
  } finally {
    await noGl.close();
  }

  console.log("museum webgl tests ok");
} finally {
  // Kill the whole server tree. On Windows, cmd.exe does not forward kill() to the npm and next children.
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  else child.kill();
}
