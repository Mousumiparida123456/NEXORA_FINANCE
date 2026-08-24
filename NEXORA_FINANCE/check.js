const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', error => logs.push(`[pageerror] ${error.message}`));
  page.on('requestfailed', request =>
    logs.push(`[failed] ${request.url()} - ${request.failure()?.errorText}`)
  );
  
  await page.goto('https://nexora-finance-fintech-dashboard.vercel.app/', { waitUntil: 'networkidle' });
  
  require('fs').writeFileSync('logs.txt', logs.join('\n'));
  await browser.close();
})();
