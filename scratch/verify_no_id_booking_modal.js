const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9251;
const ARTIFACT_DIR = "C:\\Users\\Acer\\.gemini\\antigravity\\brain\\78ac26d3-ffa2-448f-9d8a-85326f18ae05";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  console.log("Starting Chrome on port", PORT);
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);
  await sleep(1500);

  try {
    const targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
    const pageTarget = targets.find(t => t.type === 'page');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const curId = id++;
        const handler = (e) => {
          const res = JSON.parse(e.data);
          if (res.id === curId) {
            ws.removeEventListener('message', handler);
            if (res.error) reject(res.error);
            else resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    async function evaluate(expr) {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result.value;
    }

    async function screenshot(name) {
      const snap = await send('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(snap.data, 'base64');
      const p = path.join(ARTIFACT_DIR, `${name}.png`);
      fs.writeFileSync(p, buf);
      console.log(`Saved screenshot: ${p}`);
    }

    // Step 1: Open Hotel Homestay page
    console.log("Navigating to http://localhost:1234/hotel-homestay...");
    await send('Page.navigate', { url: 'http://localhost:1234/hotel-homestay' });
    await sleep(2500);

    // Step 2: Check available stays or navigate to first stay
    const stayLinks = await evaluate(`
      Array.from(document.querySelectorAll('a[href^="/stays/"]')).map(a => a.href)
    `);
    console.log("Found stay links:", stayLinks);

    const targetUrl = stayLinks[0] || 'http://localhost:1234/stays/lachen-mountain-homestay';
    console.log("Navigating to stay page:", targetUrl);
    await send('Page.navigate', { url: targetUrl });
    await sleep(2000);

    // Step 3: Click "Reserve" on a room card
    console.log("Clicking Reserve button on a room card...");
    const clicked = await evaluate(`
      (() => {
        const btn = document.querySelector('.room-card__cta');
        if (btn) {
          btn.click();
          return btn.textContent;
        }
        return false;
      })()
    `);
    console.log("Clicked button:", clicked);
    await sleep(1500);

    // Verify modal content
    const modalContext = await evaluate(`
      (() => {
        const card = document.querySelector('.booking-stay-context-card');
        if (!card) return null;
        return {
          text: card.innerText,
          hasIdTag: Boolean(document.querySelector('.booking-stay-context-id')),
          html: card.innerHTML
        };
      })()
    `);
    console.log("Booking Modal Stay Context:", modalContext);

    await screenshot('verify_booking_modal_no_ids');

    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
