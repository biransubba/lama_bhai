const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9252;
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

    // Step 1: Open Room Details View
    console.log("Navigating to room details...");
    await send('Page.navigate', { url: 'http://localhost:1234/stays/lachen-mountain-homestay/rooms/room_lachen_01' });
    await sleep(2500);

    const layoutCheck = await evaluate(`
      (() => {
        const galleryCol = document.querySelector('.room-detail__gallery-col');
        const photoStage = document.querySelector('.room-detail__photo-stage') || document.querySelector('.room-detail__no-photo-placeholder');
        const inclusions = document.querySelector('.room-detail__inclusions-wrap');
        const sidebar = document.querySelector('.room-detail__booking-sidebar');

        return {
          galleryColExists: Boolean(galleryCol),
          photoStageExists: Boolean(photoStage),
          inclusionsExists: Boolean(inclusions),
          inclusionsInsideGalleryCol: galleryCol && inclusions ? galleryCol.contains(inclusions) : false,
          photoBottom: photoStage ? photoStage.getBoundingClientRect().bottom : null,
          inclusionsTop: inclusions ? inclusions.getBoundingClientRect().top : null,
          sidebarTop: sidebar ? sidebar.getBoundingClientRect().top : null,
          inclusionsText: inclusions ? inclusions.innerText : null
        };
      })()
    `);
    console.log("Layout check result:", layoutCheck);

    await evaluate(`window.scrollBy(0, 450)`);
    await sleep(500);
    await screenshot('verify_room_features_below_photo_box_scrolled');

    // Also check a stay that has no photo (standard placeholder)
    console.log("Testing placeholder layout on property with synthetic or unphotographed room...");
    await send('Page.navigate', { url: 'http://localhost:1234/hotel-homestay' });
    await sleep(2000);

    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
