import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

const OUT = 'C:/Users/Alevivi/Documents/Projects/GDG HACK 2 DEMO';
const W = 1280, H = 800;

const browser = await puppeteer.launch({
  headless: true,
  args: [`--window-size=${W},${H}`],
  defaultViewport: { width: W, height: H },
});

const page = await browser.newPage();
await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1000));

// 1. Upload screen
await page.screenshot({ path: `${OUT}/screen1_upload.png`, fullPage: false });
console.log('✓ Upload screen');

// 2. Click sample text → reading view
await page.click('.btn-sample');
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: `${OUT}/screen2_reading.png`, fullPage: false });
console.log('✓ Reading view');

// 3. Scroll reading view a bit to show text + panel better
await page.evaluate(() => window.scrollBy(0, 200));
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: `${OUT}/screen3_reading_scrolled.png`, fullPage: false });
console.log('✓ Reading view (scrolled)');

// 4. Eye tracking intro — click the button in the panel footer
await page.click('.btn-eyetrack');
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: `${OUT}/screen4_eyetrack_intro.png`, fullPage: false });
console.log('✓ Eye tracking intro');

// 5. Back to reading, open RSVP mode
await page.click('.btn-sample, .btn-back');   // in case we need to go back first
await new Promise(r => setTimeout(r, 400));

await browser.close();
console.log('All screenshots saved.');
