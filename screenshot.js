import puppeteer from 'puppeteer';

const URL = process.argv[2] ?? 'http://localhost:8080/debug-preview.html';
const OUTPUT = process.argv[3] ?? 'preview.png';

const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__debugPreviewReady === true, { timeout: 5000 });
  await page.screenshot({ path: OUTPUT, fullPage: true });
  console.log(`Saved screenshot to ${OUTPUT}`);
} finally {
  await browser.close();
}
