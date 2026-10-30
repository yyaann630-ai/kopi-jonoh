// Backsound lo-fi santai, dibuat langsung di browser (tanpa file audio).
// Browser mewajibkan satu ketukan pertama agar suara bisa mulai. Pilihan nyala/mati disimpan.
(()=>{
const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
let ctx,master,sendG,noise,timer,run=false,started=false,step=0,next=0,on=true;
try{on=localStorage.getItem('bgm')!=='0'}catch{}
const BPM=72,SD=60/BPM/4,SW=.22,LEVEL=.6;
const CH=[[50,53,57,60,64],[55,59,62,65],[52,55,59,62],[57,60,64,67]], // Dm9 G7 Cmaj9 Am9
      BASS=[38,43,48,45],PENT=[72,74,76,79,81,84],hz=m=>440*2**((m-69)/12);
function init(){
 if(ctx)return;ctx=new AC();
 master=ctx.createGain();master.gain.value=0;
 const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;
 const cp=ctx.createDynamicsCompressor();
 master.connect(lp);lp.connect(cp);cp.connect(ctx.destination);
 const dl=ctx.createDelay(1);dl.delayTime.value=60/BPM*.75;
 const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=1800;
 const fb=ctx.createGain();fb.gain.value=.36;
 sendG=ctx.createGain();sendG.gain.value=.4;
 sendG.connect(dl);dl.connect(fl);fl.connect(fb);fb.connect(dl);fl.connect(master);
 noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
 const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
}
function key(m,t,dur,v,echo){
 const f=hz(m),g=ctx.createGain(),o1=ctx.createOscillator(),o2=ctx.createOscillator(),g2=ctx.createGain(),a=.012,dc=Math.min(.45,dur-a-.02);
 o1.type='sine';o2.type='triangle';o1.frequency.value=f;o2.frequency.value=f*2.004;g2.gain.value=.22;
 o1.connect(g);o2.connect(g2);g2.connect(g);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(v*.35,t+a+dc);
 g.gain.setValueAtTime(v*.35,t+dur);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.5);
 g.connect(master);if(echo)g.connect(sendG);
 o1.start(t);o2.start(t);o1.stop(t+dur+.6);o2.stop(t+dur+.6);
}
function kick(t){const o=ctx.createOscillator(),g=ctx.createGain();
 o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+.14);
 g.gain.setValueAtTime(.5,t);g.gain.exponentialRampToValueAtTime(.0001,t+.3);o.connect(g);g.connect(master);o.start(t);o.stop(t+.34)}
function nz(t,type,fr,q,v,dur){const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
 s.buffer=noise;f.type=type;f.frequency.value=fr;f.Q.value=q;
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 s.connect(f);f.connect(g);g.connect(master);s.start(t,Math.random()*.5);s.stop(t+dur+.02)}
function play(s,t){
 const bar=(s>>4)&3,st=s&15,ch=CH[bar];
 if(st===0){ch.forEach((m,i)=>key(m,t+i*.018,2.4,.07,0));key(BASS[bar],t,1.5,.15,0)}
 if(st===10){ch.slice(1).forEach((m,i)=>key(m,t+i*.015,.9,.045,0))}
 if(st===8)key(BASS[bar],t,1,.1,0);
 if(st===0||st===10)kick(t);
 if(st===4||st===12)nz(t,'bandpass',1900,.7,.3,.16);
 if(st%2===0)nz(t,'highpass',7500,.5,st%4===0?.1:.06,.045);
 if(st%2===0&&st&&Math.random()<.24)key(PENT[Math.random()*PENT.length|0],t,.6,.05,1);
 if(Math.random()<.05)nz(t+Math.random()*.1,'highpass',3000,.5,.05,.015);
}
function tick(){while(next<ctx.currentTime+.4){play(step,next+((step&1)?SD*SW:0));next+=SD;step=(step+1)&63}}
function start(){
 init();
 if(!run){run=true;next=ctx.currentTime+.1;step=0;
  const t=ctx.currentTime;master.gain.cancelScheduledValues(t);master.gain.setValueAtTime(master.gain.value,t);master.gain.linearRampToValueAtTime(LEVEL,t+2.5);
  clearInterval(timer);timer=setInterval(tick,120);tick()}
 return ctx.resume();
}
function stop(){
 if(!run)return;run=false;clearInterval(timer);
 const t=ctx.currentTime;master.gain.cancelScheduledValues(t);master.gain.setValueAtTime(master.gain.value,t);master.gain.linearRampToValueAtTime(0,t+.6);
 setTimeout(()=>{if(!run)ctx.suspend()},800);
}
function ui(){document.querySelectorAll('[data-bgm-btn]').forEach(b=>{
 b.innerHTML=(on?'🎵':'🔇')+'<span class="tx"> Musik</span>';b.title=b.ariaLabel=on?'Matikan musik':'Nyalakan musik'})}
document.addEventListener('click',e=>{if(!e.target.closest('[data-bgm-btn]'))return;
 on=!on;try{localStorage.setItem('bgm',on?'1':'0')}catch{}
 if(on)start();else stop();ui()});
// mulai di ketukan pertama pelanggan
const G=['pointerup','touchend','click','keydown'],unlock=()=>{if(!on)return;
 start().then(()=>{if(ctx.state==='running'){started=true;G.forEach(e=>removeEventListener(e,unlock))}}).catch(()=>{})};
G.forEach(e=>addEventListener(e,unlock,{passive:true}));
// hemat baterai: berhenti saat tab/layar tidak aktif
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else if(on&&started)start()});
document.addEventListener('DOMContentLoaded',ui);ui();
window.bgm={start,stop,on:()=>on};
})();
