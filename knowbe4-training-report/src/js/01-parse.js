const $ = id => document.getElementById(id);
const DAY = 86400000;

/* ================= lettura file ================= */
const COLS = {
  email:["email","emailaddress"], account:["account","accountname"], first:["firstname"], last:["lastname"],
  ppp:["currentppp","ppp"], risk:["riskscore"], groups:["groups","group"],
  camp:["campaignname","campaign"], campStatus:["campaignstatus"], content:["contentname","content","modulename"],
  ctype:["contenttype"], dur:["contentduration","duration"], status:["trainingstatus","status"], pd:["pastdue"],
  enrolledOn:["enrolledonutc","enrolledon"], startedOn:["startedonutc","startedon"], completedOn:["completedonutc","completedon"],
  time:["totaltimespent","timespent"], remain:["timeremaining"], score:["score"]
};
const norm = s => String(s==null?"":s).toLowerCase().replace(/[^a-z0-9]/g,"");

function parseDelimited(text){
  text = text.replace(/^﻿/,"");
  const first = text.split(/\r?\n/,1)[0];
  let delim="\t", best=-1;
  for(const d of ["\t",";",","]){ const c=first.split(d).length; if(c>best){best=c;delim=d;} }
  const rows=[]; let row=[], f="", q=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(q){ if(ch==='"'){ if(text[i+1]==='"'){f+='"';i++;} else q=false; } else f+=ch; }
    else if(ch==='"' && f===""){ q=true; }
    else if(ch===delim){ row.push(f); f=""; }
    else if(ch==="\n"){ row.push(f.replace(/\r$/,"")); rows.push(row); row=[]; f=""; }
    else f+=ch;
  }
  if(f!=="" || row.length){ row.push(f.replace(/\r$/,"")); rows.push(row); }
  return rows.filter(r=>r.some(c=>String(c).trim()!==""));
}
const pad=n=>String(n).padStart(2,"0");
async function readFile(file){
  if(/\.xlsx?$/i.test(file.name)){
    if(typeof XLSX==="undefined") throw new Error("Libreria Excel non disponibile: esporta in CSV e riprova.");
    const wb = XLSX.read(await file.arrayBuffer(), {type:"array"});
    if(wb.SheetNames.includes("Totale e tenant") || wb.SheetNames.includes("Registro formazione"))
      throw new Error("questo è il report Excel generato da questo strumento, non l'export di KnowBe4. Carica il file scaricato dalla console KnowBe4 (quello con le colonne Campaign Name, Content Name, Training Status…).");
    // il foglio con le intestazioni KnowBe4, in qualunque posizione; altrimenti il primo con dati
    const hasHead = n => { const w=wb.Sheets[n]; if(!w["!ref"]) return false; const r=XLSX.utils.sheet_to_json(w,{header:1,raw:true,defval:"",range:0}).slice(0,15); return r.some(row=>row.some(c=>["trainingstatus","contentname"].includes(norm(c)))); };
    const nm = wb.SheetNames.find(hasHead) || wb.SheetNames.find(n=>{const w=wb.Sheets[n]; return w["!ref"] && XLSX.utils.decode_range(w["!ref"]).e.r>0;}) || wb.SheetNames[0];
    const ws = wb.Sheets[nm];
    // date e orari: converto il valore numerico in testo non ambiguo (ISO / h:mm:ss)
    for(const addr in ws){
      if(addr[0]==="!") continue; const c=ws[addr];
      if(!c || c.t!=="n" || !c.z) continue;
      const z=String(c.z).replace(/\[[^\]]*\]/g,"").replace(/"[^"]*"/g,"");
      if(/[yd]/i.test(z)){ const d=XLSX.SSF.parse_date_code(c.v); if(d) ws[addr]={t:"s",v:`${d.y}-${pad(d.m)}-${pad(d.d)} ${pad(d.H)}:${pad(d.M)}:${pad(Math.floor(d.S))}`}; }
      else if(/[hs]/i.test(z)){ const sec=Math.round(c.v*86400); ws[addr]={t:"s",v:`${Math.floor(sec/3600)}:${pad(Math.floor(sec%3600/60))}:${pad(sec%60)}`}; }
    }
    return XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:""});
  }
  return parseDelimited(await file.text());
}

/* ================= conversione valori ================= */
function toNum(v){
  if(v==null) return null; if(typeof v==="number") return v;
  let s=String(v).trim().replace("%","").replace(/\s/g,""); if(s==="") return null;
  if(/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s=s.replace(/\./g,"").replace(",","."); else s=s.replace(",",".");
  const n=parseFloat(s); return isNaN(n)?null:n;
}
const PLAIN = {n:0};
function toSec(v){ // durate: h:mm:ss, "1h 5m 3s", "15 min", numero = minuti
  if(v==null) return 0;
  if(typeof v==="number"){ PLAIN.n++; return Math.round(v*60); }
  let s=String(v).trim(); if(!s || s==="-") return 0;
  const ap=s.match(/\s*([AaPp])\.?\s*[Mm]\.?$/);
  if(ap){ s=s.slice(0,ap.index).trim(); const hh=s.match(/^(\d+)/); if(hh){ let h=+hh[1]%12; if(/[Pp]/.test(ap[1])) h+=12; s=h+s.slice(hh[1].length);} }
  let m=s.match(/^(?:(\d+)[.\s])?(\d+):(\d{1,2})(?::(\d{1,2}))?(?:\.\d+)?$/);
  if(m){ const d=+(m[1]||0),a=+m[2],b=+m[3],c=m[4]!=null?+m[4]:null; return c==null? d*86400+a*60+b : d*86400+a*3600+b*60+c; }
  if(/[a-z]/i.test(s)){
    const g=(re)=>{const x=s.match(re); return x?parseFloat(x[1].replace(",",".")):0;};
    const sec=g(/(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hour|hours|ore|ora)\b/i)*3600 + g(/(\d+(?:[.,]\d+)?)\s*(?:m|min|mins|minute|minutes|minuti)\b/i)*60 + g(/(\d+(?:[.,]\d+)?)\s*(?:s|sec|secs|second|seconds|secondi)\b/i);
    if(sec) return Math.round(sec);
  }
  const n=toNum(s); if(n==null) return 0; PLAIN.n++; return Math.round(n*60);
}
function fmtDur(sec){ if(!sec) return "0 min"; const h=Math.floor(sec/3600), m=Math.round((sec%3600)/60); return h?`${h} h ${pad(m)} min`:`${m} min`; }

// date: ISO, gg/mm/aaaa o mm/gg/aaaa (rilevato sull'intero file), con ora e AM/PM facoltativi
let DATE_ORDER="mdy", DATE_INFO="";
function detectDateOrder(samples){
  let a=0,b=0,n=0;
  for(const s of samples){ const m=String(s).match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/); if(!m) continue; n++; if(+m[1]>12) a++; if(+m[2]>12) b++; }
  if(!n) return {order:"mdy",info:"date in formato ISO (aaaa-mm-gg)"};
  if(a&&!b) return {order:"dmy",info:"date lette come gg/mm/aaaa (rilevato dai valori)"};
  if(b&&!a) return {order:"mdy",info:"date lette come mm/gg/aaaa (rilevato dai valori)"};
  return {order:"mdy",info:"formato date ambiguo: assunto mm/gg/aaaa (standard KnowBe4); cambialo nelle impostazioni se serve"};
}
function parseDate(v){
  if(v==null||v==="") return null;
  if(v instanceof Date) return isNaN(v)?null:v.getTime();
  if(typeof v==="number") return Math.round((v-25569)*DAY);
  const s=String(v).trim(); if(!s||s==="-") return null;
  let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if(m) return Date.UTC(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0),+(m[6]||0));
  m=s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?)?/);
  if(m){ let [d,mo]= DATE_ORDER==="dmy"?[+m[1],+m[2]]:[+m[2],+m[1]]; let y=+m[3]; if(y<100) y+=2000;
    let h=+(m[4]||0); if(m[7]){ h=h%12; if(/p/i.test(m[7])) h+=12; }
    if(mo<1||mo>12||d<1||d>31) return null;
    return Date.UTC(y,mo-1,d,h,+(m[5]||0),+(m[6]||0)); }
  const t=Date.parse(s); return isNaN(t)?null:t;
}
const fmtD = t => { if(t==null) return ""; const d=new Date(t); return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth()+1)}/${d.getUTCFullYear()}`; };
const isoInput = s => s ? Date.UTC(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10)) : null;

function parseBool(v){ const s=norm(v); return ["yes","true","1","si","y","x","pastdue","overdue"].includes(s); }
function classify(raw, hasCompletedOn, hasStartedOn){
  const t=String(raw||"").toLowerCase().trim();
  if(/fail|non superat|bocciat/.test(t)) return {st:"failed",known:true};
  if(/not ?started|non iniziat|not ?begun/.test(t)) return {st:"notstarted",known:true};
  if(/incomplet|not ?complet|non complet/.test(t)) return {st: hasStartedOn?"progress":"notstarted",known:true};
  if(/pass|complet|superat|finished|done/.test(t)) return {st:"completed",known:true};
  if(/progress|in corso|started|avviat|iniziat/.test(t)) return {st:"progress",known:true};
  if(/enrolled|assigned|assegnat|iscritt/.test(t)) return {st:"notstarted",known:true};
  // stato sconosciuto o "past due": deduco dalle date
  return {st: hasCompletedOn?"completed": hasStartedOn?"progress":"notstarted", known: /past ?due|overdue|scadut/.test(t)};
}

function parseRows(rows){
  if(!rows.length) throw new Error("Il file è vuoto.");
  const hi = rows.findIndex(r=>r.some(c=>["trainingstatus","contentname"].includes(norm(c))));
  if(hi<0) throw new Error('Non trovo le colonne "Training Status" e "Content Name": è l\'export dettagliato delle attività di formazione?');
  const head=rows[hi].map(norm), idx={};
  for(const k in COLS) idx[k]=head.findIndex(h=>COLS[k].includes(h));
  const miss=["status","content"].filter(k=>idx[k]<0);
  if(miss.length) throw new Error("Colonne obbligatorie mancanti: "+miss.map(k=>({status:"Training Status",content:"Content Name"}[k])).join(", "));
  const g=(r,k)=> idx[k]<0?null:r[idx[k]];
  const s=(r,k)=>{const v=g(r,k); return v==null?"":String(v).trim();};
  const body=rows.slice(hi+1).filter(r=>r.some(c=>String(c).trim()!==""));
  // formato date
  const fmt=$("dateFmt").value;
  const samp=[]; body.slice(0,4000).forEach(r=>["enrolledOn","startedOn","completedOn"].forEach(k=>{const v=g(r,k); if(v) samp.push(v);}));
  const det=detectDateOrder(samp);
  if(fmt==="auto"){ DATE_ORDER=det.order; DATE_INFO=det.info; } else { DATE_ORDER=fmt; DATE_INFO=`date lette come ${fmt==="dmy"?"gg/mm/aaaa":"mm/gg/aaaa"} (impostato manualmente)`; }
  // separatore gruppi
  const gs=body.map(r=>s(r,"groups")).filter(Boolean);
  const gsep = gs.some(x=>x.includes(";")) ? ";" : gs.some(x=>x.includes("|")) ? "|" : ",";
  PLAIN.n=0;
  const out=body.map((r,i)=>{
    const comp=parseDate(g(r,"completedOn")), start=parseDate(g(r,"startedOn")), enr=parseDate(g(r,"enrolledOn"));
    const rawSt=s(r,"status"), cl=classify(rawSt, comp!=null, start!=null);
    const email=s(r,"email").toLowerCase(), first=s(r,"first"), last=s(r,"last"), acct=s(r,"account");
    const scoreV=toNum(g(r,"score"));
    return {i, acct, email, first, last, ppp:idx.ppp<0?null:toNum(g(r,"ppp")), risk:idx.risk<0?null:toNum(g(r,"risk")),
      groups: s(r,"groups").split(gsep).map(x=>x.trim()).filter(Boolean),
      camp:s(r,"camp")||"(senza campagna)", campStatus:s(r,"campStatus"), content:s(r,"content")||"(senza contenuto)", ctype:s(r,"ctype"),
      dur:toSec(g(r,"dur")), rawSt, st:cl.st, known:cl.known, rawPd:s(r,"pd"), pd:parseBool(g(r,"pd")),
      enr, start, comp, time:toSec(g(r,"time")), score:scoreV,
      uid: acct+"|"+(email || (first+" "+last).trim().toLowerCase() || ("riga"+i)),
      dup:"" };
  });
  const notFound=Object.keys(COLS).filter(k=>idx[k]<0);
  return {rows:out, notFound, gsep, plain:PLAIN.n, hasEmail: idx.email>=0 && out.some(r=>r.email)};
}
/* ================= stato ================= */
let DATA=null, isSample=true;
const EXCL=new Set();

/* ================= filtri, deduplica, utenti ================= */
const RANK={completed:3,failed:2,progress:2,notstarted:1};
function pipeline(){
  const all=DATA.rows; all.forEach(r=>r.dup="");
  const acct="";
  const pf=isoInput($("pFrom").value), pt=isoInput($("pTo").value);
  const info={byAcct:0,byCamp:0,byPeriod:0,noDate:0,exact:0,cross:0};
  const FR=[];
  for(const r of all){
    if(acct && r.acct!==acct){ info.byAcct++; continue; }
    if(EXCL.has(campKey(r))){ info.byCamp++; continue; }
    if(pf!=null||pt!=null){
      if(r.enr==null){ info.noDate++; info.byPeriod++; continue; }
      if((pf!=null && r.enr<pf) || (pt!=null && r.enr>=pt+DAY)){ info.byPeriod++; continue; }
    }
    FR.push(r);
  }
  // duplicati esatti
  const seen=new Map(), D1=[];
  for(const r of FR){ const k=[r.uid,r.camp,r.content,r.rawSt,r.enr,r.start,r.comp].join("§");
    if(seen.has(k)){ r.dup="riga identica"; info.exact++; } else { seen.set(k,r); D1.push(r); } }
  // stesso modulo in più campagne
  let DR=D1;
  if($("dedup").checked){
    const best=new Map();
    for(const r of D1){ const k=r.uid+"§"+r.content.toLowerCase(); const b=best.get(k);
      if(!b){ best.set(k,r); continue; }
      const better = RANK[r.st]>RANK[b.st] || (RANK[r.st]===RANK[b.st] && ((r.st==="completed" ? (r.comp||0)<(b.comp||0) : (r.enr||0)>(b.enr||0))));
      if(better){ b.dup="modulo ripetuto in "+r.camp; best.set(k,r); } else { r.dup="modulo ripetuto in "+b.camp; }
    }
    DR=[...best.values()]; info.cross=D1.length-DR.length;
  }
  return {FR,DR,info};
}
const multiAcct = rows => new Set(rows.map(r=>r.acct)).size>1;
const campKey = r => r.acct+"§"+r.camp;

function buildUsers(DR){
  const ma=multiAcct(DR), map=new Map();
  for(const r of DR){
    let u=map.get(r.uid);
    if(!u){ u={uid:r.uid,email:r.email,first:r.first,last:r.last,acct:r.acct,groups:new Set(),graw:new Set(),ppp:null,risk:null,
      enrolled:0,completed:0,completedPD:0,inProgress:0,inProgressPD:0,notStarted:0,notStartedPD:0,failed:0,time:0,timeCompleted:0,
      overdueItems:[],firstEnr:null,lastComp:null,dSum:0,dN:0,sSum:0,sN:0}; map.set(r.uid,u); }
    r.groups.forEach(g=>{ u.graw.add(g); u.groups.add(ma? `${r.acct||"?"} · ${g}` : g); });
    if(r.ppp!=null) u.ppp=r.ppp; if(r.risk!=null) u.risk=r.risk;
    u.enrolled++; u.time+=r.time;
    if(r.enr!=null && (u.firstEnr==null||r.enr<u.firstEnr)) u.firstEnr=r.enr;
    if(r.score!=null && (r.st==="completed"||r.st==="failed")){ u.sSum+=r.score; u.sN++; }
    if(r.st==="completed"){ u.completed++; u.timeCompleted+=r.time; if(r.enr!=null&&r.comp!=null){ u.dSum+=Math.max(0,(r.comp-r.enr)/DAY); u.dN++; } if(r.pd) u.completedPD++; if(r.comp!=null&&(u.lastComp==null||r.comp>u.lastComp)) u.lastComp=r.comp; }
    else if(r.st==="progress"||r.st==="failed"){ u.inProgress++; if(r.st==="failed") u.failed++; if(r.pd){u.inProgressPD++; u.overdueItems.push(r);} }
    else { u.notStarted++; if(r.pd){u.notStartedPD++; u.overdueItems.push(r);} }
  }
  return [...map.values()].map(u=>({...u,groups:[...u.groups],graw:[...u.graw]}));
}

/* ================= aggregazione ================= */
function statusOf(u){
  if(u.enrolled<=0) return {k:"none",l:"Non iscritto",c:"neutral"};
  if(u.completed>=u.enrolled) return u.completedPD>0 ? {k:"late-done",l:"Completo (in ritardo)",c:"ok"} : {k:"done",l:"Completo",c:"ok"};
  if(u.inProgressPD+u.notStartedPD>0) return {k:"overdue",l:"Scaduto",c:"bad"};
  if(u.inProgress>0||u.completed>0) return {k:"progress",l:"In regola · in corso",c:"neutral"};
  return {k:"todo",l:"In regola · da iniziare",c:"neutral"};
}
function agg(list){
  const a={users:list.length,enrolledUsers:0,enr:0,comp:0,compPD:0,ip:0,ipPD:0,ns:0,nsPD:0,failed:0,time:0,timeC:0,
    pppSum:0,pppN:0,riskSum:0,riskN:0,fully:0,inOk:0,withOverdue:0,neverStarted:0};
  for(const u of list){
    a.enr+=u.enrolled; a.comp+=u.completed; a.compPD+=u.completedPD; a.ip+=u.inProgress; a.ipPD+=u.inProgressPD;
    a.ns+=u.notStarted; a.nsPD+=u.notStartedPD; a.failed+=u.failed; a.time+=u.time; a.timeC+=u.timeCompleted;
    if(u.ppp!=null){a.pppSum+=u.ppp;a.pppN++;} if(u.risk!=null){a.riskSum+=u.risk;a.riskN++;}
    if(u.enrolled>0){ a.enrolledUsers++;
      if(u.completed>=u.enrolled) a.fully++;
      if(u.inProgressPD+u.notStartedPD>0) a.withOverdue++; else a.inOk++;
      if(u.completed===0&&u.inProgress===0) a.neverStarted++; }
  }
  a.compRate=a.enr?a.comp/a.enr:null; a.onTimeRate=a.enr?(a.comp-a.compPD)/a.enr:null;
  a.overdueOpen=a.ipPD+a.nsPD; a.fullyRate=a.enrolledUsers?a.fully/a.enrolledUsers:null; a.okRate=a.enrolledUsers?a.inOk/a.enrolledUsers:null;
  a.ppp=a.pppN?a.pppSum/a.pppN:null; a.risk=a.riskN?a.riskSum/a.riskN:null; a.avgPerCourse=a.comp?a.timeC/a.comp:null;
  return a;
}
const DIM={groups:{label:"Gruppi KnowBe4",col:"Gruppo",one:"Gruppo",empty:"(nessun gruppo)"},
           acct:{label:"Azienda (Account)",col:"Azienda",one:"Azienda",empty:"(senza account)"}};
function availKeys(users){ const k=[]; if(new Set(users.map(u=>u.acct)).size>1) k.push("acct"); if(users.some(u=>u.groups.length)) k.push("groups"); return k; }
function groupBy(users,key){
  const m=new Map(), add=(k,u)=>{ if(!m.has(k)) m.set(k,[]); m.get(k).push(u); };
  users.forEach(u=>{ if(key==="groups"){ if(u.groups.length) u.groups.forEach(g=>add(g,u)); else add(DIM.groups.empty,u); } else add(u.acct||DIM.acct.empty,u); });
  return [...m.entries()].map(([name,list])=>({name,list,a:agg(list)}));
}
const shortName=u=>{ const f=u.first||"", l=u.last||""; return f||l ? `${f} ${l?l[0]+".":""}`.trim() : (u.email?u.email.split("@")[0].slice(0,2)+"…":"(anonimo)"); };
const fullName=u=>(u.first+" "+u.last).trim();
const who=u=>fullName(u)||u.email||"(anonimo)";
/* ================= formattazione ================= */
const pct=(x,d=0)=>x==null?"–":(x*100).toLocaleString("it-IT",{minimumFractionDigits:d,maximumFractionDigits:d})+"%";
const int=x=>x==null?"–":Math.round(x).toLocaleString("it-IT");
const dec=(x,d=1)=>x==null?"–":x.toLocaleString("it-IT",{minimumFractionDigits:d,maximumFractionDigits:d});
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmtIn=s=>{ if(!s) return "data non indicata"; const [y,m,d]=s.split("-"); return `${d}/${m}/${y}`; };
const target=()=>Math.min(100,Math.max(1,+$("target").value||90))/100;
function rag(r){ const t=target(); if(r==null) return "neutral"; if(r>=t) return "ok"; if(r>=t-.15) return "warn"; return "bad"; }
const ragLabel=c=>({ok:"In linea",warn:"Da presidiare",bad:"Critico",neutral:"Nessun dato"}[c]);
const pppCls=p=>p==null?"neutral":p<=10?"ok":p<=20?"warn":"bad";
const STL={completed:"Completato",progress:"In corso",failed:"Non superato",notstarted:"Non iniziato"};
function matcher(q){ const t=String(q||"").toLowerCase().split(",").map(x=>x.trim()).filter(Boolean); return t.length ? (txt=>{const s=String(txt).toLowerCase(); return t.some(x=>s.includes(x));}) : null; }
function syncCampaigns(){
  const acct="", m=new Map();
  DATA.rows.forEach(r=>{ if(acct && r.acct!==acct) return; const k=campKey(r); if(!m.has(k)) m.set(k,{k,name:r.camp,acct:r.acct,status:r.campStatus,n:0}); m.get(k).n++; });
  const ma=new Set([...m.values()].map(c=>c.acct)).size>1;
  const list=[...m.values()].sort((a,b)=>a.acct.localeCompare(b.acct)||a.name.localeCompare(b.name));
  const mt=matcher($("cSearch").value);
  const shown=mt?list.filter(c=>mt(c.name+" "+c.status+" "+c.acct)):list;
  const inc=list.filter(c=>!EXCL.has(c.k)).length;
  $("cCount").textContent=`(${inc} di ${list.length}${mt?` · trovate ${shown.length}`:""})`;
  $("campList").innerHTML = shown.map((c,i)=>`<label><input type="checkbox" data-k="${esc(c.k)}" ${EXCL.has(c.k)?"":"checked"}><span>${ma?`<span class="muted">${esc(c.acct)} · </span>`:""}${esc(c.name)}${c.status?` <span class="muted">(${esc(c.status)})</span>`:""}</span><span class="c">${int(c.n)}</span></label>`).join("") || `<span class="small muted">${mt?"Nessuna campagna trovata":"Nessuna campagna"}</span>`;
}