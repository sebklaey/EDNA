import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════
// EDNA-1 ENGINE
// ═══════════════════════════════════════════
class EDNAEngine {
  constructor(){this.intervals=[];this.scrollIntervals=[];this.moveAngles=[];this.moveSpeeds=[];this.touchAreas=[];this.gyroMagnitudes=[];this.scrollVelocities=[];this.scrollDirectionChanges=0;this.lastScrollDir=null;this.deletionCount=0;this.totalKeyCount=0;this.burstLengths=[];this.currentBurst=0;this.burstTimeout=null;this.lastEventTime=null;this.lastScrollTime=null;this.lastMoveTime=null;this.lastMoveX=null;this.lastMoveY=null;this.sessionStart=Date.now();this.hasGyro=false;this.moveCount=0;this.scrollCount=0;this.smoothedConfidence=0;this.touchDurations=[];this.touchStartTime=null;this.swipeVelocities=[];this.tapPositionsX=[];this.tapPositionsY=[];this.lastTapTime=0;this.scrollPauses=[];this.lastScrollEnd=null;this.scrollActive=false;this.scrollTimeout=null}
  recordTouchStart(e){const n=Date.now(),t=e.touches?.[0]||e;this.touchStartTime=n;if(this.lastEventTime)this.intervals.push(n-this.lastEventTime);this.lastEventTime=n;if(t.radiusX)this.touchAreas.push(t.radiusX*(t.radiusY||t.radiusX));if(t.clientX!=null){this.tapPositionsX.push(t.clientX/window.innerWidth);this.tapPositionsY.push(t.clientY/window.innerHeight)}this.lastTapTime=n}
  recordTouchEnd(){if(this.touchStartTime){this.touchDurations.push(Date.now()-this.touchStartTime);this.touchStartTime=null}}
  recordScroll(e){const n=Date.now(),d=e.deltaY>0?1:-1;if(this.lastScrollDir!==null&&d!==this.lastScrollDir)this.scrollDirectionChanges++;this.lastScrollDir=d;this.scrollVelocities.push(Math.abs(e.deltaY));if(this.lastScrollTime)this.scrollIntervals.push(n-this.lastScrollTime);this.lastScrollTime=n;this.scrollCount++;if(this.lastEventTime)this.intervals.push(n-this.lastEventTime);this.lastEventTime=n;if(!this.scrollActive&&this.lastScrollEnd)this.scrollPauses.push(n-this.lastScrollEnd);this.scrollActive=true;clearTimeout(this.scrollTimeout);this.scrollTimeout=setTimeout(()=>{this.scrollActive=false;this.lastScrollEnd=Date.now()},150)}
  recordMove(e){const n=Date.now(),x=e.clientX??e.touches?.[0]?.clientX??0,y=e.clientY??e.touches?.[0]?.clientY??0;if(this.lastMoveX!==null&&this.lastMoveTime!==null){const dx=x-this.lastMoveX,dy=y-this.lastMoveY,dt=n-this.lastMoveTime;if(dt>0&&(Math.abs(dx)>2||Math.abs(dy)>2)){const s=Math.sqrt(dx*dx+dy*dy)/dt;this.moveSpeeds.push(s);this.moveAngles.push(Math.atan2(dy,dx));this.moveCount++;if(s>0.5)this.swipeVelocities.push(s)}}this.lastMoveX=x;this.lastMoveY=y;this.lastMoveTime=n}
  recordKey(e){const n=Date.now();if(this.lastEventTime)this.intervals.push(n-this.lastEventTime);this.lastEventTime=n;this.totalKeyCount++;if(e.key==="Backspace"||e.key==="Delete")this.deletionCount++;this.currentBurst++;clearTimeout(this.burstTimeout);this.burstTimeout=setTimeout(()=>{if(this.currentBurst>0){this.burstLengths.push(this.currentBurst);this.currentBurst=0}},500)}
  recordGyro(e){const a=e.accelerationIncludingGravity;if(a?.x!=null&&a?.y!=null&&a?.z!=null){this.hasGyro=true;this.gyroMagnitudes.push(Math.sqrt(a.x**2+a.y**2+a.z**2))}}
  mean(a){return a.length?a.reduce((s,v)=>s+v,0)/a.length:0}
  std(a){if(a.length<2)return 0;const m=this.mean(a);return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1))}
  cv(a){const m=this.mean(a);return m?this.std(a)/m:0}
  entropy(arr,bins=10){if(arr.length<8)return 0.5;const sorted=[...arr].filter(v=>v>0).sort((a,b)=>a-b);if(sorted.length<8)return 0.5;const bd=[];for(let i=1;i<bins;i++)bd.push(sorted[Math.floor(i*sorted.length/bins)]);const c=new Array(bins).fill(0);sorted.forEach(v=>{let b=0;for(let i=0;i<bd.length;i++)if(v>bd[i])b=i+1;c[Math.min(b,bins-1)]++});let H=0;c.forEach(x=>{if(x>0){const p=x/sorted.length;H-=p*Math.log2(p)}});return H/Math.log2(bins)}
  autocorrelation(arr){if(arr.length<8)return 0;const m=this.mean(arr);let n=0,d=0;for(let i=0;i<arr.length-1;i++){n+=(arr[i]-m)*(arr[i+1]-m);d+=(arr[i]-m)**2}d+=(arr[arr.length-1]-m)**2;return d===0?0:n/d}
  scoreTimingDistribution(){if(this.intervals.length<12)return null;const p=this.intervals.filter(v=>v>0);if(p.length<8)return null;const r=this.cv(p),l=this.cv(p.map(v=>Math.log(v)));if(r>0.25&&l<r*0.9)return Math.min(1,0.65+r*0.35);if(r<0.06)return 0.1;return Math.min(1,0.45+r*0.3)}
  scoreEntropy(){if(this.intervals.length<12)return null;const e=this.entropy(this.intervals);if(e>=0.6)return Math.min(1,0.6+e*0.4);if(e>=0.4)return 0.5+(e-0.4)*1.5;if(e<0.3)return 0.15;return 0.4}
  scoreAutocorrelation(){if(this.intervals.length<12)return null;const a=this.autocorrelation(this.intervals);if(a>0.02&&a<0.7)return 0.6+a*0.55;if(Math.abs(a)<0.01)return 0.35;return 0.4}
  scoreDrift(){if(this.intervals.length<20)return null;const r=this.intervals.slice(-200),t=Math.floor(r.length/3),m1=this.mean(r.slice(0,t)),m2=this.mean(r.slice(-t)),o=this.mean(r);if(!o)return 0.5;const d=Math.abs(m2-m1)/o;if(d>0.015&&d<0.7)return Math.min(1,0.6+d*0.7);return 0.35}
  scorePathCurvature(){if(this.moveAngles.length<12)return null;const d=[];for(let i=1;i<this.moveAngles.length;i++)d.push(Math.abs(this.moveAngles[i]-this.moveAngles[i-1]));const c=this.cv(d);if(c>0.2&&c<3.5)return Math.min(1,0.55+c*0.22);if(c<0.06)return 0.1;return 0.3}
  scoreSpeedVariation(){if(this.moveSpeeds.length<12)return null;const c=this.cv(this.moveSpeeds);let s=0.5;if(c>0.35)s+=0.3;if(c>0.7)s+=0.15;if(c<0.1)s-=0.35;return Math.max(0.05,Math.min(1,s))}
  scoreScroll(){if(this.scrollIntervals.length<5)return null;const c=this.cv(this.scrollIntervals),v=this.cv(this.scrollVelocities);let s=0.5;if(c>0.2)s+=0.2;if(v>0.2)s+=0.2;if(this.scrollDirectionChanges>0)s+=0.1;if(c<0.06)s-=0.35;return Math.max(0.05,Math.min(1,s))}
  scoreGyro(){if(!this.hasGyro||this.gyroMagnitudes.length<10)return null;const c=this.cv(this.gyroMagnitudes);if(c>0.004&&c<3)return 0.95;if(c<=0.004)return 0.08;return 0.4}
  scoreTouchArea(){if(this.touchAreas.length<6)return null;const c=this.cv(this.touchAreas);return c>0.06?Math.min(1,0.6+c*0.8):0.15}
  scoreCorrections(){if(this.totalKeyCount<25)return null;const r=this.deletionCount/this.totalKeyCount;if(r>0.01&&r<0.5)return Math.min(1,0.7+r*0.6);return 0.4}
  scoreBursts(){if(this.burstLengths.length<3)return null;const c=this.cv(this.burstLengths);return c>0.12?Math.min(1,0.55+c*0.5):0.35}
  scoreEventRate(){const e=(Date.now()-this.sessionStart)/1000,t=this.intervals.length+this.scrollCount+this.moveCount;if(e<2||t<15)return null;const r=t/e;if(r>0.2&&r<60)return 0.8;if(r>=60)return 0.08;return 0.4}
  scoreTouchDuration(){if(this.touchDurations.length<6)return null;const c=this.cv(this.touchDurations);if(c>0.3)return Math.min(1,0.6+c*0.3);if(c<0.08)return 0.15;return 0.45}
  scoreScrollPauses(){if(this.scrollPauses.length<4)return null;const c=this.cv(this.scrollPauses);if(c>0.25)return Math.min(1,0.6+c*0.35);if(c<0.08)return 0.15;return 0.45}
  scoreTouchZones(){if(this.tapPositionsX.length<8)return null;const x=this.cv(this.tapPositionsX),y=this.cv(this.tapPositionsY),s=(x+y)/2;if(s>0.15)return Math.min(1,0.55+s*0.8);if(s<0.05)return 0.15;return 0.4}
  scoreSwipeCharacter(){if(this.swipeVelocities.length<8)return null;const c=this.cv(this.swipeVelocities);let s=0.5;if(c>0.3)s+=0.25;if(c<0.1)s-=0.3;return Math.max(0.05,Math.min(1,s))}
  analyze(){
    const total=this.intervals.length+this.scrollCount+this.moveCount,elapsed=(Date.now()-this.sessionStart)/1000;
    if(total<8)return{confidence:0,classification:"gathering_data",eventCount:total,elapsed,signals:{},hasGyro:this.hasGyro};
    const scorers=[["Timing Distribution",this.scoreTimingDistribution()],["Timing Entropy",this.scoreEntropy()],["Autocorrelation",this.scoreAutocorrelation()],["Natural Drift",this.scoreDrift()],["Path Curvature",this.scorePathCurvature()],["Speed Variation",this.scoreSpeedVariation()],["Scroll Behavior",this.scoreScroll()],["Device Motion",this.scoreGyro()],["Contact Area",this.scoreTouchArea()],["Click Duration",this.scoreTouchDuration()],["Reading Pauses",this.scoreScrollPauses()],["Interaction Map",this.scoreTouchZones()],["Motion Character",this.scoreSwipeCharacter()],["Corrections",this.scoreCorrections()],["Typing Bursts",this.scoreBursts()],["Event Rate",this.scoreEventRate()]];
    const signals={},weights={"Timing Distribution":2.5,"Timing Entropy":1.5,"Autocorrelation":2,"Natural Drift":1.5,"Path Curvature":2,"Speed Variation":2,"Scroll Behavior":2.5,"Device Motion":3,"Contact Area":2,"Click Duration":2,"Reading Pauses":2.5,"Interaction Map":2,"Motion Character":2,"Corrections":1.5,"Typing Bursts":1,"Event Rate":1.5};
    let wSum=0,wTotal=0;
    for(const[key,val]of scorers){if(val===null)continue;signals[key]=val;const w=weights[key]||1;wSum+=Math.max(0.3,val)*w;wTotal+=w}
    const sigCount=Object.keys(signals).length;
    if(sigCount===0)return{confidence:0,classification:"gathering_data",eventCount:total,elapsed,signals,hasGyro:this.hasGyro};
    let raw=wSum/wTotal;
    const botSignals=Object.values(signals).filter(v=>v<0.15);
    if(botSignals.length>=3)raw*=0.4;else if(botSignals.length>=2)raw*=0.6;
    const strongSignals=Object.values(signals).filter(v=>v>0.6),strongRatio=strongSignals.length/sigCount;
    if(botSignals.length===0&&sigCount>=6){if(strongRatio>=0.75)raw=0.999;else if(strongRatio>=0.5)raw=raw*0.3+0.999*0.7}
    const sigBoost=Math.min(1,(sigCount-0.5)/5);raw*=sigBoost;
    const tf=Math.min(1,elapsed/40);raw=raw*0.55+raw*tf*0.45;
    const vb=Math.min(1,total/100);raw=raw*0.75+raw*vb*0.25;
    raw=Math.max(0,Math.min(0.999,raw));
    this.smoothedConfidence+=(raw-this.smoothedConfidence)*(raw>0.95?0.18:0.12);
    const confidence=Math.max(0,Math.min(0.999,this.smoothedConfidence));
    let classification="bot";if(confidence>=0.99)classification="human_verified";else if(confidence>=0.8)classification="likely_human";else if(confidence>=0.5)classification="uncertain";else if(confidence>=0.3)classification="likely_bot";
    return{confidence,classification,eventCount:total,elapsed,signals,signalCount:sigCount,hasGyro:this.hasGyro}
  }
}

// ═══════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════
const AV=["🧑‍🚀","🧙‍♂️","🦊","🌸","🎭","🤖","🧬","🌊","🔮","⚡","🦋","🎪","🌍","🧠","🎵","🏔️","🐙","🌙","🔥","🎨","🦉","🌿","💎","🎯","🪐","🦈","🍄","🧊","🌺","🎲"];
const NM=["Ada Starfield","Kai Zenith","Luna Protocol","Cipher Node","Mx. Entropy","Rho Wavelet","Sage Meridian","Echo Lattice","Nova Drift","Aria Tensor","Zephyr Hash","Iris Quantum","Onyx Signal","Lyra Pulse","Orion Bloom","Vega Circuit","Atlas Bridge","Nyx Fractal","Sol Archive","Ember Codec","Wren Theorem","Dusk Relay","Ivy Kernel","Flux Daemon","Ren Axiom","Pixel Nomad","Juno Graph","Cleo Byte","Milo Prism","Thea Vector"];
const HD=NM.map(n=>"@"+n.split(" ")[0].toLowerCase()+n.split(" ")[1].toLowerCase().slice(0,4));
const IG=["linear-gradient(135deg,#667eea,#764ba2)","linear-gradient(135deg,#f093fb,#f5576c)","linear-gradient(135deg,#4facfe,#00f2fe)","linear-gradient(135deg,#43e97b,#38f9d7)","linear-gradient(135deg,#fa709a,#fee140)","linear-gradient(135deg,#a18cd1,#fbc2eb)","linear-gradient(135deg,#fccb90,#d57eeb)","linear-gradient(135deg,#e0c3fc,#8ec5fc)","linear-gradient(135deg,#f5576c,#ff9a9e)","linear-gradient(135deg,#667eea,#00f2fe)","linear-gradient(160deg,#0093E9,#80D0C7)","linear-gradient(160deg,#8EC5FC,#E0C3FC)","linear-gradient(160deg,#D9AFD9,#97D9E1)","linear-gradient(160deg,#FBAB7E,#F7CE68)","linear-gradient(160deg,#85FFBD,#FFFB7D)"];
const P=[
  {t:"Just realized my coffee consumption correlates perfectly with my commit frequency.",l:847,r:62,rp:31,tm:"2m"},
  {t:"Hot take: The best code is the code you delete.",l:2341,r:189,rp:445,tm:"5m",img:0,it:"DELETE\nMORE\nCODE"},
  {t:"90% of internet accounts might be bots. What if the engagement you see isn't real?",l:1523,r:234,rp:567,tm:"8m"},
  {t:"Building something beautiful. Cryptography, biometrics, zero personal data. Proving you're real without revealing who you are.",l:892,r:78,rp:156,tm:"12m",img:1,it:"PROVE\nYOU'RE\nREAL"},
  {t:"My grandmother: 'You recognize someone by their handwriting.' She's right — except now the handwriting is digital.",l:3456,r:312,rp:789,tm:"18m"},
  {t:"CAPTCHAs are a tax on being human.",l:5621,r:445,rp:1234,tm:"24m"},
  {t:"Your scroll rhythm, your pauses, your keystrokes — a fingerprint no bot can fake.",l:1234,r:156,rp:289,tm:"32m",img:2,it:"YOUR\nRHYTHM\nIS YOU"},
  {t:"Every human has a unique typing rhythm. Even identical twins type differently.",l:4521,r:378,rp:912,tm:"41m"},
  {t:"What if instead of passwords, the WAY you wrote a sentence was the key?",l:2890,r:234,rp:567,tm:"48m"},
  {t:"You should be able to prove you're human without proving you're YOU.",l:1678,r:145,rp:334,tm:"55m",img:3,it:"PRIVACY\n≠\nSECRECY"},
  {t:"Fast scroll = bored. Slow scroll = interested. Scroll back up = something caught your eye.",l:3234,r:267,rp:678,tm:"1h"},
  {t:"Your phone knows you better than your therapist. Be kind to your data self.",l:7845,r:623,rp:1567,tm:"1h",img:4},
  {t:"The Book of Humanity: written by everyone, one verified thought at a time, owned by no one.",l:956,r:89,rp:178,tm:"2h"},
  {t:"Imagine 'verified' means 'proven human by behavior' not 'paid $8/month.'",l:12453,r:1234,rp:3456,tm:"2h",img:5,it:"HUMAN\nPROOF\n✦"},
  {t:"I don't want your name or email. I just want to know: are you real?",l:6789,r:567,rp:1234,tm:"3h"},
  {t:"Open source isn't charity. It's strategy.",l:2345,r:189,rp:456,tm:"3h"},
  {t:"My bot detector works by checking if you hesitate. Bots don't hesitate. Humans always do.",l:4567,r:345,rp:789,tm:"4h",img:6,it:"DOUBT\nIS\nHUMAN"},
  {t:"The permanent archive of human thought already exists. Every chain, every block — it's all there.",l:1890,r:156,rp:334,tm:"4h"},
  {t:"Privacy isn't hiding. It's choosing.",l:5678,r:456,rp:1023,tm:"5h",img:7},
  {t:"Good morning to everyone except bots. You know who you are. Actually, you don't. ☕",l:8901,r:678,rp:2345,tm:"5h"},
  {t:"The internet was built for machines pretending to be human. We need infrastructure for humans.",l:3456,r:234,rp:567,tm:"6h",img:8,it:"BUILT FOR\nHUMANS"},
  {t:"Your behavioral fingerprint is more unique than your actual fingerprint.",l:7823,r:567,rp:1456,tm:"7h",img:9},
  {t:"Every CAPTCHA you solve trains Google's AI for free. Think about that.",l:15234,r:1678,rp:4523,tm:"7h"},
  {t:"Your scrolling speed reading poetry vs news is completely different. Your thumb knows what you care about.",l:3412,r:256,rp:623,tm:"8h",img:10,it:"YOUR\nTHUMB\nKNOWS"},
  {t:"I gave away my code for free. Protocols that cost money die alone.",l:4567,r:345,rp:789,tm:"8h"},
  {t:"Zero-knowledge proof of humanity. Mathematics is beautiful.",l:6789,r:512,rp:1234,tm:"9h",img:11},
  {t:"The pause before you type is the most interesting data point. The sound of a human thinking.",l:5432,r:423,rp:978,tm:"9h"},
  {t:"If you're reading this, your scroll pattern told my algorithm you're probably human.",l:9876,r:789,rp:2345,tm:"10h",img:12,it:"YOU\nPASSED"},
  {t:"A bot: 10,000 posts/second. A human: one genuine thought per minute.",l:3456,r:267,rp:678,tm:"10h"},
  {t:"Web3 isn't tokens. It's timestamps. Proof that a human made something happen.",l:4321,r:345,rp:789,tm:"11h",img:13},
  {t:"I measured my typing for a week. Faster mornings. More errors after 11pm. Always hesitate before 'love'.",l:11234,r:892,rp:2678,tm:"11h"},
  {t:"The most punk thing in 2026: refuse to be identified while proving you exist.",l:7654,r:567,rp:1456,tm:"12h",img:14,it:"EXIST\nWITHOUT\nID"},
  {t:"If every platform adopted behavioral verification, bot farms would collapse overnight.",l:13456,r:1234,rp:3456,tm:"13h"},
  {t:"Your heartbeat affects how you type. The body always tells the truth.",l:6543,r:512,rp:1234,tm:"13h",img:2},
  {t:"Infrastructure, not product. Boring, invisible, and the only thing that lasts.",l:3456,r:267,rp:678,tm:"14h"},
  {t:"The endgame: a world where being human is proof enough.",l:9876,r:789,rp:2345,tm:"14h",img:5,it:"BEING\nHUMAN\nIS ENOUGH"},
  {t:"Every like you tapped added 12 data points to your behavioral profile. You didn't notice. That's the point.",l:6789,r:567,rp:1234,tm:"15h"},
  {t:"This feed isn't content. It's a proof-of-concept. You just proved you're human by reading it.",l:4567,r:345,rp:789,tm:"15h",img:0,it:"Q.E.D."},
];
const fmt=n=>n>=1000?(n/1000).toFixed(1)+"K":n;
const G="#D4A843",GL="#F2D675";

// ═══════════════════════════════════════════
// UI
// ═══════════════════════════════════════════
export default function App(){
  const[analysis,setAnalysis]=useState({confidence:0,classification:"gathering_data",eventCount:0,elapsed:0,signals:{},hasGyro:false});
  const[isOpen,setIsOpen]=useState(false);
  const[showPanel,setShowPanel]=useState(false);
  const[showParticles,setShowParticles]=useState(false);
  const[liked,setLiked]=useState({});
  const[tab,setTab]=useState("feed");
  const[copied,setCopied]=useState(null);
  const engineRef=useRef(null);
  const openedRef=useRef(false);
  const particles=useRef(Array.from({length:28},(_,i)=>{const a=(i/28)*Math.PI*2,d=60+Math.random()*80;return{tx:Math.cos(a)*d,ty:Math.sin(a)*d,s:2+Math.random()*5,del:i*0.025}}));

  useEffect(()=>{
    const engine=new EDNAEngine();engineRef.current=engine;
    const ts=e=>engine.recordTouchStart(e),te=()=>engine.recordTouchEnd(),mv=e=>engine.recordMove(e),sc=e=>engine.recordScroll(e),ky=e=>engine.recordKey(e),gy=e=>engine.recordGyro(e);
    document.addEventListener("mousedown",ts);document.addEventListener("touchstart",ts,{passive:true});document.addEventListener("mouseup",te);document.addEventListener("touchend",te,{passive:true});document.addEventListener("mousemove",mv);document.addEventListener("touchmove",mv,{passive:true});document.addEventListener("wheel",sc,{passive:true});document.addEventListener("keydown",ky);
    if(typeof DeviceMotionEvent!=="undefined"&&typeof DeviceMotionEvent.requestPermission==="function"){const rg=()=>{DeviceMotionEvent.requestPermission().then(s=>{if(s==="granted")window.addEventListener("devicemotion",gy)}).catch(()=>{});document.removeEventListener("click",rg)};document.addEventListener("click",rg)}else{window.addEventListener("devicemotion",gy)}
    const iv=setInterval(()=>{const r=engine.analyze();setAnalysis(r);if(r.confidence>=0.99&&!openedRef.current){openedRef.current=true;setIsOpen(true);setShowParticles(true);setTimeout(()=>setShowParticles(false),3000)}},600);
    return()=>{document.removeEventListener("mousedown",ts);document.removeEventListener("touchstart",ts);document.removeEventListener("mouseup",te);document.removeEventListener("touchend",te);document.removeEventListener("mousemove",mv);document.removeEventListener("touchmove",mv);document.removeEventListener("wheel",sc);document.removeEventListener("keydown",ky);window.removeEventListener("devicemotion",gy);clearInterval(iv)}
  },[]);

  const{confidence,eventCount,elapsed,signals,classification,hasGyro}=analysis;
  const pct=Math.round(confidence*100),sigCount=Object.keys(signals).length,C=2*Math.PI*44;
  const cls={gathering_data:{t:"SCANNING",c:"#504838"},human_verified:{t:"HUMAN ✦",c:"#4ADE80"},likely_human:{t:"LIKELY HUMAN",c:G},uncertain:{t:"ANALYZING",c:"#D97706"},likely_bot:{t:"SUSPICIOUS",c:"#EF4444"},bot:{t:"BOT DETECTED",c:"#EF4444"}}[classification]||{t:"...",c:"#555"};

  const cp=(code,id)=>{navigator.clipboard?.writeText(code);setCopied(id);setTimeout(()=>setCopied(null),2000)};
  const Code=({code,id})=>(
    <div style={{position:"relative",background:"#0d0d14",borderRadius:8,padding:"14px 16px",marginTop:8,marginBottom:16,fontSize:11.5,lineHeight:1.7,fontFamily:"'SF Mono',Menlo,monospace",color:"#a8e6cf",overflowX:"auto",border:"1px solid rgba(255,255,255,0.04)"}}>
      <button onClick={()=>cp(code,id)} style={{position:"absolute",top:8,right:8,background:"rgba(255,255,255,0.06)",border:"none",color:"#666",fontSize:10,padding:"4px 10px",borderRadius:4,cursor:"pointer"}}>{copied===id?"Copied ✓":"Copy"}</button>
      <pre style={{margin:0,whiteSpace:"pre-wrap",wordBreak:"break-all"}}>{code}</pre>
    </div>
  );

  // Seal component — the mandatory quality mark
  const Seal=({score=99,size=48})=>{
    const r=size*0.38,c=2*Math.PI*r,off=c*(1-score/100);
    return(
      <div style={{display:"inline-flex",alignItems:"center",gap:10,background:"rgba(10,10,15,0.8)",border:"1px solid rgba(212,168,67,0.15)",borderRadius:size/2+20,padding:`${size*0.12}px ${size*0.3}px ${size*0.12}px ${size*0.15}px`}}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{width:size,height:size,flexShrink:0}}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(212,168,67,0.1)" strokeWidth="2"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform={`rotate(-90 ${size/2} ${size/2})`}/>
          <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle" style={{fontSize:size*0.28,fill:"#4ADE80",fontWeight:700,fontFamily:"-apple-system,sans-serif"}}>{score}</text>
        </svg>
        <div style={{lineHeight:1.3}}>
          <div style={{fontSize:size*0.2,fontWeight:600,color:"#ccc",letterSpacing:0.5}}>Human Proof</div>
          <div style={{fontSize:size*0.16,color:"#666"}}>by <span style={{color:G,fontWeight:600}}>@sebklaey</span> standard</div>
        </div>
      </div>
    );
  };

  return(
    <div style={{minHeight:"100vh",background:"#000",color:"#E5E5E5",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",maxWidth:600,margin:"0 auto",position:"relative",paddingBottom:72}}>

      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:18,fontWeight:700}}>EDNA-1</div>
          <button onClick={()=>setShowPanel(p=>!p)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8,padding:"4px 8px"}}>
            <svg viewBox="0 0 100 100" style={{width:36,height:36}}>
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4"/>
              <circle cx="50" cy="50" r="44" fill="none" stroke={isOpen?"#4ADE80":G} strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-confidence)} transform="rotate(-90 50 50)" style={{transition:"stroke-dashoffset 1s ease-out"}}/>
              {isOpen?<text x="50" y="56" textAnchor="middle" style={{fontSize:28,fill:"#4ADE80"}}>✦</text>:<text x="50" y="58" textAnchor="middle" style={{fontSize:22,fill:G,fontWeight:700}}>{pct}</text>}
            </svg>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:10,letterSpacing:2,color:cls.c,fontWeight:600}}>{cls.t}</div>
              <div style={{fontSize:9,color:"#444",marginTop:1}}>{sigCount} signals · {hasGyro?"📱":"🖥️"}</div>
            </div>
          </button>
        </div>
        <div style={{display:"flex",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
          {[["feed","Demo"],["integrate","Integrate"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"10px",background:"none",border:"none",borderBottom:tab===id?`2px solid ${G}`:"2px solid transparent",color:tab===id?"#eee":"#555",fontSize:13,fontWeight:tab===id?600:400,cursor:"pointer",fontFamily:"inherit"}}>{label}</button>
          ))}
        </div>
      </div>

      {/* Signal Panel */}
      {showPanel&&<div style={{position:"sticky",top:100,zIndex:99,background:"rgba(10,10,15,0.95)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:"1px solid rgba(212,168,67,0.1)",padding:"12px 16px"}}>
        <div style={{fontSize:9,letterSpacing:3,color:"#4A4030",marginBottom:8,fontWeight:600}}>LIVE ANALYSIS</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px 16px"}}>
          {Object.entries(signals).map(([k,v])=><div key={k} style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{flex:1,fontSize:10,color:"#666",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{k}</div>
            <div style={{width:40,height:3,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden",flexShrink:0}}><div style={{width:`${Math.round(v*100)}%`,height:"100%",borderRadius:2,background:v>0.7?"#4ADE80":v>0.4?G:"#EF4444",transition:"width 1s"}}/></div>
            <div style={{width:22,fontSize:9,textAlign:"right",fontVariantNumeric:"tabular-nums",flexShrink:0,color:v>0.7?"rgba(74,222,128,0.6)":"rgba(212,168,67,0.6)"}}>{Math.round(v*100)}</div>
          </div>)}
        </div>
      </div>}

      {/* ═══ FEED TAB ═══ */}
      {tab==="feed"&&<>
        {P.map((post,i)=>{const av=AV[i%AV.length],name=NM[i%NM.length],handle=HD[i%HD.length],isLiked=liked[i];
        return(<div key={i} style={{padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:12}}>
          <div style={{width:40,height:40,borderRadius:20,background:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{av}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}><span style={{fontWeight:700,fontSize:14}}>{name}</span><span style={{color:"#555",fontSize:13}}>{handle}</span><span style={{color:"#444",fontSize:13}}>· {post.tm}</span></div>
            <p style={{margin:"6px 0 0",fontSize:15,lineHeight:1.55,color:"#d4d4d4"}}>{post.t}</p>
            {post.img!=null&&<div style={{marginTop:10,borderRadius:12,overflow:"hidden",background:IG[post.img%IG.length],height:post.it?200:180,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {post.it&&<div style={{color:"rgba(255,255,255,0.9)",fontSize:28,fontWeight:800,textAlign:"center",lineHeight:1.3,whiteSpace:"pre-line",textShadow:"0 2px 20px rgba(0,0,0,0.3)",letterSpacing:2}}>{post.it}</div>}
            </div>}
            <div style={{display:"flex",gap:24,marginTop:10}}>
              {[{icon:"💬",val:post.r},{icon:"🔁",val:post.rp},{icon:isLiked?"❤️":"🤍",val:isLiked?post.l+1:post.l,action:()=>setLiked(p=>({...p,[i]:!p[i]}))}].map((a,j)=><button key={j} onClick={a.action} style={{background:"none",border:"none",color:"#555",fontSize:13,display:"flex",alignItems:"center",gap:5,cursor:"pointer",padding:"4px 0",fontFamily:"inherit"}}><span style={{fontSize:14}}>{a.icon}</span>{fmt(a.val)}</button>)}
            </div>
          </div>
        </div>)})}
      </>}

      {/* ═══ INTEGRATE TAB ═══ */}
      {tab==="integrate"&&<div style={{padding:"20px 16px 100px"}}>

        {/* Hero */}
        <div style={{textAlign:"center",padding:"32px 0 28px"}}>
          <div style={{fontSize:11,letterSpacing:4,color:"#4A4030",marginBottom:8}}>FREE & OPEN SOURCE</div>
          <h2 style={{fontSize:28,fontWeight:700,color:G,margin:"0 0 12px",letterSpacing:-0.5}}>Integrate Human Proof</h2>
          <p style={{fontSize:14,color:"#777",lineHeight:1.7,maxWidth:380,margin:"0 auto"}}>
            Add behavioral human verification to any app. Free forever. One requirement: visible attribution.
          </p>
        </div>

        {/* The Deal */}
        <div style={{background:"rgba(212,168,67,0.04)",border:`1px solid rgba(212,168,67,0.15)`,borderRadius:14,padding:24,marginBottom:28}}>
          <div style={{fontSize:18,fontWeight:700,color:"#eee",marginBottom:6}}>The Deal</div>
          <div style={{fontSize:14,color:"#999",lineHeight:1.8,marginBottom:16}}>
            EDNA-1 is completely free. Use it, modify it, ship it. The only condition: every product using EDNA must display the attribution badge visibly to end users. No exceptions, no opt-out.
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
            {["✓ Free forever","✓ Full source code","✓ Modify anything","✓ Commercial use","✓ No API keys","✓ No rate limits"].map(t=>(
              <span key={t} style={{fontSize:12,color:"#4ADE80",background:"rgba(74,222,128,0.06)",padding:"4px 12px",borderRadius:8}}>{t}</span>
            ))}
          </div>
          <div style={{fontSize:12,color:G,fontWeight:600,letterSpacing:1,marginBottom:10}}>REQUIRED ATTRIBUTION</div>
          <div style={{background:"rgba(0,0,0,0.3)",borderRadius:10,padding:16,textAlign:"center"}}>
            <Seal />
            <div style={{fontSize:11,color:"#555",marginTop:10}}>This seal must be visible in your product UI</div>
          </div>
        </div>

        {/* Seal Variants */}
        <div style={{fontSize:10,letterSpacing:3,color:"#4A4030",fontWeight:600,marginBottom:12}}>SEAL VARIANTS</div>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:28}}>
          <div style={{background:"rgba(255,255,255,0.02)",borderRadius:8,padding:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:11,color:"#666"}}>Standard</div>
            <Seal score={99} size={48}/>
          </div>
          <div style={{background:"rgba(255,255,255,0.02)",borderRadius:8,padding:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:11,color:"#666"}}>Compact</div>
            <Seal score={99} size={32}/>
          </div>
          <div style={{background:"rgba(255,255,255,0.02)",borderRadius:8,padding:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:11,color:"#666"}}>Large</div>
            <Seal score={99} size={64}/>
          </div>
        </div>

        {/* Quick Start */}
        <div style={{fontSize:10,letterSpacing:3,color:"#4A4030",fontWeight:600,marginBottom:12}}>INTEGRATION — 4 LINES</div>
        <Code id="quick" code={`<script src="https://cdn.edna-standard.org/edna.min.js"></script>
<script>
  const edna = new EDNA();
  edna.observe(document);

  // Check if user is human:
  const proof = await edna.getHumanProof();
  console.log(proof);
  // { confidence: 0.994, classification: "human_verified",
  //   signals: 14, sessions: 1 }

  // Sybil check (same human behind two accounts?):
  const sybil = await edna.compareTo(otherProfileHash);
  // { sameHuman: true, confidence: 0.91 }

  // REQUIRED: Show attribution seal
  edna.showSeal("#seal-container");
</script>

<!-- Seal container (required, must be visible) -->
<div id="seal-container"></div>`}/>

        {/* React */}
        <div style={{fontSize:10,letterSpacing:3,color:"#4A4030",fontWeight:600,marginBottom:12}}>REACT HOOK</div>
        <Code id="react" code={`// React integration example
const edna = new EDNA();
edna.observe(document);

function MyApp() {
  const [proof, setProof] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      setProof(edna.getHumanProof());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {proof?.confidence > 0.99 && <p>Verified human</p>}
      {/* REQUIRED: attribution seal must be visible */}
      <div id="edna-seal"></div>
    </div>
  );
}`}/>

        {/* npm */}
        <div style={{fontSize:10,letterSpacing:3,color:"#4A4030",fontWeight:600,marginBottom:12}}>INSTALL</div>
        <Code id="npm" code={`npm install edna-standard`}/>

        {/* License */}
        <div style={{fontSize:10,letterSpacing:3,color:"#4A4030",fontWeight:600,marginBottom:12,marginTop:28}}>LICENSE</div>
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:20,marginBottom:24}}>
          <div style={{fontSize:15,fontWeight:600,color:"#ddd",marginBottom:10}}>EDNA-1 Attribution License</div>
          <div style={{fontSize:12,color:"#888",lineHeight:1.8}}>
            Copyright © 2026 Sebastian Kläy (@sebklaey)
          </div>
          <div style={{fontSize:12,color:"#888",lineHeight:1.8,marginTop:12}}>
            Permission is hereby granted, free of charge, to any person obtaining a copy of this software, to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies, subject to the following condition:
          </div>
          <div style={{background:"rgba(212,168,67,0.06)",border:`1px solid rgba(212,168,67,0.12)`,borderRadius:8,padding:14,margin:"14px 0",fontSize:13,color:G,lineHeight:1.7}}>
            All products, services, and applications using this software must display the following attribution in a location clearly visible to end users:<br/><br/>
            <strong>"Human Proof by Sebastian Kläy @sebklaey"</strong><br/><br/>
            The attribution must include a hyperlink to the official EDNA-1 repository when displayed in a digital context. The attribution may not be hidden, obscured, or require user action to become visible.
          </div>
          <div style={{fontSize:12,color:"#888",lineHeight:1.8,marginTop:12}}>
            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND. Removal or concealment of the required attribution constitutes a license violation and terminates all rights granted herein.
          </div>
        </div>

        {/* Why attribution */}
        <div style={{fontSize:10,letterSpacing:3,color:"#4A4030",fontWeight:600,marginBottom:12}}>WHY ATTRIBUTION, NOT MONEY</div>
        <div style={{fontSize:13,color:"#666",lineHeight:1.8,marginBottom:24}}>
          EDNA-1 is infrastructure for proving humanity online. Infrastructure should be free. Charging money creates barriers. Barriers slow adoption. Slow adoption means the standard never becomes standard.
        </div>
        <div style={{fontSize:13,color:"#666",lineHeight:1.8,marginBottom:24}}>
          Attribution costs nothing to display but ensures the creator is recognized. Every app using EDNA becomes proof that this technology works — and proof that it was built by one independent artist, not a corporation.
        </div>
        <div style={{fontSize:13,color:"#666",lineHeight:1.8,marginBottom:24}}>
          I don't need your money. I need the world to know this exists.
        </div>

        {/* Creator */}
        <div style={{background:"rgba(212,168,67,0.04)",border:`1px solid rgba(212,168,67,0.12)`,borderRadius:14,padding:24,textAlign:"center",marginBottom:24}}>
          <div style={{width:64,height:64,borderRadius:32,background:"linear-gradient(135deg,#D4A843,#8B6914)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 12px"}}>🎭</div>
          <div style={{fontSize:18,fontWeight:700,color:"#eee"}}>Sebastian Kläy</div>
          <div style={{fontSize:14,color:G,fontWeight:600,marginTop:2}}>@sebklaey</div>
          <div style={{fontSize:12,color:"#666",marginTop:8,lineHeight:1.6}}>
            Independent artist & developer · Bern, Switzerland<br/>
            Physical theater background · Cypherpunk values<br/>
            Building the Book of Humanity
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:14,flexWrap:"wrap"}}>
            {["Farcaster","GitHub","Living Echo AI"].map(t=>(
              <span key={t} style={{fontSize:10,color:"#4A4030",background:"rgba(212,168,67,0.06)",padding:"5px 12px",borderRadius:12,border:"1px solid rgba(212,168,67,0.1)"}}>{t}</span>
            ))}
          </div>
        </div>

        <div style={{textAlign:"center",padding:"16px 0"}}>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            {["Attribution License","Open Source","GitHub","npm install edna-standard"].map(t=>(
              <span key={t} style={{fontSize:10,color:"#4A4030",background:"rgba(212,168,67,0.04)",padding:"5px 12px",borderRadius:12,border:"1px solid rgba(212,168,67,0.1)"}}>{t}</span>
            ))}
          </div>
        </div>
      </div>}

      {/* Compose bar */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.08)",padding:"10px 16px",display:"flex",gap:10,alignItems:"center",maxWidth:600,margin:"0 auto"}}>
        <div style={{width:32,height:32,borderRadius:16,background:"linear-gradient(135deg,#D4A843,#8B6914)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🫵</div>
        <input type="text" placeholder="Type something..." style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,color:"#ccc",fontSize:14,fontFamily:"inherit",padding:"8px 16px",outline:"none"}}/>
        <button style={{background:G,border:"none",borderRadius:16,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,flexShrink:0}}>↑</button>
      </div>

      {/* Vault Overlay */}
      {isOpen&&<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(30px)",WebkitBackdropFilter:"blur(30px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"edna-fadeIn 0.6s ease-out"}}>
        <div style={{position:"relative"}}>
          <svg viewBox="0 0 200 200" style={{width:180,height:180}}>
            <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(74,222,128,0.2)" strokeWidth="2"/>
            <circle cx="100" cy="100" r="90" fill="none" stroke="#4ADE80" strokeWidth="2" strokeDasharray={2*Math.PI*90} strokeDashoffset={0} strokeLinecap="round" transform="rotate(-90 100 100)" style={{animation:"edna-ringDraw 1.5s ease-out"}}/>
            <text x="100" y="90" textAnchor="middle" style={{fontSize:44,fill:"#4ADE80"}}>✦</text>
            <text x="100" y="118" textAnchor="middle" style={{fontSize:14,fill:"#4ADE80",letterSpacing:6,fontWeight:600}}>VERIFIED</text>
            <text x="100" y="140" textAnchor="middle" style={{fontSize:11,fill:"rgba(74,222,128,0.4)",letterSpacing:4}}>HUMAN</text>
          </svg>
          {showParticles&&particles.current.map((p,i)=><div key={i} style={{position:"absolute",left:"50%",top:"50%",width:p.s,height:p.s,marginLeft:-p.s/2,marginTop:-p.s/2,borderRadius:"50%",background:GL,opacity:0,animation:`edna-burst 1.8s ease-out ${p.del}s forwards`,"--etx":`${p.tx}px`,"--ety":`${p.ty}px`}}/>)}
        </div>
        <p style={{marginTop:32,fontSize:16,color:"#888",textAlign:"center",lineHeight:1.7,maxWidth:300}}>Your behavior confirmed you are human.<br/><span style={{color:"#555",fontSize:13}}>No name. No email. No password. Just you.</span></p>
        <div style={{marginTop:12}}><Seal score={pct} size={48}/></div>
        <button onClick={()=>setIsOpen(false)} style={{marginTop:24,background:"none",border:"1px solid rgba(74,222,128,0.2)",color:"#4ADE80",padding:"10px 28px",borderRadius:24,fontSize:13,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>Back to Feed</button>
      </div>}

      <style>{`
        *{box-sizing:border-box;margin:0}
        @keyframes edna-burst{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--etx),var(--ety)) scale(0)}}
        @keyframes edna-fadeIn{0%{opacity:0}100%{opacity:1}}
        @keyframes edna-ringDraw{0%{stroke-dashoffset:${2*Math.PI*90}}100%{stroke-dashoffset:0}}
        input::placeholder{color:#555}
        pre{scrollbar-width:none}pre::-webkit-scrollbar{display:none}
      `}</style>
    </div>
  );
}
