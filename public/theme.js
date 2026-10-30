// Tema gelap/terang. Default gelap; pilihan disimpan di browser.
(()=>{const d=document.documentElement,K='theme',C={dark:'#1e1c19',light:'#f7f6f3'};
let t='dark';try{t=localStorage.getItem(K)==='light'?'light':'dark'}catch{}
let m=null;
function apply(){d.dataset.theme=t;
  if(!m){m=document.querySelector('meta[name=theme-color]');if(!m&&document.head){m=document.createElement('meta');m.name='theme-color';document.head.append(m)}}
  if(m)m.content=C[t];
  document.querySelectorAll('[data-theme-btn]').forEach(b=>{b.innerHTML=t==='dark'?'☀️<span class="tx"> Terang</span>':'🌙<span class="tx"> Gelap</span>';b.title=b.ariaLabel=t==='dark'?'Ganti ke mode terang':'Ganti ke mode gelap'})}
d.dataset.theme=t;
document.addEventListener('DOMContentLoaded',apply);
document.addEventListener('click',e=>{if(!e.target.closest('[data-theme-btn]'))return;t=t==='dark'?'light':'dark';try{localStorage.setItem(K,t)}catch{}apply()});
})();
