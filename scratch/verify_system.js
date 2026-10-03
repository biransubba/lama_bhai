const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9260;
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
  await sleep(1800);

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
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result.value;
    }

    async function navigateTo(url) {
      await send('Page.navigate', { url });
      await sleep(1500);
    }

    async function setViewport(width, height) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 768
      });
      await sleep(300);
    }

    async function capture(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const fullPath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(fullPath, Buffer.from(res.data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
    }

    // Step 1: Navigate to app and run imageProcessor tests
    console.log("Navigating to http://localhost:1234/ ...");
    await navigateTo('http://localhost:1234/');
    await sleep(2000);

    console.log("Verifying window.__imageProcessor ...");
    const processorTests = await evaluate(`
      (async () => {
        const p = window.__imageProcessor;
        if (!p) throw new Error("__imageProcessor not found on window");

        const results = {};
        results.hasMethods = {
          validateImage: typeof p.validateImage === 'function',
          createAVIF: typeof p.createAVIF === 'function',
          createWebP: typeof p.createWebP === 'function',
          createResponsiveVariants: typeof p.createResponsiveVariants === 'function',
          getOptimizedImage: typeof p.getOptimizedImage === 'function'
        };

        // 1. Create a test canvas
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#8B2616';
        ctx.fillRect(0, 0, 600, 400);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px sans-serif';
        ctx.fillText('Lama Bhai Tourism Test', 50, 200);

        // 2. Test createWebP
        const webp = await p.createWebP(canvas, { quality: 0.84 });
        results.webp = {
          mimeType: webp.mimeType,
          width: webp.width,
          height: webp.height,
          bytes: webp.bytes,
          isValidDataUrl: webp.dataUrl.startsWith('data:image/webp')
        };

        // 3. Test createAVIF
        const avif = await p.createAVIF(canvas, { quality: 0.80 });
        results.avif = {
          mimeType: avif.mimeType,
          width: avif.width,
          height: avif.height,
          bytes: avif.bytes,
          isNativeAvif: avif.isNativeAvif
        };

        // 4. Test createResponsiveVariants
        const variants = await p.createResponsiveVariants(canvas, {
          thumbnailWidth: 200,
          previewWidth: 400,
          fullWidth: 600
        });
        results.variants = {
          keys: Object.keys(variants.variants),
          thumbnailWidth: variants.variants.thumbnail.width,
          previewWidth: variants.variants.preview.width,
          fullWidth: variants.variants.full.width
        };

        // 5. Test getOptimizedImage
        const descriptor = p.getOptimizedImage(variants, {
          sizes: '(max-width: 768px) 100vw, 50vw'
        });
        results.descriptor = {
          hasSrc: Boolean(descriptor.src),
          hasWebpSrc: Boolean(descriptor.webpSrc),
          hasFallbackSrc: Boolean(descriptor.fallbackSrc),
          hasPictureSources: descriptor.hasPictureSources,
          sizes: descriptor.sizes
        };

        // 6. Test validateImage
        const validRes = await p.validateImage(new Blob(['fake'], { type: 'text/plain' }));
        results.caughtInvalidBlob = !validRes.isValid;

        return results;
      })()
    `);

    console.log("\n=======================================================");
    console.log("IMAGE PROCESSOR TEST RESULTS:");
    console.log(JSON.stringify(processorTests, null, 2));
    console.log("=======================================================\n");

    // Step 2: Visual verification across Breakpoints
    const viewports = [
      { name: 'mobile', width: 375, height: 750 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 }
    ];

    const pages = [
      { name: 'homepage', url: 'http://localhost:1234/' },
      { name: 'hotel_homestay', url: 'http://localhost:1234/hotel-homestay' },
      { name: 'permit', url: 'http://localhost:1234/permit' },
      { name: 'admin_dashboard', url: 'http://localhost:1234/admin' }
    ];

    for (const vp of viewports) {
      await setViewport(vp.width, vp.height);
      for (const page of pages) {
        await navigateTo(page.url);
        await sleep(1000);
        await capture(`responsive_${page.name}_${vp.name}_${vp.width}px.png`);
      }
    }

    console.log("\nAll visual captures completed successfully!");
    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error("Execution error:", err);
  process.exit(1);
});
