import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════
// EDNA-1 BEHAVIORAL ENGINE
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
// CHLADNI MATH
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
const BASE_MODES=[{n:2,m:3,a:.3,p:0},{n:3,m:5,a:.2,p:.5},{n:1,m:4,a:.25,p:1}];

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
function buildForceField(modes,res){
  const fx=new Float32Array(res*res),fy=new Float32Array(res*res),field=new Float32Array(res*res);
  const step=Math.PI*2/res;
  for(let iy=0;iy<res;iy++)for(let ix=0;ix<res;ix++)field[iy*res+ix]=chladni(modes,ix*step,iy*step);
  for(let iy=0;iy<res;iy++)for(let ix=0;ix<res;ix++){
    const idx=iy*res+ix,v=field[idx];
    const vxp=chladni(modes,(ix+1)*step,iy*step),vxm=chladni(modes,(ix-1)*step,iy*step);
    const vyp=chladni(modes,ix*step,(iy+1)*step),vym=chladni(modes,ix*step,(iy-1)*step);
    fx[idx]=-(v*(vxp-vxm));fy[idx]=-(v*(vyp-vym));
  }
  return{fx,fy,field,res};
}

// ═══════════════════════════════════════
// CROSS-DEVICE IDENTITY SYSTEM
// ═══════════════════════════════════════

// Signal keys used for identity vector (excluding motionCharacter which is unused)
const IDENTITY_KEYS = [
  "timingDistribution","timingEntropy","autocorrelation","naturalDrift",
  "pathCurvature","speedVariation","scrollBehavior","deviceMotion","contactArea",
  "clickDuration","readingPauses","interactionMap","corrections",
  "typingBursts","eventRate",
];

// Cross-device weights: behavioral/cognitive signals high, hardware-dependent signals low
// These are the signals that stay consistent regardless of device:
//   - Timing patterns (how fast you think/react) → HIGH
//   - Rhythm & entropy (your personal tempo) → HIGH
//   - Corrections (how much you second-guess) → HIGH
//   - Scroll behavior (reading style) → MEDIUM
//   - Path curvature (motor control style) → MEDIUM
//   - Contact area / device motion (hardware-specific) → LOW
const SIGNAL_WEIGHTS = {
  timingDistribution: 3.0,  // cognitive — device-independent
  timingEntropy:      3.0,  // cognitive — device-independent
  autocorrelation:    2.5,  // rhythm pattern — device-independent
  naturalDrift:       2.5,  // fatigue/focus pattern — device-independent
  corrections:        2.5,  // thinking style — device-independent
  typingBursts:       2.5,  // thought chunking — device-independent
  eventRate:          2.0,  // overall tempo — device-independent
  speedVariation:     2.0,  // motor variation — mostly device-independent
  scrollBehavior:     1.5,  // reading style — somewhat device-dependent
  readingPauses:      1.5,  // comprehension — device-independent
  pathCurvature:      1.0,  // mouse vs touch differs
  clickDuration:      1.0,  // touch vs click differs
  interactionMap:     0.8,  // screen size dependent
  contactArea:        0.3,  // touch-only, highly device-dependent
  deviceMotion:       0.3,  // mobile-only, highly device-dependent
};

const PREFIXES = [
  "Echo","Nova","Flux","Drift","Pulse","Vox","Nyx","Rune","Aura","Zen",
  "Hex","Lyra","Onyx","Iris","Volt","Cipher","Prism","Glitch","Haze","Shard",
  "Phantom","Orbit","Nexus","Aria","Blaze","Crest","Dusk","Ember","Frost","Glyph",
];
const SUFFIXES = [
  "Walker","Weaver","Singer","Keeper","Runner","Dancer","Dreamer","Finder","Seeker","Maker",
  "Rider","Caster","Diver","Spark","Storm","Shade","Wind","Flow","Tide","Bloom",
  "Wing","Stone","Fern","Ray","Mist","Star","Vale","Thorn","Reed","Forge",
];

function generateName(vec) {
  let seed = 0;
  for (let i = 0; i < vec.length; i++) {
    seed += Math.floor(vec[i] * 1000) * (i + 1);
    seed = ((seed << 5) - seed + Math.floor(vec[i] * 7919)) | 0;
  }
  seed = Math.abs(seed);
  return `${PREFIXES[seed % PREFIXES.length]}${SUFFIXES[Math.floor(seed / PREFIXES.length) % SUFFIXES.length]}_${(seed % 900) + 100}`;
}

function getWeightedVector(sig) {
  return IDENTITY_KEYS.map(k => {
    const val = typeof sig[k] === "number" ? sig[k] : 0;
    const w = SIGNAL_WEIGHTS[k] || 1;
    return val * w;
  });
}

function getRawVector(sig) {
  return IDENTITY_KEYS.map(k => typeof sig[k] === "number" ? sig[k] : 0);
}

// Weighted cosine similarity — emphasizes device-independent signals
function weightedCosineSim(a, b) {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Thresholds
const MATCH_SAME_DEVICE = 0.93;   // same device — tight match
const MATCH_CROSS_DEVICE = 0.85;  // cross device — looser but still strong

const STORAGE_KEY = "edna-identity-vault";

// ═══════════════════════════════════════
// SOCIAL FEED DATA
// ═══════════════════════════════════════
const POSTS = [
  { id:1, user:"@cryptoAlice", handle:"alice.eth", time:"2m", text:"Just deployed my first smart contract on Base. The gas fees are actually insane \u2014 $0.001 per transaction. The future is here.", likes:42, replies:7, recasts:12, avatar:"A" },
  { id:2, user:"@degenTrader", handle:"degen.eth", time:"8m", text:"Hot take: AI agents will replace 80% of DeFi dashboards within 18 months. You won\u2019t interact with protocols \u2014 agents will do it for you.", likes:128, replies:34, recasts:56, avatar:"D" },
  { id:3, user:"@privacyMaxi", handle:"anon.fc", time:"15m", text:"Your browser is the new vault. Local-first AI + on-chain storage = the end of centralized data harvesting. Wake up.", likes:89, replies:21, recasts:31, avatar:"P" },
  { id:4, user:"@buildooor", handle:"build.base", time:"23m", text:"Shipped 3 mini apps this week. Farcaster frames are addictive to build. Anyone else in the rabbit hole?", likes:67, replies:15, recasts:28, avatar:"B" },
  { id:5, user:"@artCoder", handle:"kunst.eth", time:"41m", text:"Code is theater. Every function is a scene. Every deploy is a premiere. We\u2019re all performing for the blockchain audience.", likes:203, replies:44, recasts:71, avatar:"K" },
  { id:6, user:"@onchainMom", handle:"mama.base", time:"1h", text:"My son asked me what a blockchain is. I said it\u2019s a diary that nobody can erase. He said \u2018like my crayon on the wall?\u2019 Exactly.", likes:312, replies:58, recasts:94, avatar:"M" },
];

const SIGNAL_LABELS = {
  timingDistribution:"Timing Distribution", timingEntropy:"Timing Entropy",
  autocorrelation:"Autocorrelation", naturalDrift:"Natural Drift",
  pathCurvature:"Path Curvature", speedVariation:"Speed Variation",
  scrollBehavior:"Scroll Behavior", deviceMotion:"Device Motion",
  contactArea:"Contact Area", clickDuration:"Click Duration",
  readingPauses:"Reading Pauses", interactionMap:"Interaction Map",
  corrections:"Corrections", typingBursts:"Typing Bursts", eventRate:"Event Rate",
};

function SignalBar({ name, value, delay }) {
  const label = SIGNAL_LABELS[name] || name;
  const pct = Math.round(value * 100);
  const w = SIGNAL_WEIGHTS[name] || 1;
  const hue = value > 0.6 ? 48 : value > 0.35 ? 30 : 0;
  const sat = value > 0.6 ? "85%" : value > 0.35 ? "60%" : "70%";
  const lum = value > 0.6 ? "55%" : value > 0.35 ? "45%" : "40%";
  return (
    <div style={{ marginBottom:6, opacity:0, animation:`fadeSlideIn 0.4s ease ${delay}ms forwards` }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:2 }}>
        <span style={{ color:"#b8a080", letterSpacing:0.5 }}>
          {label}
          {w >= 2.5 && <span style={{ color:"#d4a843", marginLeft:4, fontSize:8 }}>\u25cf CORE</span>}
          {w <= 0.5 && <span style={{ color:"#555", marginLeft:4, fontSize:8 }}>\u25cb device</span>}
        </span>
        <span style={{ color:`hsl(${hue},${sat},${lum})`, fontFamily:"monospace", fontWeight:600 }}>{pct}%</span>
      </div>
      <div style={{ height:3, background:"rgba(255,255,255,0.04)", borderRadius:2, overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:2, width:`${pct}%`,
          background:`linear-gradient(90deg, hsl(${hue},${sat},${lum}), hsl(${hue},90%,65%))`,
          transition:"width 0.5s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: value > 0.6 ? `0 0 8px hsl(${hue},80%,50%,0.4)` : "none",
        }} />
      </div>
    </div>
  );
}

function Post({ post, onInteract }) {
  const [liked, setLiked] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const colors = ["#d4a843","#c77dba","#5b9bd5","#70c070","#e07070","#70b8b8"];
  const col = colors[post.id % colors.length];
  return (
    <div style={{
      background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)",
      borderRadius:14, padding:"16px 18px", marginBottom:10, transition:"border-color 0.3s, background 0.3s",
    }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(212,168,67,0.15)";e.currentTarget.style.background="rgba(255,255,255,0.035)"}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.05)";e.currentTarget.style.background="rgba(255,255,255,0.02)"}}
    >
      <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
        <div style={{
          width:38, height:38, borderRadius:10, background:`linear-gradient(135deg, ${col}22, ${col}44)`,
          border:`1px solid ${col}33`, display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16, fontWeight:700, color:col, flexShrink:0,
        }}>{post.avatar}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:14, fontWeight:600, color:"#e5e0d8" }}>{post.user}</span>
            <span style={{ fontSize:11, color:"#666" }}>{post.handle}</span>
            <span style={{ fontSize:10, color:"#555", marginLeft:"auto" }}>{post.time}</span>
          </div>
          <p style={{ fontSize:13.5, lineHeight:1.65, color:"#c8c0b4", margin:"8px 0 12px" }}>{post.text}</p>
          <div style={{ display:"flex", gap:20, fontSize:12 }}>
            <button onClick={()=>{setLiked(!liked);onInteract()}} style={{
              background:"none", border:"none", color:liked?"#d4a843":"#777", cursor:"pointer",
              display:"flex", alignItems:"center", gap:5, fontSize:12, padding:0, transition:"color 0.2s",
            }}><span style={{fontSize:15}}>{liked?"\u2605":"\u2606"}</span> {post.likes+(liked?1:0)}</button>
            <button onClick={()=>{setShowReply(!showReply);onInteract()}} style={{
              background:"none", border:"none", color:"#777", cursor:"pointer",
              display:"flex", alignItems:"center", gap:5, fontSize:12, padding:0,
            }}><span style={{fontSize:13}}>\u21a9</span> {post.replies}</button>
            <span style={{ color:"#555", display:"flex", alignItems:"center", gap:5 }}>
              <span style={{fontSize:13}}>\u2934</span> {post.recasts}
            </span>
          </div>
          {showReply && (
            <input type="text" placeholder="Write a reply..." autoFocus style={{
              width:"100%", marginTop:10, padding:"10px 14px", fontSize:13,
              background:"rgba(212,168,67,0.04)", border:"1px solid rgba(212,168,67,0.1)",
              borderRadius:10, color:"#c8c0b4", outline:"none", boxSizing:"border-box",
            }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// IDENTITY BANNER
// ═══════════════════════════════════════
function IdentityBanner({ identityState, userName, matchScore, matchType, knownCount, GOLD }) {
  if (identityState === "scanning") return null;
  const isNew = identityState === "new";
  return (
    <div style={{
      animation:"identityReveal 0.8s cubic-bezier(0.16,1,0.3,1) forwards", opacity:0,
      marginBottom:14, borderRadius:16, overflow:"hidden",
      background: isNew
        ? "linear-gradient(135deg, rgba(212,168,67,0.08), rgba(212,168,67,0.02))"
        : "linear-gradient(135deg, rgba(74,222,128,0.08), rgba(74,222,128,0.02))",
      border:`1px solid ${isNew ? "rgba(212,168,67,0.15)" : "rgba(74,222,128,0.15)"}`,
    }}>
      <div style={{ padding:"18px 20px" }}>
        <div style={{
          fontSize:9, letterSpacing:4, textTransform:"uppercase",
          color: isNew ? "#b8a080" : "#4ade80", marginBottom:10,
          display:"flex", alignItems:"center", gap:8,
        }}>
          <span style={{
            width:6, height:6, borderRadius:"50%",
            background: isNew ? GOLD : "#4ade80",
            boxShadow:`0 0 8px ${isNew ? GOLD : "#4ade80"}44`,
            animation:"pulse 2s ease infinite",
          }} />
          {isNew ? "NEW IDENTITY DETECTED" : "IDENTITY RECOGNIZED"}
          {matchType === "cross-device" && (
            <span style={{
              fontSize:8, padding:"2px 6px", borderRadius:8,
              background:"rgba(99,179,237,0.12)", border:"1px solid rgba(99,179,237,0.2)",
              color:"#63b3ed", marginLeft:4,
            }}>CROSS-DEVICE</span>
          )}
        </div>

        {isNew ? (
          <div>
            <div style={{ fontSize:14, color:"#999", marginBottom:6 }}>Your given name is:</div>
            <div style={{
              fontSize:26, fontWeight:800, letterSpacing:1.5, color:GOLD,
              textShadow:`0 0 30px ${GOLD}33`,
              fontFamily:"'SF Mono', Menlo, monospace", marginBottom:8,
            }}>{userName}</div>
            <div style={{ fontSize:12, color:"#888", lineHeight:1.7 }}>
              This name was born from your behavioral fingerprint.
              <br />Remember it \u2014 the system will recognize you. On any device.
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:14, color:"#aaa", marginBottom:4 }}>Hello:</div>
            <div style={{
              fontSize:28, fontWeight:800, letterSpacing:1.5, color:"#4ade80",
              textShadow:"0 0 30px rgba(74,222,128,0.2)",
              fontFamily:"'SF Mono', Menlo, monospace", marginBottom:6,
            }}>{userName}</div>
            <div style={{
              fontSize:15, color:"#4ade80", fontWeight:600, marginBottom:4, fontStyle:"italic",
            }}>I know you.</div>
            <div style={{ fontSize:11, color:"#777" }}>
              Behavioral match: {Math.round(matchScore * 100)}% similarity
              {matchType === "cross-device" && " \u2014 recognized across devices"}
            </div>
          </div>
        )}

        <div style={{
          marginTop:12, paddingTop:10,
          borderTop:`1px solid ${isNew ? "rgba(212,168,67,0.08)" : "rgba(74,222,128,0.08)"}`,
          fontSize:10, color:"#666", display:"flex", justifyContent:"space-between",
        }}>
          <span>{knownCount} {knownCount===1?"identity":"identities"} in shared vault</span>
          <span style={{ color:isNew?GOLD:"#4ade80", fontFamily:"monospace" }}>
            {isNew ? "\u2605 first contact" : "\u2606 returning"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════
const RES=64, PARTICLE_COUNT=1400, CVS_SIZE=400;

export default function EDNASocialMVP() {
  const offscreenRef=useRef(null);
  const eng=useRef(new Eng());
  const particles=useRef(null);
  const forceField=useRef(null);
  const currentModes=useRef([...BASE_MODES]);
  const af=useRef(null);
  const feedCvsRef=useRef(null);
  const identityCvsRef=useRef(null);

  const [hash,setHash]=useState("edna_00000000");
  const [sigN,setSigN]=useState(0);
  const [evN,setEvN]=useState(0);
  const [sec,setSec]=useState(0);
  const [signals,setSignals]=useState({});
  const [confidence,setConfidence]=useState(0);
  const [verified,setVerified]=useState(false);
  const [compose,setCompose]=useState("");
  const [tab,setTab]=useState("feed");

  const [identityState,setIdentityState]=useState("scanning");
  const [userName,setUserName]=useState("");
  const [matchScore,setMatchScore]=useState(0);
  const [matchType,setMatchType]=useState(""); // "same-device" | "cross-device" | ""
  const [knownCount,setKnownCount]=useState(0);
  const identityLocked=useRef(false);

  const calcConfidence=useCallback((sig)=>{
    const vals=Object.values(sig);
    if(!vals.length)return 0;
    return Math.min(100,Math.round((vals.filter(v=>v>0.5).length/Math.max(vals.length,6))*100));
  },[]);

  // ═══ IDENTITY: Shared Vault + Weighted Matching ═══
  const identifyUser=useCallback(async(sig)=>{
    if(identityLocked.current)return;
    const raw=getRawVector(sig);
    const nonZero=raw.filter(v=>v>0).length;
    if(nonZero<5)return;
    identityLocked.current=true;

    const weighted=getWeightedVector(sig);

    // Load from SHARED vault (shared: true → cross-device)
    let vault=[];
    try{
      const stored=await window.storage.get(STORAGE_KEY, true);
      if(stored&&stored.value)vault=JSON.parse(stored.value);
    }catch(e){}

    setKnownCount(vault.length);

    // Compare against all known identities using weighted similarity
    let bestMatch=null, bestScore=0;
    for(const identity of vault){
      const storedWeighted=identity.weightedVector||identity.signalVector;
      const sim=weightedCosineSim(weighted,storedWeighted);
      if(sim>bestScore){bestScore=sim;bestMatch=identity}
    }

    // Determine match type based on threshold
    const isSameDevice = bestScore >= MATCH_SAME_DEVICE;
    const isCrossDevice = !isSameDevice && bestScore >= MATCH_CROSS_DEVICE;
    const isMatch = isSameDevice || isCrossDevice;

    if(isMatch && bestMatch){
      // RECOGNIZED
      setUserName(bestMatch.name);
      setIdentityState("recognized");
      setMatchScore(bestScore);
      setMatchType(isCrossDevice ? "cross-device" : "same-device");
      setKnownCount(vault.length);

      // Update stored profile: blend old + new (learning)
      bestMatch.weightedVector=bestMatch.weightedVector
        ? bestMatch.weightedVector.map((v,i)=>v*0.7+weighted[i]*0.3)
        : weighted;
      bestMatch.rawVector=bestMatch.rawVector
        ? bestMatch.rawVector.map((v,i)=>v*0.7+raw[i]*0.3)
        : raw;
      bestMatch.lastSeen=Date.now();
      bestMatch.visits=(bestMatch.visits||1)+1;
      bestMatch.devices=[...new Set([...(bestMatch.devices||[]),detectDeviceType()])];

      try{await window.storage.set(STORAGE_KEY,JSON.stringify(vault),true)}catch(e){}
    } else {
      // NEW IDENTITY
      const name=generateName(weighted);
      vault.push({
        name,
        weightedVector:weighted,
        rawVector:raw,
        createdAt:Date.now(),
        lastSeen:Date.now(),
        visits:1,
        devices:[detectDeviceType()],
      });

      try{await window.storage.set(STORAGE_KEY,JSON.stringify(vault),true)}catch(e){}

      setUserName(name);
      setIdentityState("new");
      setMatchScore(0);
      setMatchType("");
      setKnownCount(vault.length);
    }
  },[]);

  // Init
  useEffect(()=>{
    const oc=document.createElement("canvas");
    oc.width=CVS_SIZE;oc.height=CVS_SIZE;
    offscreenRef.current=oc;
    const p=[];
    for(let i=0;i<PARTICLE_COUNT;i++)
      p.push({x:Math.random(),y:Math.random(),vx:0,vy:0,s:1+Math.random()*1.2,b:.4+Math.random()*.6});
    particles.current=p;
    forceField.current=buildForceField(currentModes.current,RES);
    (async()=>{
      try{
        const stored=await window.storage.get(STORAGE_KEY,true);
        if(stored&&stored.value)setKnownCount(JSON.parse(stored.value).length);
      }catch(e){}
    })();
  },[]);

  // Events
  useEffect(()=>{
    const e=eng.current;
    const h={mousedown:ev=>e.ts(ev),touchstart:ev=>e.ts(ev),mouseup:()=>e.te(),touchend:()=>e.te(),
      mousemove:ev=>e.move(ev),touchmove:ev=>e.move(ev),wheel:ev=>e.scroll(ev),keydown:ev=>e.key(ev)};
    const gy=ev=>e.gyro(ev);
    Object.entries(h).forEach(([k,fn])=>document.addEventListener(k,fn,["touchstart","touchmove","wheel"].includes(k)?{passive:true}:undefined));
    if(typeof DeviceMotionEvent!=="undefined"&&typeof DeviceMotionEvent.requestPermission==="function"){
      const r=()=>{DeviceMotionEvent.requestPermission().then(s=>{if(s==="granted")window.addEventListener("devicemotion",gy)}).catch(()=>{});document.removeEventListener("click",r)};
      document.addEventListener("click",r);
    }else window.addEventListener("devicemotion",gy);
    return()=>{Object.entries(h).forEach(([k,fn])=>document.removeEventListener(k,fn));window.removeEventListener("devicemotion",gy)};
  },[]);

  // Signals
  useEffect(()=>{
    const iv=setInterval(()=>{
      const sig=eng.current.signals();
      setSigN(Object.keys(sig).length);
      setEvN(eng.current.iv.length+eng.current.scc+eng.current.mc);
      setSec(Math.floor((Date.now()-eng.current.ss)/1000));
      setSignals(sig);
      const conf=calcConfidence(sig);
      setConfidence(conf);
      if(conf>=75&&!verified){setVerified(true);identifyUser(sig)}
      const harmonics=toHarmonics(sig);
      const userModes=toModes(harmonics);
      const allModes=userModes.length>2?userModes:[...BASE_MODES,...userModes];
      currentModes.current=allModes;
      forceField.current=buildForceField(allModes,RES);
      const samples=[];const step=Math.PI/16;
      for(let iy=0;iy<16;iy++)for(let ix=0;ix<16;ix++){
        const v=chladni(allModes,ix*step,iy*step);
        samples.push(Math.max(0,Math.min(255,Math.floor((v+1)*127.5))));
      }
      setHash(fnvHash(samples));
    },500);
    return()=>clearInterval(iv);
  },[verified,calcConfidence,identifyUser]);

  // Animation
  useEffect(()=>{
    const oc=offscreenRef.current;if(!oc)return;
    const ctx=oc.getContext("2d");const S=CVS_SIZE;
    ctx.fillStyle="#0a0816";ctx.fillRect(0,0,S,S);
    const loop=()=>{
      const pp=particles.current,ff=forceField.current;
      if(!pp||!ff){af.current=requestAnimationFrame(loop);return}
      const res=ff.res;
      for(const p of pp){
        const gx=((Math.floor(p.x*res)%res)+res)%res;
        const gy=((Math.floor(p.y*res)%res)+res)%res;
        const gi=gy*res+gx;
        p.vx+=(ff.fx[gi]||0)*0.00015;p.vy+=(ff.fy[gi]||0)*0.00015;
        p.vx+=(Math.random()-.5)*0.0002;p.vy+=(Math.random()-.5)*0.0002;
        p.vx*=0.88;p.vy*=0.88;p.x+=p.vx;p.y+=p.vy;
        if(p.x<0)p.x+=1;if(p.x>=1)p.x-=1;if(p.y<0)p.y+=1;if(p.y>=1)p.y-=1;
      }
      ctx.fillStyle="rgba(10,8,22,0.12)";ctx.fillRect(0,0,S,S);
      for(const p of pp){
        const px=Math.floor(p.x*S),py=Math.floor(p.y*S),b=p.b;
        ctx.fillStyle=`rgba(${Math.floor(180*b+60)},${Math.floor(140*b+40)},${Math.floor(40*b+15)},${0.5+b*0.4})`;
        ctx.fillRect(px,py,p.s,p.s);
      }
      if(feedCvsRef.current){feedCvsRef.current.getContext("2d").drawImage(oc,0,0,200,200)}
      if(identityCvsRef.current){identityCvsRef.current.getContext("2d").drawImage(oc,0,0,CVS_SIZE,CVS_SIZE)}
      af.current=requestAnimationFrame(loop);
    };
    af.current=requestAnimationFrame(loop);
    return()=>{if(af.current)cancelAnimationFrame(af.current)};
  },[]);

  const sigEntries=Object.entries(signals);
  const GOLD="#d4a843";
  const confColor=confidence>=75?"#4ade80":confidence>=40?GOLD:"#ef4444";

  return (
    <div style={{
      minHeight:"100vh",background:"#0a0816",
      fontFamily:"'SF Pro Text',-apple-system,BlinkMacSystemFont,sans-serif",color:"#e5e0d8",
      display:"flex",flexDirection:"column",alignItems:"center",
    }}>
      <style>{`
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(74,222,128,0.15)}50%{box-shadow:0 0 40px rgba(74,222,128,0.3)}}
        @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}
        @keyframes verifiedPop{0%{transform:scale(0.6);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes identityReveal{0%{opacity:0;transform:translateY(-20px) scale(0.95)}100%{opacity:1;transform:translateY(0) scale(1)}}
        *{box-sizing:border-box;margin:0}
        input::placeholder,textarea::placeholder{color:rgba(212,168,67,0.25)}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(212,168,67,0.15);border-radius:2px}
      `}</style>

      {/* HEADER */}
      <div style={{
        width:"100%",maxWidth:520,padding:"16px 18px 12px",
        borderBottom:"1px solid rgba(255,255,255,0.04)",position:"sticky",top:0,
        background:"rgba(10,8,22,0.92)",backdropFilter:"blur(20px)",zIndex:10,
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <div style={{fontSize:8,letterSpacing:5,color:"#7a7068",marginBottom:2}}>EDNA-1 PROTOCOL</div>
            <div style={{fontSize:17,fontWeight:700,color:GOLD,letterSpacing:0.5}}>Social Proof</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {identityState!=="scanning"&&(
              <div style={{
                padding:"4px 10px",borderRadius:14,fontSize:10,fontWeight:600,
                background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.12)",
                color:GOLD,fontFamily:"monospace",letterSpacing:0.5,
                maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
              }}>{userName}</div>
            )}
            <div style={{
              padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:600,letterSpacing:0.5,
              background:verified?"rgba(74,222,128,0.1)":"rgba(255,255,255,0.03)",
              border:`1px solid ${verified?"rgba(74,222,128,0.25)":"rgba(255,255,255,0.06)"}`,
              color:verified?"#4ade80":"#777",
              animation:verified?"glow 2s ease-in-out infinite":"none",
            }}>{verified?"\u2726 HUMAN":"SCANNING..."}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:0}}>
          {["feed","identity"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              flex:1,padding:"8px 0",fontSize:12,fontWeight:600,letterSpacing:1,
              background:"none",border:"none",cursor:"pointer",
              color:tab===t?GOLD:"#666",
              borderBottom:tab===t?`2px solid ${GOLD}`:"2px solid transparent",
              textTransform:"uppercase",transition:"all 0.3s",
            }}>{t==="feed"?"Feed":"E-Identity"}</button>
          ))}
        </div>
      </div>

      {/* CONFIDENCE BAR */}
      <div style={{width:"100%",maxWidth:520,padding:"0 18px"}}>
        <div style={{height:2,background:"rgba(255,255,255,0.03)",borderRadius:1,overflow:"hidden"}}>
          <div style={{
            height:"100%",width:`${confidence}%`,borderRadius:1,
            background:`linear-gradient(90deg, ${confColor}88, ${confColor})`,
            transition:"width 0.6s cubic-bezier(0.4,0,0.2,1), background 0.6s",
            boxShadow:`0 0 12px ${confColor}44`,
          }}/>
        </div>
      </div>

      <div style={{width:"100%",maxWidth:520,padding:"12px 18px 100px",flex:1}}>

        <IdentityBanner identityState={identityState} userName={userName}
          matchScore={matchScore} matchType={matchType} knownCount={knownCount} GOLD={GOLD} />

        {/* ═══ FEED ═══ */}
        {tab==="feed"&&(
          <div>
            <div style={{
              background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",
              borderRadius:14,padding:"14px 16px",marginBottom:14,
            }}>
              <textarea value={compose} onChange={e=>setCompose(e.target.value)}
                placeholder={identityState==="recognized"?`Cast as ${userName}...`:"What's on your mind? (Your rhythm is being analyzed...)"}
                rows={3} style={{
                  width:"100%",background:"transparent",border:"none",color:"#c8c0b4",
                  fontSize:14,lineHeight:1.6,resize:"none",outline:"none",fontFamily:"inherit",
                }}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                <span style={{fontSize:10,color:"#555"}}>{evN} events \u00b7 {sigN} signals \u00b7 {sec}s</span>
                <button style={{
                  background:verified?`linear-gradient(135deg, ${GOLD}, #e8c054)`:"rgba(255,255,255,0.05)",
                  border:"none",borderRadius:8,padding:"7px 20px",fontSize:12,fontWeight:600,
                  color:verified?"#0a0816":"#555",cursor:verified?"pointer":"default",transition:"all 0.3s",
                }}>{verified?`Cast as ${userName} \u2726`:"Verify to Cast"}</button>
              </div>
            </div>

            <div style={{
              display:"flex",alignItems:"center",gap:14,padding:"10px 14px",
              background:"rgba(212,168,67,0.03)",border:"1px solid rgba(212,168,67,0.06)",
              borderRadius:12,marginBottom:14,
            }}>
              <canvas ref={feedCvsRef} width={200} height={200}
                style={{width:56,height:56,borderRadius:8,border:"1px solid rgba(212,168,67,0.1)",flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,fontWeight:600,color:"#b8a080"}}>Your E-Identity</span>
                  <span style={{fontSize:16,fontWeight:700,color:confColor}}>{confidence}%</span>
                </div>
                <div style={{fontFamily:"'SF Mono',Menlo,monospace",fontSize:11,color:GOLD,letterSpacing:1.5,marginTop:3,opacity:0.8}}>{hash}</div>
                <div style={{fontSize:10,color:"#666",marginTop:2}}>
                  {identityState==="recognized"?`\u2726 ${userName} \u2014 I know you`:identityState==="new"?`\u2726 Welcome, ${userName}`:"Interact naturally to reveal your pattern"}
                </div>
              </div>
            </div>

            {POSTS.map(post=><Post key={post.id} post={post} onInteract={()=>{}}/>)}

            <div style={{textAlign:"center",padding:"30px 20px",color:"#555",fontSize:11,lineHeight:2,
              borderTop:"1px solid rgba(255,255,255,0.03)",marginTop:10}}>
              <p style={{marginBottom:8}}>Every scroll generates data. Your rhythm is a frequency.</p>
              <p style={{marginBottom:8}}>A bot produces uniform frequencies. A human produces a symphony.</p>
              <p>No name. No email. Just behavior. That is Human Proof.</p>
            </div>
          </div>
        )}

        {/* ═══ E-IDENTITY ═══ */}
        {tab==="identity"&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:12}}>
            <div style={{position:"relative",width:300,height:300,marginBottom:16}}>
              <div style={{
                width:300,height:300,borderRadius:14,
                border:`1px solid rgba(212,168,67,${verified?0.25:0.08})`,
                overflow:"hidden",position:"relative",
                boxShadow:verified?"0 0 30px rgba(74,222,128,0.08)":"none",transition:"all 1s",
              }}>
                <canvas ref={identityCvsRef} width={CVS_SIZE} height={CVS_SIZE}
                  style={{width:"100%",height:"100%",display:"block"}}/>
                {!verified&&(
                  <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,pointerEvents:"none",overflow:"hidden"}}>
                    <div style={{width:"100%",height:"40%",
                      background:"linear-gradient(transparent, rgba(212,168,67,0.04), transparent)",
                      animation:"scanline 3s linear infinite"}}/>
                  </div>
                )}
              </div>
              <div style={{position:"absolute",bottom:10,left:0,right:0,textAlign:"center"}}>
                <span style={{background:"rgba(10,8,22,0.88)",padding:"5px 14px",borderRadius:8,
                  fontSize:13,fontFamily:"'SF Mono',Menlo,monospace",color:GOLD,letterSpacing:2}}>{hash}</span>
              </div>
              {[{left:0,top:0,bT:true,bL:true},{right:0,top:0,bT:true,bR:true},
                {left:0,bottom:0,bB:true,bL:true},{right:0,bottom:0,bB:true,bR:true}].map((c,i)=>(
                <div key={i} style={{
                  position:"absolute",width:14,height:14,left:c.left,right:c.right,top:c.top,bottom:c.bottom,
                  borderTop:c.bT?"2px solid rgba(212,168,67,0.25)":"none",
                  borderBottom:c.bB?"2px solid rgba(212,168,67,0.25)":"none",
                  borderLeft:c.bL?"2px solid rgba(212,168,67,0.25)":"none",
                  borderRight:c.bR?"2px solid rgba(212,168,67,0.25)":"none",
                }}/>
              ))}
            </div>

            {verified&&identityState!=="scanning"&&(
              <div style={{
                animation:"verifiedPop 0.5s ease forwards",
                display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                padding:"10px 24px",borderRadius:20,marginBottom:16,
                background:identityState==="recognized"?"rgba(74,222,128,0.08)":"rgba(212,168,67,0.08)",
                border:`1px solid ${identityState==="recognized"?"rgba(74,222,128,0.2)":"rgba(212,168,67,0.2)"}`,
              }}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18}}>\u2726</span>
                  <span style={{fontSize:13,fontWeight:600,letterSpacing:0.5,
                    color:identityState==="recognized"?"#4ade80":GOLD}}>
                    {identityState==="recognized"?`HELLO ${userName.toUpperCase()} \u2014 I KNOW YOU`:`WELCOME ${userName.toUpperCase()}`}
                  </span>
                </div>
                {matchType==="cross-device"&&(
                  <span style={{fontSize:9,color:"#63b3ed",letterSpacing:1}}>RECOGNIZED ACROSS DEVICES \u00b7 {Math.round(matchScore*100)}% MATCH</span>
                )}
              </div>
            )}

            <div style={{display:"flex",justifyContent:"center",gap:24,marginBottom:20}}>
              {[{label:"Confidence",value:`${confidence}%`,color:confColor},
                {label:"Signals",value:sigN,color:GOLD},
                {label:"Events",value:evN,color:"#888"},
                {label:"Time",value:`${sec}s`,color:"#888"}].map((s,i)=>(
                <div key={i} style={{textAlign:"center"}}>
                  <div style={{fontSize:18,fontWeight:700,color:s.color,fontFamily:"monospace"}}>{s.value}</div>
                  <div style={{fontSize:9,color:"#777",letterSpacing:1,marginTop:2,textTransform:"uppercase"}}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{width:"100%",background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:14,padding:"16px 18px"}}>
              <div style={{fontSize:11,fontWeight:600,color:"#b8a080",letterSpacing:1,marginBottom:12,textTransform:"uppercase"}}>
                Live Signal Analysis
                <span style={{float:"right",fontWeight:400,color:"#666",fontSize:9,letterSpacing:0.5}}>
                  \u25cf CORE = device-independent \u00b7 \u25cb device = hardware-specific
                </span>
              </div>
              {sigEntries.length===0?(
                <div style={{fontSize:12,color:"#555",textAlign:"center",padding:"20px 0"}}>
                  <div style={{animation:"pulse 1.5s ease infinite",marginBottom:6}}>\u25c9</div>
                  Waiting for behavioral data...
                </div>
              ):(
                sigEntries.map(([key,val],i)=><SignalBar key={key} name={key} value={val} delay={i*40}/>)
              )}
            </div>

            <input type="text" placeholder="Type to shape your pattern..." style={{
              width:"100%",maxWidth:360,marginTop:16,
              background:"rgba(212,168,67,0.03)",border:"1px solid rgba(212,168,67,0.08)",
              borderRadius:10,color:"#b8a080",fontSize:14,fontFamily:"inherit",padding:"12px 16px",outline:"none",
            }}/>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{
        position:"fixed",bottom:0,left:0,right:0,
        background:"rgba(10,8,22,0.95)",backdropFilter:"blur(20px)",
        borderTop:"1px solid rgba(255,255,255,0.04)",
        padding:"10px 0",textAlign:"center",
        fontSize:9,color:"#5a5450",letterSpacing:1.5,
      }}>
        Human Proof by @sebklaey \u00b7 EDNA-1 Behavioral Kymatik \u00b7 {knownCount} known {knownCount===1?"identity":"identities"} (shared vault)
      </div>
    </div>
  );
}

// Detect device type for multi-device tracking
function detectDeviceType() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}
