// Partikel gelas minuman di sisi kiri-kanan halaman pelanggan + sprite SVG gelas.
(()=>{
const SPRITE=`<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="g-tea" viewBox="0 0 48 64">
 <path d="M11 22H37L34.5 58Q34.4 60.8 31.6 60.8H16.4Q13.6 60.8 13.5 58Z" fill="#c9822b" fill-opacity=".6"/>
 <rect x="17" y="26" width="9" height="9" rx="2" fill="#fff" fill-opacity=".55" transform="rotate(-14 21.5 30.5)"/>
 <rect x="25" y="37" width="8" height="8" rx="2" fill="#fff" fill-opacity=".45" transform="rotate(10 29 41)"/>
 <path d="M10 8H38L34.5 58Q34.4 60.8 31.6 60.8H16.4Q13.6 60.8 13.5 58Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
 <path d="M30.5 2L24 46" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
</symbol>
<symbol id="g-kopi" viewBox="0 0 48 64">
 <path d="M8.6 20H39.4L38.6 32H9.4Z" fill="#efe2c6" fill-opacity=".75"/>
 <path d="M9.4 32H38.6L37.8 44H10.2Z" fill="#a8764a" fill-opacity=".8"/>
 <path d="M10.2 44H37.8L36.9 56Q36.8 59 34 59H14Q11.2 59 11.1 56Z" fill="#4a2c17" fill-opacity=".9"/>
 <path d="M8 12H40L37 56Q36.8 59 34 59H14Q11.2 59 11 56Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
 <rect x="15" y="14" width="8" height="8" rx="2" fill="#fff" fill-opacity=".5" transform="rotate(-10 19 18)"/>
 <rect x="26" y="15" width="7" height="7" rx="2" fill="#fff" fill-opacity=".4" transform="rotate(14 29.5 18.5)"/>
</symbol>
<symbol id="g-cup" viewBox="0 0 48 64">
 <path d="M9 34H33V46Q33 56 21 56Q9 56 9 46Z" fill="#4a2c17" fill-opacity=".85"/>
 <path d="M7 30H35V46Q35 58 21 58Q7 58 7 46Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
 <path d="M35 34H38.5Q44 34 44 40.5Q44 47 38.5 47H34" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
 <path d="M3 61.5H39" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
</symbol>
<symbol id="g-cangkir" viewBox="0 0 48 64"><use href="#g-cup"/>
 <path d="M14 24c-4-4 4-7 0-12M22 24c-4-4 4-7 0-14M30 24c-4-4 4-7 0-12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".7"/>
</symbol>
<symbol id="g-sloki" viewBox="0 0 48 64">
 <path d="M12.4 30H35.6L34.5 55Q34.4 58 31.6 58H16.4Q13.6 58 13.5 55Z" fill="#2b1a0e" fill-opacity=".9"/>
 <path d="M12 22H36L34.5 55Q34.4 58 31.6 58H16.4Q13.6 58 13.5 55Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
 <path d="M17.5 34V47" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>
 <path d="M8 61.5H40" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
</symbol>
<symbol id="g-takeaway" viewBox="0 0 48 64">
 <path d="M13.2 30H34.8L33.6 58Q33.5 61 30.7 61H17.3Q14.5 61 14.4 58Z" fill="#4a2c17" fill-opacity=".85"/>
 <path d="M12 18H36L33.6 58Q33.5 61 30.7 61H17.3Q14.5 61 14.4 58Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
 <path d="M9.5 18H38.5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
 <path d="M14 18Q24 6 34 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
 <path d="M13.2 36H34.8L34.1 46H13.9Z" fill="currentColor" fill-opacity=".5"/>
 <path d="M26 11L31 1" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
</symbol>
</defs></svg>`;
document.body.insertAdjacentHTML('afterbegin',SPRITE);
const box=document.createElement('div');box.id='fx';box.setAttribute('aria-hidden','true');document.body.append(box);
const K=['g-tea','g-kopi','g-cangkir','g-sloki','g-takeaway'],R=(a,b)=>a+Math.random()*(b-a);
const calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
function build(){
 box.textContent='';
 const vw=innerWidth,g=(vw-560)/2,wide=g>=80,n=wide?10:7,pad=34;
 for(const side of[0,1])for(let i=0;i<n;i++){
  const s=wide?R(36,76):R(22,36),
        x=wide?R(12,Math.max(13,g-s-12)):R(-s*.3,Math.max(-s*.3+1,pad-s-2)),
        d=R(16,30),el=document.createElement('div');
  el.className='gl'+(side?' dn':'');
  el.style.cssText=`${side?'right':'left'}:${x.toFixed(1)}px;--s:${s.toFixed(0)}px;--d:${d.toFixed(1)}s;--w:${(-R(0,d)).toFixed(1)}s;--o:${R(.4,.8).toFixed(2)};--sw:${R(3,wide?16:5).toFixed(1)}px;--r:${R(6,22).toFixed(0)}deg;--sd:${R(2.5,5).toFixed(1)}s`;
  el.innerHTML=`<svg viewBox="0 0 48 64"><use href="#${K[(i*2+side+Math.floor(R(0,K.length)))%K.length]}"/></svg>`;
  if(calm){el.style.animation='none';el.style.opacity='var(--o)';el.style.transform=`translateY(${R(0,95).toFixed(0)}vh)`}
  box.append(el)}
}
build();let t;addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(build,250)});
})();
