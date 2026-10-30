(()=>{const AC=window.AudioContext||window.webkitAudioContext;let ctx,out,on=true;
try{on=localStorage.getItem('sfx')!=='0'}catch{}
function c(){if(!AC)return null;if(!ctx){ctx=new AC();const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=4500;out=ctx.createGain();out.gain.value=.7;const cp=ctx.createDynamicsCompressor();lp.connect(cp);cp.connect(out);out.connect(ctx.destination);ctx._in=lp}if(ctx.state==='suspended')ctx.resume();return ctx}
function tone(f,t,d,v,ty='sine'){const x=c();if(!x)return;const o=x.createOscillator(),g=x.createGain(),s=x.currentTime+t;o.type=ty;o.frequency.setValueAtTime(f,s);
  g.gain.setValueAtTime(.0001,s);g.gain.exponentialRampToValueAtTime(v,s+.012);g.gain.exponentialRampToValueAtTime(.0001,s+d);o.connect(g);g.connect(x._in);o.start(s);o.stop(s+d+.05)}
const bell=(f,t,d,v)=>{tone(f,t,d,v);tone(f*2,t,d*.6,v*.35);tone(f*3,t,d*.35,v*.12)};
const S={tap:()=>tone(620,0,.07,.04,'triangle'),
 add:()=>{tone(660,0,.09,.06);tone(990,.06,.13,.05)},rem:()=>{tone(520,0,.08,.05);tone(390,.06,.11,.045)},
 wait:()=>{tone(523,0,.2,.06);tone(659,.14,.26,.05)},
 success:()=>[523,659,784,1046].forEach((f,i)=>bell(f,i*.11,.55,.07)),
 done:()=>[659,784,988,1319].forEach((f,i)=>bell(f,i*.1,.6,.07)),
 bad:()=>{tone(330,0,.22,.06,'triangle');tone(247,.17,.32,.06,'triangle')},
 order:()=>{[0,.9].forEach(o=>{bell(988,o,.9,.11);bell(1319,o+.3,1.1,.11)})}};
const api={skip:0,play(n){if(on&&S[n])try{S[n]()}catch{}},on:()=>on,ready:()=>!!ctx&&ctx.state==='running',
 toggle(){on=!on;if(!on)api.alarm(0);try{localStorage.setItem('sfx',on?'1':'0')}catch{}if(on)api.play('add');return on}};
let al=null,at=null;
api.alarm=s=>{if(al){clearInterval(al);clearTimeout(at);al=null}if(!s||!on)return;
 const r=()=>[[1175,0],[1568,.26],[1175,.72],[1568,.98]].forEach(([f,t])=>bell(f,t,1.3,.32));
 r();al=setInterval(r,2600);at=setTimeout(()=>api.alarm(0),90000)};
window.sfx=api;
const unlock=()=>{c()};['pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,unlock,{passive:true}));
document.addEventListener('click',e=>{if(!e.target.closest('button'))return;if(api.skip){api.skip=0;return}api.play('tap')});
})();
