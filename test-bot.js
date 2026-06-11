// Bot diagnostic: run champion vs static paddle, log every conceded point
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync('index.html', 'utf8');
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];
const grad = { addColorStop() {} };
const ctx2d = new Proxy({}, { get(t,k){ if(k==='createLinearGradient'||k==='createRadialGradient')return()=>grad; if(k==='createPattern')return()=>({}); if(k in t)return t[k]; return()=>{};}, set(t,k,v){t[k]=v;return true;} });
const mkCanvas = () => ({ width:0, height:0, style:{}, getContext:()=>ctx2d });
const els = {};
const el = id => els[id] || (els[id] = { id, hidden:false, innerHTML:'', textContent:'', value:'', style:{}, dataset:{}, classList:{add(){},remove(){},toggle(){}}, addEventListener(){}, focus(){}, ...(id==='game'||id==='qr'?mkCanvas():{}) });
let clock = 0, rafCb = null;
const sandbox = {
  console, Math, JSON, Object, Array, Date, Number, String, parseFloat, isNaN, Infinity,
  setTimeout, clearTimeout,
  document: { getElementById: el, querySelectorAll:()=>[], createElement: mkCanvas, documentElement:{}, addEventListener(){}, hidden:false },
  navigator: { vibrate(){} }, location: { hash:'', origin:'http://x', pathname:'/', reload(){} },
  history: { replaceState(){} }, performance: { now:()=>clock },
  requestAnimationFrame: cb => { rafCb = cb; },
  addEventListener(){}, getComputedStyle:()=>({getPropertyValue:()=>'0'}),
  innerWidth:375, innerHeight:812, devicePixelRatio:2, confirm:()=>true, alert(){},
  qrcode:()=>({addData(){},make(){},getModuleCount:()=>21,isDark:()=>false}),
  Peer: class { on(){} connect(){return{on(){}}} reconnect(){} },
};
sandbox.localStorage = new Proxy({}, { get:(t,k)=>k==='removeItem'?(x=>delete t[x]):t[k], set:(t,k,v)=>{t[k]=v;return true;} });
sandbox.window = sandbox;
vm.createContext(sandbox);
const run = c => vm.runInContext(c, sandbox);
const step = f => { for (let i=0;i<f;i++){ clock+=16.7; if(rafCb){const cb=rafCb;rafCb=null;cb();} } };

vm.runInContext(src, sandbox);
step(5);
run('mode=3;diff=3;reset()'); run('tap()'); step(200);
// trace: log state every frame the ball is in the bot's contact band moving up
run(`
let conceded=[], lastSc0=0, trace=[];
const origPhysics=physics;
physics=function(n,dt){
  if(b.vy<0&&b.y<.25)trace.push({y:+b.y.toFixed(3),bx:+b.x.toFixed(3),pT:+padT.toFixed(3),t:+BOT.t.toFixed(3),sm:BOT.smashing,w:+wT.toFixed(2)});
  if(trace.length>40)trace.shift();
  origPhysics(n,dt);
  if(sc[0]!=lastSc0){lastSc0=sc[0];conceded.push(trace.slice(-6));trace=[]}
};`);
let frames = 0;
while (frames < 30000 && run('sc[0]+sc[1]') < 10) { step(60); frames += 60; run('if(!run&&!over&&!cnt)tap()'); }
console.log('final score (player-bot):', run('sc[0]'), '-', run('sc[1]'));
console.log('conceded points detail (last 6 frames before each):');
console.log(run('JSON.stringify(conceded)'));
