import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import puppeteer from "puppeteer";

// Browser checks for the /museum prototype: gesture-gated audio, focus and inert controls,
// reduced-motion beats, text mode, hand-off routing, and mobile overflow.
const port = Number(process.env.MUSEUM_TEST_PORT || 3198);
const base = `http://127.0.0.1:${port}`;

const child = spawn(
  process.platform === "win32" ? "cmd.exe" : "npm",
  process.platform === "win32" ? ["/d", "/s", "/c", `npm run start -- -p ${port}`] : ["run", "start", "--", "-p", String(port)],
  {
    env: { ...process.env, M3_PERSISTENCE: "sqlite", M3_ADMIN_AUTH: "local", DATABASE_PATH: `.m3-memory/museum-smoke-${port}.sqlite`, ADMIN_PASSWORD: "fictional-museum-password", SESSION_SECRET: "fictional-museum-session-secret-length" },
    stdio: "ignore",
    windowsHide: true,
  }
);

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${base}/api/health`)).ok) return;
    } catch {}
    await delay(500);
  }
  throw new Error("museum test server did not start");
}

/** Scroll so the sequence sits at normalized progress p (0..1). */
async function scrollToProgress(page, p) {
  await page.evaluate((target) => {
    const track = document.querySelector(".museum-track");
    const top = track.getBoundingClientRect().top + window.scrollY;
    const scrollable = track.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + target * scrollable, behavior: "instant" });
  }, p);
  await delay(250);
}

const opacityOf = (page, selector) => page.$eval(selector, (el) => Number(getComputedStyle(el).opacity));

try {
  await waitForServer();
  const browser = await puppeteer.launch({ headless: true });
  try {
    // ---- Desktop: gesture-gated audio, ENTER, inert CTA, skip link focus ----
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    const audioRequests = [];
    page.on("request", (r) => { if (r.url().includes("museum-ambient")) audioRequests.push(r.url()); });
    await page.goto(`${base}/museum`, { waitUntil: "networkidle0" });

    assert.equal(await page.$eval(".museum-cta-slot", (el) => el.inert), true, "CTA is inert before its beat");
    // Decorative layer must not contain anything focusable.
    const focusableInHidden = await page.$$eval(
      '[aria-hidden="true"] a[href], [aria-hidden="true"] button, [aria-hidden="true"] input, [aria-hidden="true"] [tabindex]',
      (els) => els.length
    );
    assert.equal(focusableInHidden, 0, "no focusable element inside the aria-hidden visual layer");
    assert.equal(await page.$eval(".museum-enter", (el) => el.inert), false, "ENTER is active at the start");
    assert.equal(audioRequests.length, 0, "no audio request before any visitor gesture");

    await page.click(".museum-enter-button");
    await delay(600);
    assert.ok((await page.evaluate(() => window.scrollY)) > 0, "ENTER moves the sequence forward");
    assert.equal(await page.$eval(".museum-enter", (el) => el.inert), true, "ENTER is inert once the sequence starts");

    // Sound: the first audio request happens only after the toggle, and a missing file goes silent.
    assert.equal(audioRequests.length, 0, "ENTER alone does not request audio");
    await page.click(".museum-sound");
    await delay(1500);
    assert.equal(await page.$eval(".museum-sound", (b) => b.textContent.trim()), "No track yet", "a missing audio file is reported quietly");
    assert.equal(await page.$eval(".museum-sound", (b) => b.disabled), true);
    assert.equal(audioRequests.length, 1, "audio is requested only after the visitor turns sound on");

    // Join beat: CTA becomes active; skip link moves focus to it.
    await page.evaluate(() => document.querySelector(".museum-skip").click());
    await delay(1800);
    assert.equal(await page.$eval(".museum-cta-slot", (el) => el.inert), false, "CTA is active at the end");
    assert.equal(
      await page.evaluate(() => document.activeElement && document.activeElement.classList.contains("museum-cta")),
      true,
      "skip link moves focus to the CTA"
    );

    // Hand-off: CTA routes to the interview, and Back returns to the museum.
    await page.click(".museum-cta-slot .museum-cta");
    await page.waitForFunction(() => window.location.pathname === "/remember/write", { timeout: 15000 });
    await page.goBack();
    await page.waitForFunction(() => window.location.pathname === "/museum", { timeout: 15000 });
    assert.equal(await page.evaluate(() => window.location.pathname), "/museum", "Back returns to the museum");
    await page.close();

    // ---- Desktop scene beats: counters hold long enough to read ----
    const beats = await browser.newPage();
    await beats.setViewport({ width: 1440, height: 900 });
    await beats.goto(`${base}/museum`, { waitUntil: "networkidle0" });
    await scrollToProgress(beats, 0.8);
    assert.equal(await opacityOf(beats, ".museum-counters"), 1, "counters are fully visible mid-hold (0.8)");
    await scrollToProgress(beats, 0.6);
    assert.equal(await opacityOf(beats, ".museum-counters"), 0, "counters are absent before their beat (0.6)");
    await beats.close();

    // ---- Reduced motion: discrete beats, no overlap, CTA reachable at the end ----
    const rm = await browser.newPage();
    await rm.setViewport({ width: 1440, height: 900 });
    await rm.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await rm.goto(`${base}/museum`, { waitUntil: "networkidle0" });
    await scrollToProgress(rm, 0.8);
    assert.equal(await opacityOf(rm, ".museum-counters"), 1, "reduced motion: counters visible in their beat");
    // Sample across the join beats. At every point at most one message group may be visible.
    const visibleLines = () => rm.$$eval(".museum-line", (els) => els.map((el) => Number(getComputedStyle(el).opacity)));
    await scrollToProgress(rm, 0.92);
    assert.deepEqual(await visibleLines(), [1, 0, 0], "reduced motion: first line alone at 0.92");
    await scrollToProgress(rm, 0.94);
    assert.deepEqual(await visibleLines(), [0, 1, 0], "reduced motion: lines never overlap at 0.94");
    await scrollToProgress(rm, 0.965);
    assert.deepEqual(await visibleLines(), [0, 0, 1], "reduced motion: last line alone at 0.965");
    await scrollToProgress(rm, 0.975);
    assert.deepEqual(await visibleLines(), [0, 0, 0], "reduced motion: lines clear before the join beat");
    assert.equal(await opacityOf(rm, ".museum-counters"), 0, "reduced motion: counters are gone by the join beat");
    await scrollToProgress(rm, 1);
    assert.equal(await opacityOf(rm, ".museum-join"), 1, "reduced motion: join beat visible at the end");
    assert.equal(await rm.$eval(".museum-cta-slot", (el) => el.inert), false, "reduced motion: CTA reachable at the end");
    await rm.close();

    // ---- Read as text: full content, with the hand-off link ----
    const text = await browser.newPage();
    await text.setViewport({ width: 1440, height: 900 });
    await text.goto(`${base}/museum`, { waitUntil: "networkidle0" });
    await text.click(".museum-text-toggle");
    await delay(300);
    assert.equal(await text.$eval(".museum-root", (el) => el.classList.contains("is-text")), true);
    assert.equal(await text.$eval(".museum-text-panel", (el) => getComputedStyle(el).display), "block", "text panel is visible");
    const panelText = await text.$eval(".museum-text-panel", (el) => el.textContent);
    assert.match(panelText, /YERIEL/);
    assert.match(panelText, /HOW DO YOU REMEMBER HIM/);
    assert.match(panelText, /ONE PERSON CAN'T REMEMBER AN ENTIRE LIFE/);
    assert.match(panelText, /Person A \(PLACEHOLDER\)/, "text panel names placeholder evidence as placeholders");
    assert.match(panelText, /PLACEHOLDER VALUES/, "text panel marks placeholder counters");
    assert.equal(await text.$eval(".museum-text-panel", (el) => el.querySelector("h1") === null), true, "text panel adds no second h1");
    await text.close();

    // ---- Mobile: no horizontal overflow, and the stage is usable ----
    const mobile = await browser.newPage();
    await mobile.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await mobile.goto(`${base}/museum`, { waitUntil: "networkidle0" });
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `no horizontal overflow on mobile (got ${overflow}px)`);
    await mobile.close();

    console.log("museum smoke ok");
  } finally {
    await browser.close();
  }
} finally {
  if (process.platform === "win32" && child.pid) {
    try {
      execFileSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    } catch {}
  } else {
    child.kill();
  }
}
