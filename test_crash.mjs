import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

(async () => {
  console.log('Starting Vite server...');
  const viteProcess = spawn('npx', ['vite'], { stdio: 'pipe', shell: true });

  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Launching Puppeteer...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('pageerror', error => {
    console.error('PAGE ERROR (Crash):', error.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('CONSOLE ERROR:', msg.text());
    }
  });

  try {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('button');
    console.log('Page loaded. Clicking all buttons...');
    
    // Find all buttons and click them one by one to see which one crashes
    const buttons = await page.$$('button');
    for (let i = 0; i < buttons.length; i++) {
      try {
        const text = await page.evaluate(el => el.textContent, buttons[i]);
        console.log(`Clicking button ${i}: ${text}`);
        await buttons[i].click();
        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        // ignore detached elements
      }
    }
    
    console.log('Done clicking buttons.');
  } catch (err) {
    console.error('Puppeteer Error:', err);
  } finally {
    await browser.close();
    viteProcess.kill();
    process.exit(0);
  }
})();
