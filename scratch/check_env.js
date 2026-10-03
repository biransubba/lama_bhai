const { spawn } = require('child_process');
const http = require('http');

async function test() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--remote-debugging-port=9261', '--headless=new', '--disable-gpu', '--no-sandbox', 'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1500));
  try {
    const list = await new Promise(r => http.get('http://127.0.0.1:9261/json', res => {
      let b=''; res.on('data', c=>b+=c); res.on('end', ()=>r(JSON.parse(b)));
    }));
    const page = list.find(t=>t.type==='page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    let id = 1;
    function send(method, params={}) {
      return new Promise((resolve, reject) => {
        const cur = id++;
        const h = (e) => {
          const m = JSON.parse(e.data);
          if (m.id === cur) { ws.removeEventListener('message', h); m.error ? reject(m.error) : resolve(m.result); }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: cur, method, params }));
      });
    }
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('BROWSER CONSOLE:', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.log('BROWSER EXCEPTION:', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
      }
    });
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://localhost:1234/' });
    await new Promise(r => setTimeout(r, 4000));
    const evalRes = await send('Runtime.evaluate', {
      expression: `({
        title: document.title,
        rootChildren: document.getElementById('root') ? document.getElementById('root').children.length : 0,
        keys: Object.keys(window).filter(k => k.includes('image') || k.includes('Image')),
        imageProcessorOnWindow: typeof window.__imageProcessor !== 'undefined'
      })`,
      returnByValue: true
    });
    console.log('Result:', evalRes.result.value);
    ws.close();
  } finally {
    chrome.kill();
  }
}
test().catch(console.error);
