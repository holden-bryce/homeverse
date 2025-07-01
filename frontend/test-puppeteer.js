const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    console.log('Browser launched successfully!');
    
    await page.goto('https://example.com');
    const title = await page.title();
    console.log('Page title:', title);
    
    await browser.close();
    console.log('✅ Puppeteer is working correctly!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
