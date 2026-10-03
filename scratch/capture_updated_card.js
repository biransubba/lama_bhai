const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9252;
const USER_DATA_DIR = "C:\\Users\\Acer\\.gemini\\antigravity\\brain\\78ac26d3-ffa2-448f-9d8a-85326f18ae05\\scratch\\chrome-profile";
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

async function run() {
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
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

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const onMsg = (e) => {
          const data = JSON.parse(e.data);
          if (data.id === id) {
            ws.removeEventListener('message', onMsg);
            if (data.error) reject(data.error);
            else resolve(data.result);
          }
        };
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result.value;
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 1300,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Ensure stay Yakthung is assigned to the current partner so it renders exactly as in the user screenshot
    await send('Page.navigate', { url: 'http://localhost:1234' });
    await sleep(1500);

    await evaluate(`(() => {
      let stays = [];
      try {
        stays = JSON.parse(localStorage.getItem("admin_stays") || "[]");
      } catch(e) {}

      let yakthung = stays.find(s => s.name?.toLowerCase().includes("yakthung"));
      let partners = [];
      try {
        partners = JSON.parse(localStorage.getItem("admin_partners") || "[]");
      } catch(e) {}

      let currentPartnerId = localStorage.getItem("lama_active_partner_id");
      let currentPartner = partners.find(p => p.id === currentPartnerId) || partners[0];

      if (yakthung && currentPartner) {
        yakthung.partnerId = currentPartner.id;
        if (!currentPartner.assignedPropertyIds) currentPartner.assignedPropertyIds = [];
        if (!currentPartner.assignedPropertyIds.includes(yakthung.id)) {
          currentPartner.assignedPropertyIds.push(yakthung.id);
        }
        localStorage.setItem("admin_stays", JSON.stringify(stays));
        localStorage.setItem("admin_partners", JSON.stringify(partners));
      }
    })()`);

    await send('Page.navigate', { url: 'http://localhost:1234/partner/properties' });
    await sleep(2500);

    // Scroll card into view
    const cardInfo = await evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('.partner-property-card'));
      const yakthungCard = cards.find(c => c.innerText.includes('Yakthung')) || cards[0];
      if (!yakthungCard) return null;
      yakthungCard.scrollIntoView({ behavior: 'instant', block: 'start' });
      const rect = yakthungCard.getBoundingClientRect();
      return {
        x: rect.x + window.scrollX,
        y: rect.y + window.scrollY,
        width: rect.width,
        height: rect.height,
        title: yakthungCard.querySelector('h3')?.innerText
      };
    })()`);

    console.log("Card info:", cardInfo);
    await sleep(500);

    const fullShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}/partner_properties_fixed_full.png`, Buffer.from(fullShot.data, 'base64'));
    console.log("Saved full view");

    if (cardInfo) {
      const cardShot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: Math.max(0, cardInfo.x - 12),
          y: Math.max(0, cardInfo.y - 12),
          width: cardInfo.width + 24,
          height: cardInfo.height + 24,
          scale: 1
        }
      });
      fs.writeFileSync(`${ARTIFACT_DIR}/partner_card_fixed_closeup.png`, Buffer.from(cardShot.data, 'base64'));
      console.log("Saved closeup");
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    chromeProcess.kill();
  }
}

run();
