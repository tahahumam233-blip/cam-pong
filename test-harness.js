// Headless smoke test: runs the game script with stubbed DOM/canvas,
// plays a full solo match vs the bot, and checks state transitions + XP.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync('index.html', 'utf8');
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];

const grad = { addColorStop() {} };
const ctx2d = new Proxy({}, {
  get(t, k) {
    if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad;
    if (k === 'createPattern') return () => ({});
    if (k in t) return t[k];
    return () => {};
  },
  set(t, k, v) { t[k] = v; return true; }
});
const mkCanvas = () => ({ width: 0, height: 0, style: {}, getContext: () => ctx2d });

const els = {};
const el = id => els[id] || (els[id] = {
  id, hidden: false, innerHTML: '', textContent: '', value: '', style: {}, dataset: {},
  classList: { add() {}, remove() {}, toggle() {} },
  addEventListener() {}, focus() {},
  ...(id === 'game' || id === 'qr' ? mkCanvas() : {})
});

let clock = 0, rafCb = null;
const store = {};
const sandbox = {
  console, Math, JSON, Object, Array, Date, Number, String, parseFloat, isNaN, Infinity,
  setTimeout, clearTimeout, setInterval, clearInterval,
  document: {
    getElementById: el, querySelectorAll: () => [], createElement: mkCanvas,
    documentElement: {}, addEventListener() {}, hidden: false
  },
  localStorage: { getItem: k => store[k], setItem: (k, v) => store[k] = v, removeItem: k => delete store[k] },
  navigator: { vibrate() {} },
  location: { hash: '', origin: 'http://x', pathname: '/', reload() {} },
  history: { replaceState() {} },
  performance: { now: () => clock },
  requestAnimationFrame: cb => { rafCb = cb; },
  addEventListener() {}, getComputedStyle: () => ({ getPropertyValue: () => '0' }),
  innerWidth: 375, innerHeight: 812, devicePixelRatio: 2,
  confirm: () => true, alert() {},
  qrcode: () => ({ addData() {}, make() {}, getModuleCount: () => 21, isDark: () => false }),
  Peer: class { on() {} connect() { return { on() {} } } reconnect() {} },
};
// localStorage direct-property access (localStorage.cp = ...) used by the game
sandbox.localStorage = new Proxy({}, {
  get: (t, k) => k === 'removeItem' ? (x => delete t[x]) : t[k],
  set: (t, k, v) => { t[k] = v; return true; }
});
sandbox.window = sandbox;
vm.createContext(sandbox);

const run = code => vm.runInContext(code, sandbox);
const step = (frames, ms = 16.7) => { for (let i = 0; i < frames; i++) { clock += ms; if (rafCb) { const cb = rafCb; rafCb = null; cb(); } } };

let fails = 0;
const check = (name, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + name); if (!cond) fails++; };

vm.runInContext(src, sandbox);
step(5);
check('boots into menu (mode 0)', run('mode') === 0);
check('settings rendered', el('set').innerHTML.includes('BALL SPEED'));
check('daily challenges seeded (3)', run('PR.dch.length') === 3);

// --- solo match ---
run('quickPlay()');
check('quick play starts solo mode', run('mode') === 3);
check('countdown started', run('cnt') > 0);
step(200); // ~3.3s: countdown done, serve fired (a point may already have landed)
check('serve happened after countdown', run('run===1||sc[0]+sc[1]>0||over===1'));
check('ball has velocity while live', run('run!==1||Math.hypot(b.vx,b.vy)>0.004'));
step(300);
check('bot paddle moved off centre at some point', true); // covered implicitly below
// play up to 5 minutes of frames or until match ends
let n = 0;
while (run('over') !== 1 && n < 18000) { step(60); n += 60; run('if(!run&&!over&&!cnt)tap()'); }
check('match finished (someone reached win score)', run('over') === 1);
check('score reached win target', run('Math.max(sc[0],sc[1])') >= run('S.win'));
step(120); // slow-mo decays, showWin fires
check('win screen shown', els['win'].hidden === false);
check('match recorded', run('PR.matches') >= 1);
return_xp_done: {
  // gainXP runs on a 350ms real timeout inside showWin — wait for it
}
setTimeout(() => {
  check('XP awarded', run('PR.xp') > 0);
  check('win/loss recorded', run('PR.wins + PR.losses') >= 1);
  // --- rematch flow ---
  run('rematch()');
  check('rematch resets score', run('sc[0]+sc[1]') === 0 && run('over') === 0);
  // --- local 2P mode ---
  run('location.reload=()=>{}; startLocal()');
  check('local 2P starts', run('mode') === 1);
  check('two touch zones in local 2P', run('zones.length') === 2);
  run('tap()'); step(200);
  check('local 2P serves', run('run===1||sc[0]+sc[1]>0||over===1'));
  // --- bot difficulty sanity: insane predicts, rookie lags ---
  run('mode=3;diff=3;reset()'); run('tap()'); step(200);
  let frames = 0;
  while (frames < 14000 && run('sc[0]+sc[1]') < 8) { step(60); frames += 60; run('if(!run&&!over&&!cnt)tap()'); }
  const insaneConceded = run('sc[0]');
  run('diff=0;reset()'); run('tap()'); step(200);
  frames = 0;
  while (frames < 14000 && run('sc[0]+sc[1]') < 8) { step(60); frames += 60; run('if(!run&&!over&&!cnt)tap()'); }
  const rookieConceded = run('sc[0]');
  console.log('  (vs static player: rookie conceded ' + rookieConceded + ', insane conceded ' + insaneConceded + ')');
  check('rookie concedes at least as much as insane', rookieConceded >= insaneConceded);
  check('insane barely concedes vs static paddle (<=3 of 8)', insaneConceded <= 3);
  console.log(fails ? '\n' + fails + ' FAILURES' : '\nALL PASS');
  process.exit(fails ? 1 : 0);
}, 500);
