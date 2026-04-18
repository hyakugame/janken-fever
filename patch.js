(function(){
if(window.__qne)return;window.__qne=true;
var TH={"Uber Eats":"#00FF00","出前館":"#FF0000","ロケットナウ":"#FF8C00"};
var CL=["#FFD700","#FF6B00","#FF0055","#00FFFF","#FF00FF","#7FFF00"];
var fd=false,pc=-1,busy=false;
var h=new Date().getHours(),isDay=h>=6&&h<18;
var btn=document.createElement("button");
btn.style.cssText="position:fixed;bottom:140px;right:16px;z-index:8000;background:#1a1a2ecc;border:1px solid #555;color:#fff;border-radius:50%;width:46px;height:46px;font-size:1.4rem;cursor:pointer;display:flex;align-items:center;justify-content:center";
btn.textContent=isDay?"🌙":"☀️";
document.documentElement.style.filter=isDay?"brightness(1.3)":"brightness(0.75)";
btn.onclick=function(){var dy=btn.textContent==="🌙";document.documentElement.style.filter=dy?"brightness(0.75)":"brightness(1.3)";btn.textContent=dy?"☀️":"🌙";};
document.body.appendChild(btn);
var sb=document.createElement("div");sb.id="qstatBar";
sb.style.cssText="position:fixed;top:0;left:0;right:0;z-index:7000;background:#0d1b2acc;backdrop-filter:blur(8px);border-bottom:1px solid #1e3a4a;padding:5px 10px;display:flex;gap:8px;overflow-x:auto;font-size:11px;color:#8ab4c8;white-space:nowrap";
document.body.insertBefore(sb,document.body.firstChild);
var cs=document.createElement("style");
cs.textContent="@keyframes qfpop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.3);opacity:1}100%{transform:scale(1);opacity:1}}@keyframes qffade{0%,65%{opacity:1}100%{opacity:0;transform:translateY(-50px)}}@keyframes qfly{0%{opacity:1}100%{transform:translate(var(--px),var(--py)) rotate(var(--pr));opacity:0}}.qfov{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;pointer-events:none;animation:qffade 4s forwards}.qftx{font-size:2.8rem;font-weight:900;color:#FFD700;text-shadow:0 0 20px #FFD700,0 0 60px #FF8C00;font-family:monospace;letter-spacing:.1em;text-align:center;line-height:1.6;animation:qfpop .5s cubic-bezier(.34,1.56,.64,1) forwards}.qpt{position:fixed;width:9px;height:9px;border-radius:2px;pointer-events:none;z-index:9998;animation:qfly var(--dur) ease-out forwards}";
document.head.appendChild(cs);
function fmt(m){return m<60?m+"分":Math.floor(m/60)+"h"+String(m%60).padStart(2,"0")+"m";}
function us(){
if(busy)return;busy=true;
try{
var raw=localStorage.getItem("qt5");if(!raw){busy=false;return;}
var qs=JSON.parse(raw);var now=new Date(),td=0,tr=0,aa=[],el=null;
qs.forEach(function(q){
var dn=q.done||0;td+=dn;
var sp=[].concat(q.bonuses||[]).sort(function(a,b){return a.count-b.count;});
tr+=sp.filter(function(s){return dn>=s.count;}).reduce(function(s,b){return s+b.reward;},0);
var lg=q.deliveryLog||[];
for(var i=1;i<lg.length;i++){var df=(new Date(lg[i].at)-new Date(lg[i-1].at))/60000;if(df>1&&df<90)aa.push(df);}
if(q.startedAt){var st=new Date(q.startedAt);if(!el||st<el)el=st;}
});
var eh=el?(now-el)/3600000:0;
var hy=eh>0.1?Math.round(tr/eh):0;
var av=aa.length>0?Math.round(aa.reduce(function(a,b){return a+b;},0)/aa.length):0;
var s='style="background:#0a1520;border-radius:6px;padding:3px 8px;border:1px solid #1e3a4a"';
var html='<span '+s+'>合計<b style="color:#FFD700">'+td+'件</b></span>'
+'<span '+s+'>報酬<b style="color:#FFD700">￥'+tr.toLocaleString()+'</b></span>'
+(eh>0.1?'<span '+s+'>稼働<b style="color:#FFD700">'+fmt(Math.round(eh*60))+'</b></span>':"") 
+(hy>0?'<span '+s+'>時給<b style="color:#FFD700">￥'+hy.toLocaleString()+'</b></span>':"") 
+(av>0?'<span '+s+'>平均<b style="color:#FFD700">'+av+'分/件</b></span>':"")
;
if(sb.innerHTML!==html)sb.innerHTML=html;
}catch(e){}
busy=false;
}
function at(c){
document.querySelectorAll("button").forEach(function(b){if(b.textContent.trim()==="+"){b.style.setProperty("background",c,"important");b.style.setProperty("box-shadow","0 0 20px "+c+"88","important");}});
var best=null,ba=0;
document.querySelectorAll("div,section").forEach(function(el){if(parseFloat(getComputedStyle(el).borderLeftWidth)<3)return;var rc=el.getBoundingClientRect();var a=rc.width*rc.height;if(a>ba){ba=a;best=el;}});
if(best){best.style.setProperty("border-color",c,"important");best.style.setProperty("box-shadow","0 0 30px "+c+"44","important");}
}
function fever(){if(fd)return;fd=true;
for(var i=0;i<60;i++){(function(j){setTimeout(function(){
var p=document.createElement("div");p.className="qpt";
p.style.cssText="left:"+Math.random()*100+"vw;top:-10px;background:"+CL[Math.floor(Math.random()*6)]
+";--px:"+Math.round((Math.random()-.5)*200)+"px;--py:"+Math.round(60+Math.random()*110)+"vh"
+";--pr:"+Math.round(Math.random()*720)+"deg;--dur:"+(2+Math.random()*1.5).toFixed(1)+"s";
document.body.appendChild(p);setTimeout(function(){p.remove();},4000);
},j*25);})(i);}
var o=document.createElement("div");o.className="qfov";
o.innerHTML="<div class='qftx'>🔥 FEVER!! 🔥<br><span style='font-size:1rem;color:#fff;letter-spacing:.25em'>MAX REWARD ACHIEVED!</span></div>";
document.body.appendChild(o);setTimeout(function(){o.remove();fd=false;},4500);
}
var debTimer=null;
var obs=new MutationObserver(function(muts){
for(var i=0;i<muts.length;i++){if(muts[i].target===sb||sb.contains(muts[i].target))return;}
clearTimeout(debTimer);
debTimer=setTimeout(function(){
us();
var txt=document.body.innerText||"";
var gm=txt.match(/\/\s*(\d+)\s*件/);if(!gm)return;
var goal=parseInt(gm[1]),best=null,bsz=0;
document.querySelectorAll("*").forEach(function(el){
if(el.children.length>0)return;
var t=(el.textContent||"").trim();
if(!/^\d+$/.test(t))return;
var sz=parseFloat(getComputedStyle(el).fontSize)||0;
if(sz>bsz){bsz=sz;best=parseInt(t);}
});
if(best!==null&&best===goal&&goal>0&&best!==pc){pc=best;fever();}
else if(best!==null){pc=best;}
},300);
});
obs.observe(document.body,{childList:true,subtree:true});
setTimeout(function(){
var txt=document.body.innerText||"",c="#7B2FBE";
for(var k in TH){if(txt.includes(k)){c=TH[k];break;}}
at(c);us();
},800);
setInterval(us,30000);
})();