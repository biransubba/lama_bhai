const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9260;
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
      height: 950,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log("Navigating to Partner Properties...");
    await send('Page.navigate', { url: 'http://localhost:1234/partner/properties' });
    await sleep(2500);

    // 1. Open Edit Details Modal
    console.log("Clicking Edit Details button...");
    await evaluate(`(() => {
      const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Edit Details'));
      if (editBtn) editBtn.click();
    })()`);
    await sleep(1200);

    // Capture Edit Details Modal
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}/modal_edit_details_verified.png`, Buffer.from(shot1.data, 'base64'));
    console.log("Saved modal_edit_details_verified.png");

    // Close Edit Details Modal
    await evaluate(`(() => {
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    })()`);
    await sleep(800);

    // 2. Open Switch Host Profile Modal
    console.log("Clicking Switch Host Profile button...");
    await evaluate(`(() => {
      const switchBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Switch Host Profile'));
      if (switchBtn) switchBtn.click();
    })()`);
    await sleep(1200);

    // Capture Switch Host Modal
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}/modal_switch_host_verified.png`, Buffer.from(shot2.data, 'base64'));
    console.log("Saved modal_switch_host_verified.png");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    chromeProcess.kill();
  }
}

run();
