// CDP probe (no deps — uses Node 24 native WebSocket): loads the app in headless
// Chrome, captures console messages, uncaught exceptions, and rendered DOM state.
const CDP_PORT = 9223;
const TARGET_URL = process.argv[2] || 'http://localhost:5173/';
const WAIT_MS = Number(process.argv[3] || 12000);

const { spawn } = await import('node:child_process');
const chrome = spawn(
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    `--remote-debugging-port=${CDP_PORT}`,
    '--user-data-dir=' + (process.env.TEMP || '/tmp') + '/cdp-profile',
    'about:blank',
  ],
  { stdio: 'ignore' }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page;
    } catch {}
    await sleep(300);
  }
  throw new Error('No CDP target found');
}

function send(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const onMsg = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', onMsg);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const target = await getTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

const logs = [];
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === 'Runtime.consoleAPICalled') {
    const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
    logs.push(`[console.${msg.params.type}] ${text}`);
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    logs.push(`[EXCEPTION] ${d.text} ${d.exception?.description || ''} @ ${d.url || ''}:${(d.lineNumber ?? 0) + 1}`);
  }
  if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    logs.push(`[log.error] ${msg.params.entry.text} ${msg.params.entry.url || ''}`);
  }
});

await send(ws, 1, 'Runtime.enable');
await send(ws, 2, 'Log.enable');
await send(ws, 3, 'Page.enable');
await send(ws, 4, 'Page.navigate', { url: TARGET_URL });
await sleep(WAIT_MS);

const evalRes = await send(ws, 5, 'Runtime.evaluate', {
  expression: `JSON.stringify({
    url: location.href,
    rootChildren: document.getElementById('root') ? document.getElementById('root').children.length : -1,
    rootText: (document.getElementById('root')?.innerText || '').slice(0, 400),
    bodyLen: document.body.innerHTML.length,
  })`,
  returnByValue: true,
});
console.log('PAGE STATE:', evalRes.result.value);
console.log('--- errors/exceptions ---');
const errs = logs.filter((l) => /EXCEPTION|error|warn|failed|Uncaught/i.test(l));
errs.forEach((l) => console.log(l));
if (!errs.length) console.log('(none)');
console.log(`--- all logs (${logs.length} total, first 40) ---`);
logs.slice(0, 40).forEach((l) => console.log(l));

ws.close();
try { chrome.kill(); } catch {}
process.exit(0);
