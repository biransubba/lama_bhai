const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9253;
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

const BREAKPOINTS = [
  { name: 'small-mobile', width: 320, height: 600 },
  { name: 'std-mobile', width: 375, height: 667 },
  { name: 'large-mobile', width: 430, height: 932 },
  { name: 'tablet', width: 600, height: 800 },
  { name: 'large-tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1366, height: 768 },
  { name: 'wide-desktop', width: 1920, height: 1080 }
];

const ROUTES_TO_TEST = [
  '/',
  '/car-booking',
  '/hotel-homestay',
  '/rental-bike',
  '/plan-trip',
  '/permit',
  '/destinations',
  '/journeys',
  '/stays/lachen-mountain-homestay',
  '/stays/lachen-mountain-homestay/rooms/room_lachen_01',
  '/manage-booking',
  '/admin',
  '/admin/stays',
  '/admin/cars',
  '/admin/bikes',
  '/admin/bookings',
  '/admin/media',
  '/admin/settings',
  '/partner/login',
  '/partner/properties'
];

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

    async function evaluate(expr) {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result.value;
    }

    const report = [];

    // Test a subset of widths on key pages to identify overflow hotspots quickly
    const testWidths = [320, 375, 430, 768, 1024, 1366, 1920];

    for (const width of testWidths) {
      console.log(`\n================ Testing Width ${width}px ================`);
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 800,
        deviceScaleFactor: 1,
        mobile: width < 768
      });

      for (const route of ROUTES_TO_TEST) {
        const url = `http://localhost:1234${route}`;
        await send('Page.navigate', { url });
        await sleep(800);

        const overflowInfo = await evaluate(`
          (() => {
            const docWidth = document.documentElement.scrollWidth;
            const bodyWidth = document.body.scrollWidth;
            const winWidth = window.innerWidth;
            const hasDocOverflow = docWidth > winWidth + 1;
            const hasBodyOverflow = bodyWidth > winWidth + 1;

            function isInsideScrollContainer(node) {
              let p = node.parentElement;
              while (p && p !== document.body && p !== document.documentElement) {
                const s = window.getComputedStyle(p);
                if (s.overflowX === 'auto' || s.overflowX === 'scroll' || s.overflow === 'hidden' || s.overflowX === 'hidden') {
                  return true;
                }
                p = p.parentElement;
              }
              return false;
            }

            // Find elements extending outside viewport without a containing scroll wrapper
            const overflowingEls = [];
            const all = document.querySelectorAll('*');
            for (const el of all) {
              const r = el.getBoundingClientRect();
              if (r.right > winWidth + 2 && r.width > 0 && r.height > 0) {
                const style = window.getComputedStyle(el);
                if (style.display !== 'none' && style.visibility !== 'hidden' && style.overflow !== 'hidden' && !isInsideScrollContainer(el)) {
                  overflowingEls.push({
                    tag: el.tagName.toLowerCase(),
                    className: (el.className || '').toString().slice(0, 50),
                    right: Math.round(r.right),
                    width: Math.round(r.width),
                    winWidth
                  });
                  if (overflowingEls.length >= 5) break;
                }
              }
            }

            const hasPageOverflow = hasDocOverflow || hasBodyOverflow;
            const hasUncontainedBreakout = overflowingEls.length > 0;

            return {
              hasOverflow: hasPageOverflow || hasUncontainedBreakout,
              hasPageOverflow,
              hasUncontainedBreakout,
              docWidth,
              bodyWidth,
              winWidth,
              overflowingEls
            };
          })()
        `);

        if (overflowInfo.hasOverflow) {
          console.warn(`[OVERFLOW at ${width}px] ${route}: docWidth=${overflowInfo.docWidth}, winWidth=${overflowInfo.winWidth}`);
          console.warn('  Offenders:', overflowInfo.overflowingEls);
          report.push({ width, route, ...overflowInfo });
        }
      }
    }

    console.log(`\nAudit completed. Total overflow issues recorded: ${report.length}`);
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'overflow_report.json'), JSON.stringify(report, null, 2));

    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
