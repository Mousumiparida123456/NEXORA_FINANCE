const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport to a standard desktop size
  await page.setViewportSize({ width: 1280, height: 720 });
  
  await page.goto('https://nexora-finance-fintech-dashboard.vercel.app/', { waitUntil: 'networkidle' });
  
  // Wait a bit just in case
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'screenshot.png' });
  
  await browser.close();
})();
