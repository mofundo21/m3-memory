import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import puppeteer from "puppeteer";

// Captures the DOM museum sequence (default tier, no WebGL) at fixed scroll positions for visual review.
const port = Number(process.env.DOM_PREVIEW_PORT || 3195);
const base = `http://127.0.0.1:${port}`;
const out = process.env.DOM_PREVIEW_SHOTS || "docs/ai-runs/museum-dom";
const child = spawn(process.platform === "win32" ? "cmd.exe" : "npm",
  process.platform === "win32" ? ["/d", "/s", "/c", `npm run start -- -p ${port}`] : ["run", "start", "--", "-p", String(port)],
  { env: { ...process.env, M3_PERSISTENCE: "sqlite", DATABASE_PATH: `.m3-memory/dom-${port}.sqlite` }, stdio: "ignore", windowsHide: true });
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`${base}/api/health`)).ok) break; } catch {} await delay(500); }
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${base}/museum`, { waitUntil: "networkidle0" });
  for (const p of [0.3, 0.55, 0.62, 0.72, 0.99, 1]) {
    await page.evaluate((target) => {
      const track = document.querySelector(".museum-track");
      const top = track.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + target * (track.offsetHeight - window.innerHeight), behavior: "instant" });
    }, p);
    await delay(400);
    await page.screenshot({ path: `${out}/dom-${p.toFixed(2)}.png` });
  }
  await browser.close();
  console.log("captured");
} finally {
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  else child.kill();
}
