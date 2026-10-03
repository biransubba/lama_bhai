const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9265;
const USER_DATA_DIR = "C:\\Users\\Acer\\.gemini\\antigravity\\brain\\78ac26d3-ffa2-448f-9d8a-85326f18ae05\\scratch\\chrome-profile-logo";
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

// Simple test SVG logo encoded as base64 data URL
const TEST_LOGO_DATA_URL = "data:image/svg+xml;base64," + Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect width="200" height="60" rx="10" fill="#17243A"/>
  <circle cx="32" cy="30" r="18" fill="#ED6A4B"/>
  <path d="M22 38 L32 20 L42 38 Z" fill="#FFFFFF"/>
  <text x="60" y="32" fill="#FFFFFF" font-family="sans-serif" font-weight="bold" font-size="16">TEST LOGO</text>
  <text x="60" y="46" fill="#ED6A4B" font-family="sans-serif" font-weight="600" font-size="10">OFFICIAL UPLOAD</text>
</svg>
`).toString('base64');

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
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log("=== STEP 1: Verify Homepage when NO logo uploaded ===");
    // Clear any previous logo settings in localStorage first
    await send('Page.navigate', { url: 'http://localhost:1234/' });
    await sleep(2500);

    const initialStatus = await evaluate(`(() => {
      localStorage.removeItem('lamabhai_active_logo');
      const settings = JSON.parse(localStorage.getItem('lamabhai_admin_settings') || '{}');
      delete settings.logoCustom;
      localStorage.setItem('lamabhai_admin_settings', JSON.stringify(settings));
      window.location.reload();
      return "reloading";
    })()`);
    await sleep(2000);

    const step1Verification = await evaluate(`(() => {
      const allImgs = Array.from(document.querySelectorAll('img')).map(i => i.src);
      const hasOldLogo = allImgs.some(src => src.includes('lamabhai.png'));
      const navBrandText = document.querySelector('.nav-brand-text')?.innerText || '';
      const navLogoImg = document.querySelector('.nav-brand-logo');
      return {
        hasOldLogo,
        navBrandText,
        hasNavLogoImg: Boolean(navLogoImg),
        imgCount: allImgs.length
      };
    })()`);
    console.log("Step 1 Results:", step1Verification);

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}/homepage_no_default_logo.png`, Buffer.from(shot1.data, 'base64'));
    console.log("Saved homepage_no_default_logo.png");

    console.log("=== STEP 2: Verify Admin Settings Logo Studio ===");
    await send('Page.navigate', { url: 'http://localhost:1234/admin/settings' });
    await sleep(2500);

    const adminLogoStudioStatus = await evaluate(`(() => {
      const logoTitle = document.querySelector('.admin-settings-logo-title')?.innerText;
      const logoBadge = document.querySelector('.admin-settings-logo-badge')?.innerText;
      const thumbImg = document.querySelector('.admin-settings-logo-thumb');
      return {
        logoTitle,
        logoBadge,
        hasThumbImg: Boolean(thumbImg),
      };
    })()`);
    console.log("Admin Logo Studio (no logo):", adminLogoStudioStatus);

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}/admin_settings_no_logo.png`, Buffer.from(shot2.data, 'base64'));
    console.log("Saved admin_settings_no_logo.png");

    console.log("=== STEP 3: Admin Uploads/Sets Custom Logo ===");
    await evaluate(`((testLogo) => {
      const settings = JSON.parse(localStorage.getItem('lamabhai_admin_settings') || '{}');
      settings.logoCustom = testLogo;
      localStorage.setItem('lamabhai_admin_settings', JSON.stringify(settings));
      localStorage.setItem('lamabhai_active_logo', testLogo);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('admin-storage-changed', { detail: { key: 'lamabhai_admin_settings' } }));
      window.location.reload();
    })('${TEST_LOGO_DATA_URL}')`);
    await sleep(2000);

    const adminUploadedStatus = await evaluate(`(() => {
      const logoTitle = document.querySelector('.admin-settings-logo-title')?.innerText;
      const logoBadge = document.querySelector('.admin-settings-logo-badge')?.innerText;
      const thumbImg = document.querySelector('.admin-settings-logo-thumb')?.src;
      return {
        logoTitle,
        logoBadge,
        thumbHasSrc: Boolean(thumbImg && thumbImg.startsWith('data:image')),
      };
    })()`);
    console.log("Admin Logo Studio (custom uploaded):", adminUploadedStatus);

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}/admin_settings_custom_logo_active.png`, Buffer.from(shot3.data, 'base64'));
    console.log("Saved admin_settings_custom_logo_active.png");

    console.log("=== STEP 4: Verify Homepage displays uploaded custom logo and persists ===");
    await send('Page.navigate', { url: 'http://localhost:1234/' });
    await sleep(2500);

    const homepageWithCustomLogo = await evaluate(`(() => {
      const navLogoImg = document.querySelector('.navbar__logo');
      const footerLogoImg = document.querySelector('.footer__brand-logo');
      return {
        navLogoVisible: Boolean(navLogoImg && navLogoImg.src.startsWith('data:image')),
        footerLogoVisible: Boolean(footerLogoImg && footerLogoImg.src.startsWith('data:image')),
      };
    })()`);
    console.log("=== STEP 5: Verify Footer with custom logo ===");
    await evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
    await sleep(1000);
    const shot5 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}/homepage_footer_custom_logo.png`, Buffer.from(shot5.data, 'base64'));
    console.log("Saved homepage_footer_custom_logo.png");

    console.log("=== STEP 6: Test Remove Custom Logo and ensure No Logo returns ===");
    await send('Page.navigate', { url: 'http://localhost:1234/admin/settings' });
    await sleep(2000);

    // Click "Remove Custom Logo"
    await evaluate(`(() => {
      const removeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Remove Custom Logo'));
      if (removeBtn) removeBtn.click();
    })()`);
    await sleep(1500);

    const postRemovalStatus = await evaluate(`(() => {
      const settings = JSON.parse(localStorage.getItem('lamabhai_admin_settings') || '{}');
      const activeLogoKey = localStorage.getItem('lamabhai_active_logo');
      const logoTitle = document.querySelector('.admin-settings-logo-title')?.innerText;
      return {
        logoInSettings: settings.logoCustom,
        activeLogoKey,
        logoTitle,
      };
    })()`);
    console.log("Post Removal Status:", postRemovalStatus);

    const shot6 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}/admin_settings_after_removal.png`, Buffer.from(shot6.data, 'base64'));
    console.log("Saved admin_settings_after_removal.png");

  } catch (err) {
    console.error("Verification Error:", err);
  } finally {
    chromeProcess.kill();
  }
}

run();
