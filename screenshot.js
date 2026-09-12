const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  const viewports = [
    { name: 'DESKTOP_HERO_1440', width: 1440, height: 900 },
    { name: 'TABLET_1024', width: 1024, height: 768 },
    { name: 'MOBILE_HERO_390', width: 390, height: 844 }
  ];

  for (const viewport of viewports) {
    const page = await browser.newPage();
    await page.setViewport({ width: viewport.width, height: viewport.height });

    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });

    const filename = `${viewport.name}.png`;
    const filepath = path.join(__dirname, '.superpowers', 'sdd', 'm3-memory-ui-redesign', filename);

    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`Screenshot saved: ${filepath}`);

    await page.close();
  }

  await browser.close();
  console.log('All screenshots completed');
})();
