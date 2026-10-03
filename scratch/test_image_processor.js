const http = require('http');
const { spawn } = require('child_process');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9255;

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
    'http://localhost:1234/'
  ]);
  await sleep(2500);

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

    console.log("Testing imageProcessor in browser environment...");

    await evaluate(`
      new Promise((resolve, reject) => {
        let attempts = 0;
        const check = () => {
          if (window.__imageProcessor) return resolve(true);
          attempts++;
          if (attempts > 50) return reject(new Error("Timeout waiting for __imageProcessor"));
          setTimeout(check, 100);
        };
        check();
      })
    `);

    const testResult = await evaluate(`
      (async () => {
        const {
          validateImage,
          createAVIF,
          createWebP,
          createResponsiveVariants,
          getOptimizedImage,
          isAvifCanvasSupported,
          isWebpCanvasSupported
        } = window.__imageProcessor;

        const results = {};

        // 1. Test Canvas Support Detection
        results.avifSupported = isAvifCanvasSupported();
        results.webpSupported = isWebpCanvasSupported();

        // 2. Test createWebP on a test canvas
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#E8A58C';
        ctx.fillRect(0, 0, 400, 300);

        const webpResult = await createWebP(canvas, { quality: 0.85 });
        results.webpResult = {
          mimeType: webpResult.mimeType,
          width: webpResult.width,
          height: webpResult.height,
          bytes: webpResult.bytes,
          startsWithDataUrl: webpResult.dataUrl.startsWith('data:image/webp')
        };

        // 3. Test createAVIF on test canvas
        const avifResult = await createAVIF(canvas, { quality: 0.80 });
        results.avifResult = {
          mimeType: avifResult.mimeType,
          width: avifResult.width,
          height: avifResult.height,
          bytes: avifResult.bytes,
          isNativeAvif: avifResult.isNativeAvif
        };

        // 4. Test createResponsiveVariants
        const variants = await createResponsiveVariants(canvas, {
          thumbnailWidth: 200,
          previewWidth: 300,
          fullWidth: 400
        });

        results.variantsKeys = Object.keys(variants.variants);
        results.hasThumbnail = Boolean(variants.variants.thumbnail);
        results.hasPreview = Boolean(variants.variants.preview);
        results.hasFull = Boolean(variants.variants.full);

        // 5. Test getOptimizedImage descriptor generator
        const descriptor = getOptimizedImage(variants, {
          sizes: '(max-width: 600px) 100vw, 50vw'
        });

        results.descriptor = {
          hasSrc: Boolean(descriptor.src),
          hasWebpSrc: Boolean(descriptor.webpSrc),
          hasFallbackSrc: Boolean(descriptor.fallbackSrc),
          hasPictureSources: descriptor.hasPictureSources,
          sizes: descriptor.sizes
        };

        // 6. Test validateImage with a simulated invalid file
        const invalidValidation = await validateImage(new Blob(['hello'], { type: 'text/plain' }));
        results.invalidFileCaught = !invalidValidation.isValid;

        // 7. Test validateImage with a small image
        const canvasSmall = document.createElement('canvas');
        canvasSmall.width = 10;
        canvasSmall.height = 10;
        const smallBlob = await new Promise(r => canvasSmall.toBlob(r, 'image/jpeg'));
        const smallValidation = await validateImage(smallBlob, { minWidth: 50, minHeight: 50 });
        results.smallDimensionsCaught = !smallValidation.isValid;

        return results;
      })()
    `);

    console.log("\n--- imageProcessor Unit Verification Results ---");
    console.log(JSON.stringify(testResult, null, 2));

    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
