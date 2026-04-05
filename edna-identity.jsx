import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════
// MINI EDNA ENGINE
// ═══════════════════════════════════════
class Eng {
  constructor(){this.iv=[];this.mv=[];this.ms=[];this.sc=[];this.sv=[];this.ta=[];this.td=[];
    this.tx=[];this.ty=[];this.gy=[];this.sp=[];this.dk=0;this.tk=0;this.bl=[];this.cb=0;this.bt=null;
    this.sdc=0;this.lsd=null;this.le=null;this._lmx=null;this._lmy=null;this.lmt=null;this.mc=0;
    this.scc=0;this.ss=Date.now();this.tst=null;this.lsx=null;this.lsy=null;this._sa=false;this._st=null;}
  ts(e){const n=Date.now(),t=e.touches?.[0]||e;if(this.le)this.iv.push(n-this.le);this.le=n;this.tst=n;
    if(t.radiusX)this.ta.push(t.radiusX*(t.radiusY||t.radiusX));
    if(t.clientX!=null){this.tx.push(t.clientX/window.innerWidth);this.ty.push(t.clientY/window.innerHeight)}}
  te(){if(this.tst){this.td.push(Date.now()-this.tst);this.tst=null}}
  scroll(e){const n=Date.now(),d=e.deltaY>0?1:-1;if(this.lsd!==null&&d!==this.lsd)this.sdc++;
    this.lsd=d;this.sv.push(Math.abs(e.deltaY));if(this.lsx)this.sc.push(n-this.lsx);
    this.lsx=n;this.scc++;if(this.le)this.iv.push(n-this.le);this.le=n;
    if(!this._sa&&this.lsy)this.sp.push(n-this.lsy);this._sa=true;
    clearTimeout(this._st);this._st=setTimeout(()=>{this._sa=false;this.lsy=Date.now()},150)}
  move(e){const n=Date.now(),x=e.clientX??e.touches?.[0]?.clientX??0,y=e.clientY??e.touches?.[0]?.clientY??0;
    if(this._lmx!==null&&this.lmt!==null){const dx=x-this._lmx,dy=y-this._lmy,dt=n-this.lmt;
      if(dt>0&&(Math.abs(dx)>2||Math.abs(dy)>2)){this.ms.push(Math.sqrt(dx*dx+dy*dy)/dt);
        this.mv.push(Math.atan2(dy,dx));this.mc++}}
    this._lmx=x;this._lmy=y;this.lmt=n}
  key(e){const n=Date.now();if(this.le)this.iv.push(n-this.le);this.le=n;this.tk++;
    if(e.key==="Backspace"||e.key==="Delete")this.dk++;
    this.cb++;clearTimeout(this.bt);this.bt=setTimeout(()=>{if(this.cb>0){this.bl.push(this.cb);this.cb=0}},500)}
  gyro(e){const a=e.accelerationIncludingGravity;if(a?.x!=null)this.gy.push(Math.sqrt(a.x**2+a.y**2+a.z**2))}
  _m(a){return a.length?a.reduce((s,v)=>s+v,0)/a.length:0}
  _s(a){if(a.length<2)return 0;const m=this._m(a);return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1))}
  _cv(a){const m=this._m(a);return m?this._s(a)/m:0}
  _ent(a){if(a.length<8)return .5;const s=[...a].filter(v=>v>0).sort((a,b)=>a-b);if(s.length<8)return .5;
    const bd=[];for(let i=1;i<10;i++)bd.push(s[Math.floor(i*s.length/10)]);
    const c=new Array(10).fill(0);s.forEach(v=>{let b=0;for(let i=0;i<bd.length;i++)if(v>bd[i])b=i+1;c[Math.min(b,9)]++});
    let H=0;c.forEach(x=>{if(x>0){const p=x/s.length;H-=p*Math.log(p)/Math.LN2}});return H/(Math.log(10)/Math.LN2)}
  _ac(a){if(a.length<8)return 0;const m=this._m(a);let n=0,d=0;
    for(let i=0;i<a.length-1;i++){n+=(a[i]-m)*(a[i+1]-m);d+=(a[i]-m)**2}
    d+=(a[a.length-1]-m)**2;return d?n/d:0}
  signals(){
    const r={},iv=this.iv;
    if(iv.length>=10){const p=iv.filter(v=>v>0);if(p.length>=8){const rc=this._cv(p),lc=this._cv(p.map(v=>Math.log(v)));
      r.timingDistribution=rc>.25&&lc<rc*.9?Math.min(1,.65+rc*.35):rc<.06?.1:Math.min(1,.45+rc*.3)}
      const e=this._ent(iv);r.timingEntropy=e>=.6?Math.min(1,.6+e*.4):e>=.4?.5+(e-.4)*1.5:e<.3?.15:.4;
      const ac=this._ac(iv);r.autocorrelation=ac>.02&&ac<.7?.6+ac*.55:Math.abs(ac)<.01?.35:.4;
      if(iv.length>=20){const rc=iv.slice(-200),t=Math.floor(rc.length/3);
        const o=this._m(rc);if(o){const d=Math.abs(this._m(rc.slice(0,t))-this._m(rc.slice(-t)))/o;
          r.naturalDrift=d>.015&&d<.7?Math.min(1,.6+d*.7):.35}}}
    if(this.mv.length>=10){const d=[];for(let i=1;i<this.mv.length;i++)d.push(Math.abs(this.mv[i]-this.mv[i-1]));
      const c=this._cv(d);r.pathCurvature=c>.2&&c<3.5?Math.min(1,.55+c*.22):c<.06?.1:.3}
    if(this.ms.length>=10){const c=this._cv(this.ms);let s=.5;if(c>.35)s+=.3;if(c>.7)s+=.15;if(c<.1)s-=.35;
      r.speedVariation=Math.max(.05,Math.min(1,s))}
    if(this.sc.length>=5){const c=this._cv(this.sc),v=this._cv(this.sv);let s=.5;
      if(c>.2)s+=.2;if(v>.2)s+=.2;if(this.sdc>0)s+=.1;r.scrollBehavior=Math.max(.05,Math.min(1,s))}
    if(this.gy.length>=10){const c=this._cv(this.gy);r.deviceMotion=c>.004&&c<3?.95:c<=.004?.08:.4}
    if(this.ta.length>=6){const c=this._cv(this.ta);r.contactArea=c>.06?Math.min(1,.6+c*.8):.15}
    if(this.td.length>=6){const c=this._cv(this.td);r.clickDuration=c>.3?Math.min(1,.6+c*.3):.15}
    if(this.sp.length>=4){const c=this._cv(this.sp);r.readingPauses=c>.25?Math.min(1,.6+c*.35):.15}
    if(this.tx.length>=8){const s=(this._cv(this.tx)+this._cv(this.ty))/2;
      r.interactionMap=s>.15?Math.min(1,.55+s*.8):.4}
    if(this.tk>=25){const ra=this.dk/this.tk;r.corrections=ra>.01&&ra<.5?Math.min(1,.7+ra*.6):.4}
    if(this.bl.length>=3){const c=this._cv(this.bl);r.typingBursts=c>.12?Math.min(1,.55+c*.5):.35}
    const el=(Date.now()-this.ss)/1000,tot=iv.length+this.scc+this.mc;
    if(el>2&&tot>15){const ra=tot/el;r.eventRate=ra>.2&&ra<60?.8:ra>=60?.08:.4}
    return r;
  }
}

// ═══════════════════════════════════════
// CHLADNI TRANSFORM
// ═══════════════════════════════════════
const KEYS=["timingDistribution","timingEntropy","autocorrelation","naturalDrift",
  "pathCurvature","speedVariation","scrollBehavior","deviceMotion","contactArea",
  "clickDuration","readingPauses","interactionMap","motionCharacter","corrections",
  "typingBursts","eventRate"];

function toHarmonics(sig){return KEYS.map(k=>typeof sig[k]==="number"?sig[k]:0)}

function toModes(h){
  const modes=[];
  for(let i=0;i<h.length;i++)for(let j=i+1;j<h.length;j++){
    const a=(h[i]+h[j])/2;
    if(a>.1)modes.push({n:1+h[i]*4.5,m:1+h[j]*4.5,a,p:(h[i]-h[j])*Math.PI});
  }
  modes.sort((a,b)=>b.a-a.a);
  return modes.slice(0,10);
}

// Base modes so pattern always exists (seed identity)
const BASE_MODES=[
  {n:2,m:3,a:.3,p:0},{n:3,m:5,a:.2,p:.5},{n:1,m:4,a:.25,p:1}
];

function chladni(modes,x,y){
  let s=0;
  for(const{n,m,a,p}of modes)s+=(Math.cos(n*x+p)*Math.cos(m*y)-Math.cos(m*x)*Math.cos(n*y+p))*a;
  return s;
}

function fnvHash(samples){
  let h=0x811c9dc5;
  for(let i=0;i<samples.length;i++){h^=samples[i];h=Math.imul(h,0x01000193);h=h>>>0}
  return"edna_"+h.toString(16).padStart(8,"0");
}

// ═══════════════════════════════════════
// PRECOMPUTED FORCE FIELD
// ═══════════════════════════════════════
// Grid of gradient vectors pointing toward nodal lines.
// Particles look up their force from the grid — fast.

function buildForceField(modes,res){
  const fx=new Float32Array(res*res);
  const fy=new Float32Array(res*res);
  const field=new Float32Array(res*res);
  const step=Math.PI*2/res;
  const eps=step*0.5;

  // Compute field values
  for(let iy=0;iy<res;iy++)for(let ix=0;ix<res;ix++){
    field[iy*res+ix]=chladni(modes,ix*step,iy*step);
  }

  // Compute gradient of |field|² → points away from nodes
  // We negate it so particles move TOWARD nodes
  for(let iy=0;iy<res;iy++)for(let ix=0;ix<res;ix++){
    const idx=iy*res+ix;
    const v=field[idx];

    // Central difference gradient
    const vxp=chladni(modes,(ix+1)*step,iy*step);
    const vxm=chladni(modes,(ix-1)*step,iy*step);
    const vyp=chladni(modes,ix*step,(iy+1)*step);
    const vym=chladni(modes,ix*step,(iy-1)*step);

    // Gradient of f² = 2f * df/dx
    // Negate to get force toward nodes
    fx[idx]=-(v*(vxp-vxm));
    fy[idx]=-(v*(vyp-vym));
  }

  return{fx,fy,field,res};
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
const GOLD="#f5c542";

export default function EDNAID(){
  const cvs=useRef(null);
  const eng=useRef(new Eng());
  const particles=useRef(null);
  const forceField=useRef(null);
  const currentModes=useRef([...BASE_MODES]);
  const af=useRef(null);
  const[hash,setHash]=useState("edna_00000000");
  const[sigN,setSigN]=useState(0);
  const[evN,setEvN]=useState(0);
  const[sec,setSec]=useState(0);

  // Init particles
  useEffect(()=>{
    const p=[];
    for(let i=0;i<1500;i++){
      p.push({x:Math.random(),y:Math.random(),vx:0,vy:0,s:1+Math.random()*1.5,b:.4+Math.random()*.6});
    }
    particles.current=p;
    // Build initial force field
    forceField.current=buildForceField(currentModes.current,64);
  },[]);

  // Bind events
  useEffect(()=>{
    const e=eng.current;
    const h={mousedown:ev=>e.ts(ev),touchstart:ev=>e.ts(ev),mouseup:()=>e.te(),touchend:()=>e.te(),
      mousemove:ev=>e.move(ev),touchmove:ev=>e.move(ev),wheel:ev=>e.scroll(ev),keydown:ev=>e.key(ev)};
    const gy=ev=>e.gyro(ev);
    Object.entries(h).forEach(([k,fn])=>document.addEventListener(k,fn,
      ["touchstart","touchmove","wheel"].includes(k)?{passive:true}:undefined));
    if(typeof DeviceMotionEvent!=="undefined"&&typeof DeviceMotionEvent.requestPermission==="function"){
      const r=()=>{DeviceMotionEvent.requestPermission().then(s=>{if(s==="granted")window.addEventListener("devicemotion",gy)}).catch(()=>{});
        document.removeEventListener("click",r)};document.addEventListener("click",r);
    }else window.addEventListener("devicemotion",gy);
    return()=>{Object.entries(h).forEach(([k,fn])=>document.removeEventListener(k,fn));
      window.removeEventListener("devicemotion",gy)};
  },[]);

  // Update modes + force field periodically
  useEffect(()=>{
    const iv=setInterval(()=>{
      const sig=eng.current.signals();
      const keys=Object.keys(sig);
      setSigN(keys.length);
      setEvN(eng.current.iv.length+eng.current.scc+eng.current.mc);
      setSec(Math.floor((Date.now()-eng.current.ss)/1000));

      const harmonics=toHarmonics(sig);
      const userModes=toModes(harmonics);

      // Merge: base modes + user modes (user modes override as they appear)
      const allModes=userModes.length>2?userModes:[...BASE_MODES,...userModes];
      currentModes.current=allModes;

      // Rebuild force field
      forceField.current=buildForceField(allModes,64);

      // Hash
      const samples=[];const step=Math.PI/16;
      for(let iy=0;iy<16;iy++)for(let ix=0;ix<16;ix++){
        const v=chladni(allModes,ix*step,iy*step);
        samples.push(Math.max(0,Math.min(255,Math.floor((v+1)*127.5))));
      }
      setHash(fnvHash(samples));
    },500);
    return()=>clearInterval(iv);
  },[]);

  // Render loop
  useEffect(()=>{
    const canvas=cvs.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const S=canvas.width;

    const loop=()=>{
      const pp=particles.current;
      const ff=forceField.current;
      if(!pp||!ff){af.current=requestAnimationFrame(loop);return}

      const res=ff.res;

      // Move particles using precomputed force field
      for(const p of pp){
        // Grid lookup
        const gx=Math.floor(p.x*res)%res;
        const gy=Math.floor(p.y*res)%res;
        const gi=((gy+res)%res)*res+((gx+res)%res);

        const forceX=ff.fx[gi]||0;
        const forceY=ff.fy[gi]||0;

        // Apply force toward nodes
        p.vx+=forceX*0.00015;
        p.vy+=forceY*0.00015;

        // Tiny vibration keeps it alive
        p.vx+=(Math.random()-.5)*0.0002;
        p.vy+=(Math.random()-.5)*0.0002;

        // Strong damping — sand settles
        p.vx*=0.88;
        p.vy*=0.88;

        p.x+=p.vx;
        p.y+=p.vy;

        // Wrap
        if(p.x<0)p.x+=1;if(p.x>=1)p.x-=1;
        if(p.y<0)p.y+=1;if(p.y>=1)p.y-=1;
      }

      // Draw — fade trail
      ctx.fillStyle="rgba(8,6,20,0.12)";
      ctx.fillRect(0,0,S,S);

      // Draw particles
      for(const p of pp){
        const px=Math.floor(p.x*S);
        const py=Math.floor(p.y*S);
        const b=p.b;
        const r=Math.floor(180*b+60);
        const g=Math.floor(140*b+40);
        const bl=Math.floor(40*b+15);
        ctx.fillStyle=`rgba(${r},${g},${bl},${0.5+b*0.4})`;
        ctx.fillRect(px,py,p.s,p.s);
      }

      af.current=requestAnimationFrame(loop);
    };

    ctx.fillStyle="#080614";ctx.fillRect(0,0,S,S);
    af.current=requestAnimationFrame(loop);
    return()=>{if(af.current)cancelAnimationFrame(af.current)};
  },[]);

  const S=Math.min(typeof window!=="undefined"?window.innerWidth-32:320,380);

  return(
    <div style={{minHeight:"100vh",background:"#080614",display:"flex",flexDirection:"column",
      alignItems:"center",padding:"20px 16px 100px",fontFamily:"-apple-system,sans-serif",color:"#e5e5e5"}}>

      <div style={{fontSize:9,letterSpacing:6,color:"#7a7068",marginBottom:6}}>EDNA-1 PROTOCOL</div>
      <h1 style={{fontSize:22,color:GOLD,margin:"0 0 4px",fontWeight:700,letterSpacing:1}}>E-DNA Identity</h1>
      <p style={{fontSize:12,color:"#999",marginBottom:20,textAlign:"center"}}>
        Interact to reveal your resonance pattern
      </p>

      {/* The living fingerprint */}
      <div style={{position:"relative",width:S,height:S,marginBottom:16}}>
        <canvas ref={cvs} width={S} height={S}
          style={{width:S,height:S,borderRadius:12,border:"1px solid rgba(212,168,67,0.12)"}}/>
        {/* Hash overlay */}
        <div style={{position:"absolute",bottom:10,left:0,right:0,textAlign:"center"}}>
          <span style={{background:"rgba(8,6,20,0.85)",padding:"5px 14px",borderRadius:8,
            fontSize:14,fontFamily:"'SF Mono',Menlo,monospace",color:GOLD,letterSpacing:2}}>
            {hash}
          </span>
        </div>
        {/* Corner markers */}
        {[[0,0,1,0,0,1],[S-18,0,0,0,1,1],[0,S-18,1,1,0,0],[S-18,S-18,0,1,1,0]].map(([x,y,tl,bl2,tr,br],i)=>(
          <div key={i} style={{position:"absolute",left:x,top:y,width:14,height:14,
            borderTop:tl?`2px solid rgba(212,168,67,0.3)`:"none",
            borderBottom:bl2?`2px solid rgba(212,168,67,0.3)`:"none",
            borderLeft:tl||bl2?`2px solid rgba(212,168,67,0.3)`:"none",
            borderRight:tr||br?`2px solid rgba(212,168,67,0.3)`:"none"}}/>
        ))}
      </div>

      {/* Stats */}
      <div style={{display:"flex",gap:16,marginBottom:20,fontSize:11,color:"#999"}}>
        <span>{sigN} signals</span>
        <span>{evN} events</span>
        <span>{sec}s</span>
      </div>

      {/* Type area */}
      <input type="text" placeholder="Type to shape your pattern..."
        style={{width:"100%",maxWidth:360,background:"rgba(212,168,67,0.03)",
          border:"1px solid rgba(212,168,67,0.08)",borderRadius:10,color:"#b8a080",
          fontSize:14,fontFamily:"inherit",padding:"12px 16px",outline:"none",
          boxSizing:"border-box",marginBottom:20}}/>

      {/* Scroll content */}
      {[
        "Every movement creates a frequency. Your touch, rhythm, and hesitations form harmonics that resonate through the behavioral field.",
        "Like sand on Chladni's vibrating plate, your data clusters into nodal patterns. Where frequencies cancel, the sand collects.",
        "No two humans produce the same resonance. Your pattern is your proof — anonymous, unique, unforgeable.",
        "The longer you interact, the more harmonics emerge. The pattern sharpens. The identity crystallizes.",
        "A bot produces uniform frequencies. No pattern. Just noise. A human produces a symphony of micro-variations.",
        "Scroll through this text. Your rhythm is a frequency. Your reading pauses are a frequency. Even the speed of your eyes shapes the sand.",
        "The pattern you see is mathematically yours. Same human, same resonance — across any device.",
      ].map((t,i)=>(
        <p key={i} style={{fontSize:13,lineHeight:1.9,color:"#9a9590",marginBottom:12,
          fontStyle:"italic",maxWidth:360,textAlign:"center"}}>{t}</p>
      ))}

      <div style={{marginTop:20,fontSize:10,color:"#8a8478",letterSpacing:2}}>
        Human Proof by @sebklaey · Behavioral Kymatik
      </div>

      <style>{`*{box-sizing:border-box;margin:0}input::placeholder{color:rgba(212,168,67,0.2)}`}</style>
    </div>
  );
}
