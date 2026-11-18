/* ================= organi di gestione ================= */
const MG=new Set();
const MG_SUGGEST=["direzione","direttiv","dirigent","cda","c.d.a","consiglio","amministrazione delegat","board","management","manager","executive","c-level","clevel","leadership","vertici"];
function syncMgGroups(){
  const m=new Map();
  DATA.rows.forEach(r=>r.groups.forEach(g=>{ if(!m.has(g)) m.set(g,new Set()); m.get(g).add(r.uid); }));
  const all=[...m.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  const mt=matcher($("gSearch").value), list=mt?all.filter(([g])=>mt(g)):all;
  $("gCount").textContent=`(${(n=>n===1?"1 gruppo selezionato":n+" gruppi selezionati")(all.filter(([g])=>MG.has(g)).length)}${mt?` · trovati ${list.length}`:""})`;
  $("mgList").innerHTML=list.map(([g,s])=>`<label><input type="checkbox" data-g="${esc(g)}" ${MG.has(g)?"checked":""}><span>${esc(g)}</span><span class="c">${int(s.size)}</span></label>`).join("")||`<span class="small muted">${mt?"Nessun gruppo trovato":"Nessun gruppo nel file"}</span>`;
}
function isMgmt(u,board){ return u.graw.some(g=>MG.has(g)) || (u.email && board.has(u.email)); }

/* ================= punteggio individuale ================= */
/* 0–100: 45 corsi completati, 25 completati in tempo, 15 rapidità, 15 media test (pesi assenti ridistribuiti) */
const W_TOP={comp:45,ontime:25,speed:15,quiz:15};
function userScore(u){
  if(!u.enrolled||!u.completed) return null;
  const parts={comp:u.completed/u.enrolled, ontime:(u.completed-u.completedPD)/u.enrolled};
  if(u.dN){ const d=u.dSum/u.dN; parts.speed=Math.max(0,Math.min(1,(30-d)/28)); u.avgDays=d; } else u.avgDays=null;
  if(u.sN){ u.avgScore=u.sSum/u.sN; parts.quiz=Math.max(0,Math.min(1,u.avgScore/100)); } else u.avgScore=null;
  let s=0,w=0; for(const k in parts){ s+=W_TOP[k]*parts[k]; w+=W_TOP[k]; }
  return Math.round(s/w*1000)/10;
}
const RULE="Punteggio 0–100: 45% corsi completati, 25% completati entro la scadenza, 15% rapidità (giorni medi dall'assegnazione al completamento: 2 o meno = pieno, 30 o più = zero), 15% media dei test. Se un dato manca il suo peso si ridistribuisce. A parità: più corsi completati, poi più rapido. Entra in classifica chi ha completato almeno un corso.";
function rankUsers(list){
  return list.map(u=>({u,s:userScore(u)})).filter(x=>x.s!=null)
    .sort((a,b)=>b.s-a.s || b.u.completed-a.u.completed || (a.u.avgDays??999)-(b.u.avgDays??999) || (a.u.lastComp??0)-(b.u.lastComp??0));
}
const tenantName=a=>a||"(senza tenant)";
const nameOf=u=> $("topFull").checked ? (fullName(u)||u.email||"(anonimo)") : shortName(u);

/* ================= render ================= */
function render(){
  if(!DATA) return;
  const {FR,DR,info}=pipeline();
  const users=buildUsers(DR);
  const T=agg(users);
  const tenants=[...new Set(users.map(u=>u.acct))].sort((a,b)=>a.localeCompare(b));
  const board=new Set($("board").value.split(/[\s,;]+/).map(s=>s.trim().toLowerCase()).filter(Boolean));
  const mgmt=users.filter(u=>isMgmt(u,board)), M=agg(mgmt);
  const DC=new Map(); DR.forEach(r=>{ if(!DC.has(r.acct)) DC.set(r.acct,new Set()); DC.get(r.acct).add(r.content.toLowerCase()); });
  const dcAll=new Set(DR.map(r=>r.content.toLowerCase())).size;
  const perUser=a=>a.enrolledUsers?a.enr/a.enrolledUsers:null;
  const per=($("pFrom").value||$("pTo").value)?`assegnazioni ${$("pFrom").value?"dal "+fmtIn($("pFrom").value):""} ${$("pTo").value?"al "+fmtIn($("pTo").value):""}`.replace(/\s+/g," ").trim():"tutto il periodo";
  const campIn=new Set(FR.map(campKey)).size;
  $("asOf").textContent=`situazione al ${fmtIn($("dCur").value)} · ${per} · ${campIn} campagne · ${tenants.length} tenant`;

  // totale gruppo
  const k=(lab,val,det,cls)=>`<div class="kpi ${cls}"><span class="lab">${lab}</span><span class="val">${val}</span><span class="det">${det}</span></div>`;
  $("kpis").innerHTML=
    k("Completamento formazione",pct(T.compRate,1),`${int(T.comp)} completati su ${int(T.enr)} assegnazioni (${int(T.enrolledUsers)} utenti × ${dec(perUser(T),1)} corsi in media)`,rag(T.compRate))+
    k("Utenti con formazione completa",pct(T.fullyRate,1),`${int(T.fully)} su ${int(T.enrolledUsers)} utenti`,rag(T.fullyRate))+
    k("Completati in tempo",pct(T.onTimeRate,1),`${int(T.compPD)} corsi completati dopo la scadenza`,"neutral")+
    k("Utenti in regola",pct(T.okRate,1),`${int(T.inOk)} su ${int(T.enrolledUsers)} senza corsi scaduti · ${int(T.withOverdue)} in ritardo`,rag(T.okRate))+
    k("Organi di gestione",mgmt.length?pct(M.compRate,1):"–",mgmt.length?`completamento · ${int(M.fully)} su ${int(mgmt.length)} con formazione completa`:"seleziona i gruppi nelle impostazioni",mgmt.length?rag(M.compRate):"neutral")+
    k("Phish-prone % medio",T.ppp==null?"–":dec(T.ppp)+"%",`su ${int(T.pppN)} utenti · ${int(users.filter(u=>u.ppp>0).length)} con PPP > 0`,pppCls(T.ppp))+
    k("Corsi distinti",int(dcAll),`${dec(perUser(T),1)} corsi assegnati in media a ogni utente`,"neutral")+
    k("Tenant e utenti",`${int(tenants.length)} · ${int(T.users)}`,`tenant · utenti con corsi assegnati`,"neutral")+
    k("Ore di formazione",dec(T.time/3600,1),`${T.avgPerCourse?fmtDur(T.avgPerCourse):"–"} medi per corso completato`,"neutral");

  // per tenant
  const tg=tenants.map(t=>{ const l=users.filter(u=>u.acct===t), ml=l.filter(u=>isMgmt(u,board)); return {name:t,list:l,a:agg(l),ml,ma:agg(ml)}; }).sort((a,b)=>(b.a.compRate??-1)-(a.a.compRate??-1));
  const row=(name,a,mA,mN,cls="",dc=0)=>`<tr class="${cls}"><td>${esc(name)}</td><td class="n">${int(a.enrolledUsers)}</td><td class="n">${int(dc)}</td><td class="n">${dec(perUser(a),1)}</td><td class="n">${int(a.enr)}</td><td class="n">${int(a.comp)}</td>
    <td><div class="cell-bar"><div class="bar" aria-hidden="true"><i style="width:${(a.compRate||0)*100}%"></i></div><span class="num">${pct(a.compRate,1)}</span></div></td>
    <td class="n">${int(a.fully)} (${pct(a.fullyRate)})</td><td class="n">${int(a.ip)}</td><td class="n">${int(a.ns)}</td><td class="n">${pct(a.okRate)} <span class="muted">(${int(a.withOverdue)} in ritardo)</span></td><td class="n">${pct(a.onTimeRate)}</td><td class="n">${mN?`${pct(mA.compRate)} <span class="muted">(${int(mN)})</span>`:"–"}</td><td class="n">${a.ppp==null?"–":dec(a.ppp)+"%"}</td><td class="n">${dec(a.time/3600,1)}</td>
    <td>${cls?"":`<span class="pill ${rag(a.compRate)}">${ragLabel(rag(a.compRate))}</span>`}</td></tr>`;
  $("tblTenants").innerHTML=`<thead><tr><th>Tenant</th><th class="n">Utenti</th><th class="n">Corsi distinti</th><th class="n" title="Media dei corsi assegnati a ciascun utente">Corsi per utente</th><th class="n" title="Somma su tutti gli utenti: 1 = un corso assegnato a un utente">Assegnazioni</th><th class="n">Completati</th><th>Completamento</th><th class="n">Formazione completa</th><th class="n">In corso</th><th class="n">Non iniziati</th><th class="n" title="Utenti senza corsi scaduti non completati">Utenti in regola</th><th class="n">In tempo</th><th class="n">Organi di gestione</th><th class="n">PPP medio</th><th class="n">Ore</th><th>Stato</th></tr></thead><tbody>${
    tg.map(g=>row(tenantName(g.name),g.a,g.ma,g.ml.length,"",(DC.get(g.name)||new Set()).size)).join("")}${tg.length>1?row("Totale gruppo",T,M,mgmt.length,"total",dcAll):""}</tbody>`;

  const PLAN=renderPlan(DR,tenants);

  // organi di gestione
  $("mgSub").textContent = mgmt.length ? `${int(mgmt.length)} persone · gruppi: ${[...MG].join(", ")||"nessuno"}${board.size?` · più ${board.size} email`:""}` : "";
  const mrow=(name,a,n,cls="")=>`<tr class="${cls}"><td>${esc(name)}</td><td class="n">${int(n)}</td><td class="n">${int(a.enr)}</td><td class="n">${int(a.comp)}</td>
    <td><div class="cell-bar"><div class="bar" aria-hidden="true"><i style="width:${(a.compRate||0)*100}%"></i></div><span class="num">${pct(a.compRate,1)}</span></div></td>
    <td class="n">${int(a.fully)} (${pct(a.fullyRate)})</td><td class="n">${pct(a.okRate)}</td><td class="n">${int(a.withOverdue)}</td><td class="n">${a.ppp==null?"–":dec(a.ppp)+"%"}</td><td>${cls||!n?"":`<span class="pill ${rag(a.compRate)}">${ragLabel(rag(a.compRate))}</span>`}</td></tr>`;
  $("tblMgT").innerHTML = mgmt.length ? `<thead><tr><th>Tenant</th><th class="n">Persone</th><th class="n" title="Somma su tutte le persone: 1 = un corso assegnato a una persona">Assegnazioni</th><th class="n">Completati</th><th>Completamento</th><th class="n">Formazione completa</th><th class="n" title="Persone senza corsi scaduti non completati">In regola</th><th class="n">Persone in ritardo</th><th class="n">PPP medio</th><th>Stato</th></tr></thead><tbody>${
    tg.map(g=>mrow(tenantName(g.name),g.ma,g.ml.length)).join("")}${tg.length>1?mrow("Totale gruppo",M,mgmt.length,"total"):""}</tbody>`
    : `<tbody><tr><td class="muted" style="white-space:normal">Nessun organo di gestione selezionato: spunta i gruppi nelle impostazioni (o usa "Suggerisci") oppure indica le email.</td></tr></tbody>`;
  $("mgCount").textContent=int(mgmt.length);
  $("tblMg").innerHTML=`<thead><tr><th>Tenant</th><th>Persona</th><th>Email</th><th>Gruppi</th><th>Stato</th><th class="n">Completati</th><th class="n">Corsi scaduti</th><th>Ultimo completamento</th><th class="n">PPP</th></tr></thead><tbody>${
    [...mgmt].sort((a,b)=>a.acct.localeCompare(b.acct)||fullName(a).localeCompare(fullName(b))).map(u=>{const st=statusOf(u); return `<tr><td>${esc(tenantName(u.acct))}</td><td>${esc(fullName(u))}</td><td class="small">${esc(u.email)}</td><td class="small">${esc(u.graw.join(", "))}</td><td><span class="pill ${st.c}">${st.l}</span></td><td class="n">${u.completed}/${u.enrolled}</td><td class="n">${u.inProgressPD+u.notStartedPD}</td><td>${fmtD(u.lastComp)}</td><td class="n">${u.ppp==null?"–":dec(u.ppp)}</td></tr>`;}).join("")}</tbody>`;

  // top generale
  const N=Math.max(3,Math.min(50,+$("topN").value||10)), NT=Math.max(1,Math.min(50,+$("topNT").value||5));
  const all=rankUsers(users), top=all.slice(0,N);
  const badges=u=>{const b=[];
    if(u.completed>=u.enrolled) b.push(`<span class="pill ok">Formazione completa</span>`);
    if(u.completed>=u.enrolled&&!u.completedPD) b.push(`<span class="pill ok">Sempre puntuale</span>`);
    if(u.avgDays!=null&&u.avgDays<=2) b.push(`<span class="pill neutral">Fulmine</span>`);
    if(u.ppp===0) b.push(`<span class="pill ok">Scudo phishing</span>`);
    return `<div class="badges">${b.join("")}</div>`;};
  $("topTitle").textContent=`Top ${N} del gruppo`;
  $("topSub").textContent=`${int(all.length)} utenti in classifica su ${int(users.length)}`;
  $("tblTop").innerHTML=`<thead><tr><th>#</th><th>Utente</th><th>Tenant</th><th class="n">Punteggio</th><th class="n">Completati</th><th class="n">In tempo</th><th class="n">Giorni medi</th><th class="n">Media test</th><th class="n">PPP</th><th>Badge</th></tr></thead><tbody>${
    top.map((x,i)=>{const u=x.u; return `<tr><td><span class="rank">${i+1}</span></td><td>${esc(nameOf(u))}</td><td>${esc(tenantName(u.acct))}</td><td class="n"><strong>${dec(x.s,1)}</strong></td><td class="n">${u.completed}/${u.enrolled}</td><td class="n">${pct((u.completed-u.completedPD)/u.enrolled)}</td><td class="n">${u.avgDays==null?"–":dec(u.avgDays,1)}</td><td class="n">${u.avgScore==null?"–":dec(u.avgScore,0)}</td><td class="n">${u.ppp==null?"–":dec(u.ppp)}</td><td>${badges(u)}</td></tr>`;}).join("")||`<tr><td colspan="10" class="muted">Nessun utente con corsi completati.</td></tr>`}</tbody>`;
  $("rule").textContent=RULE;

  // top per tenant
  const perT=tg.map(g=>({name:g.name,a:g.a,rk:rankUsers(g.list),n:g.list.length}));
  $("topTenantTitle").textContent=`Top ${NT} per tenant`;
  $("tenantTops").innerHTML=perT.map(t=>`<div class="card tcard"><div class="th"><h3>${esc(tenantName(t.name))}</h3><span class="small muted">completamento ${pct(t.a.compRate,1)} · ${int(t.rk.length)} in classifica su ${int(t.n)}</span></div>
    <div style="overflow-x:auto"><table><thead><tr><th>#</th><th>Utente</th><th class="n">Punteggio</th><th class="n">Completati</th><th class="n">In tempo</th><th class="n">Giorni medi</th><th class="n">PPP</th></tr></thead><tbody>${
      t.rk.slice(0,NT).map((x,i)=>`<tr><td><span class="rank">${i+1}</span></td><td>${esc(nameOf(x.u))}</td><td class="n"><strong>${dec(x.s,1)}</strong></td><td class="n">${x.u.completed}/${x.u.enrolled}</td><td class="n">${pct((x.u.completed-x.u.completedPD)/x.u.enrolled)}</td><td class="n">${x.u.avgDays==null?"–":dec(x.u.avgDays,1)}</td><td class="n">${x.u.ppp==null?"–":dec(x.u.ppp)}</td></tr>`).join("")||`<tr><td colspan="7" class="muted">Nessun utente con corsi completati.</td></tr>`}</tbody></table></div></div>`).join("");

  // utenti
  $("userCount").textContent=int(users.length);
  const order={overdue:0,todo:1,progress:2,"late-done":3,done:4,none:5};
  const us=users.map(u=>({u,st:statusOf(u)})).sort((a,b)=>a.u.acct.localeCompare(b.u.acct)||order[a.st.k]-order[b.st.k]);
  $("tblUsers").innerHTML=`<thead><tr><th>Tenant</th><th>Utente</th><th>Email</th><th>Gruppi</th><th>Stato</th><th class="n">Assegnati</th><th class="n">Completati</th><th class="n">Corsi scaduti</th><th>Ultimo completamento</th></tr></thead><tbody>${
    us.map(({u,st})=>`<tr><td>${esc(tenantName(u.acct))}</td><td>${esc(fullName(u))}</td><td class="small">${esc(u.email)}</td><td class="small">${esc(u.graw.join(", "))}</td><td><span class="pill ${st.c}">${st.l}</span></td><td class="n">${u.enrolled}</td><td class="n">${u.completed}</td><td class="n">${u.inProgressPD+u.notStartedPD}</td><td>${fmtD(u.lastComp)}</td></tr>`).join("")}</tbody>`;

  /*__QUALITY__*/

  $("status").innerHTML= isSample
    ? `<div class="banner sample"><strong>Dati di esempio</strong>: 2 tenant e 70 utenti fittizi. Carica il tuo export per sostituirli.</div>`
    : `<div class="banner">Caricato <strong>${esc(DATA.name)}</strong>: ${int(DATA.rows.length)} righe, ${int(new Set(DATA.rows.map(r=>r.uid)).size)} utenti, ${int(new Set(DATA.rows.map(r=>r.acct)).size)} tenant.</div>`;

  window.__R={FR,DR,users,T,tg,all,top,perT,N,NT,per,campIn,mgmt,M,DC,dcAll,perUser,PLAN,tenants};
}

/* ================= export Excel ================= */
$("btnXlsx").addEventListener("click",async()=>{
  const btn=$("btnXlsx"); btn.disabled=true; const old=btn.textContent; btn.textContent="Preparo il report…";
  try{
    const buf=await buildStyledWorkbook();
    const url=URL.createObjectURL(new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));
    const a=document.createElement("a"); a.href=url; a.download=`KnowBe4_completamento_${$("dCur").value||"senza-data"}.xlsx`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),4000);
    toast("Report Excel generato");
  }catch(e){ toast("Generazione non riuscita: "+(e&&e.message||e)); }
  finally{ btn.disabled=false; btn.textContent=old; }
});
$("btnCopy").addEventListener("click",async()=>{
  const X=window.__R, T=X.T;
  const lines=[`Completamento formazione – situazione al ${fmtIn($("dCur").value)} (${X.per}, ${X.campIn} campagne)`,
    `• Totale gruppo: ${pct(T.compRate,1)} (${int(T.comp)} completati su ${int(T.enr)} assegnazioni, ${int(X.dcAll)} corsi distinti, ${dec(X.perUser(T),1)} corsi per utente); utenti con formazione completa ${int(T.fully)} su ${int(T.enrolledUsers)} (${pct(T.fullyRate,1)}); utenti in regola ${pct(T.okRate,1)} (${int(T.withOverdue)} in ritardo)`,
    ...X.tg.map(g=>`• ${tenantName(g.name)}: ${pct(g.a.compRate,1)} (${int(g.a.comp)}/${int(g.a.enr)}), formazione completa ${pct(g.a.fullyRate,1)}, in regola ${pct(g.a.okRate,1)}${g.ml.length?`, organi di gestione ${pct(g.ma.compRate)}`:""}, PPP ${g.a.ppp==null?"n.d.":dec(g.a.ppp)+"%"}`),
    ...(X.mgmt.length?[`• Organi di gestione: ${int(X.mgmt.length)} persone, completamento ${pct(X.M.compRate,1)}, formazione completa ${int(X.M.fully)}`]:[]),
    `• Phish-prone % medio: ${T.ppp==null?"n.d.":dec(T.ppp)+"%"}`,
    ...(X.PLAN.due.length?[`• Piano ${X.PLAN.yr}: erogati ${X.PLAN.done.length} corsi su ${X.PLAN.due.length} previsti a oggi, completamento medio ${pct(X.PLAN.avg,1)}`]:[]),
    `• Primi 3 del gruppo: ${X.top.slice(0,3).map(x=>`${nameOf(x.u)} (${tenantName(x.u.acct)})`).join(", ")||"–"}`];
  const txt=lines.join("\n");
  try{ await navigator.clipboard.writeText(txt); toast("Sintesi copiata"); }
  catch(e){ const ta=document.createElement("textarea"); ta.value=txt; ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select(); let ok=false; try{ok=document.execCommand("copy");}catch(_){} ta.remove(); toast(ok?"Sintesi copiata":"Copia non riuscita"); }
});
function toast(m){ const t=$("toast"); t.textContent=m; t.classList.add("show"); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove("show"),2400); }

/* ================= eventi ================= */
let RAW=null;
function ingest(rows,name){ if(name!==(DATA&&DATA.name)){ $("cSearch").value=""; $("gSearch").value=""; } const d=parseRows(rows); d.name=name; DATA=d; RAW=rows; syncCampaigns(); syncMgGroups(); render(); }
$("fCur").addEventListener("change",async e=>{
  const f=e.target.files&&e.target.files[0]; if(!f) return;
  try{ const rows=await readFile(f); EXCL.clear(); MG.clear(); if(isSample) $("board").value=""; isSample=false; ingest(rows,f.name); }
  catch(err){ $("status").innerHTML=`<div class="banner err"><strong>${esc(f.name)}</strong>: ${esc(err.message||err)}</div>`; }
});
const visible=id=>[...$(id).querySelectorAll("input")];
const campKeysAll=()=>[...new Set(DATA.rows.map(campKey))];
$("campList").addEventListener("change",e=>{ const k=e.target.dataset.k; if(k==null) return; e.target.checked?EXCL.delete(k):EXCL.add(k); syncCampaigns(); render(); });
$("cSearch").addEventListener("input",syncCampaigns);
$("gSearch").addEventListener("input",syncMgGroups);
$("mgList").addEventListener("change",e=>{ const g=e.target.dataset.g; if(g==null) return; e.target.checked?MG.add(g):MG.delete(g); syncMgGroups(); render(); });
$("gAdd").addEventListener("click",()=>{ visible("mgList").forEach(i=>MG.add(i.dataset.g)); syncMgGroups(); render(); });
$("gDrop").addEventListener("click",()=>{ visible("mgList").forEach(i=>MG.delete(i.dataset.g)); syncMgGroups(); render(); });
$("gClear").addEventListener("click",()=>{ MG.clear(); syncMgGroups(); render(); });
$("gSuggest").addEventListener("click",()=>{ let n=0;
  new Set(DATA.rows.flatMap(r=>r.groups)).forEach(g=>{ const l=g.toLowerCase(); if(MG_SUGGEST.some(w=>l.includes(w)) && !/tutti|all users|dipendenti|employees|remedial/.test(l)){ if(!MG.has(g)) n++; MG.add(g);} });
  syncMgGroups(); render(); toast(n?`${n===1?"Spuntato 1 gruppo suggerito":`Spuntati ${n} gruppi suggeriti`}: controlla l'elenco`:"Nessun gruppo con nomi tipici da management"); });
$("cOnly").addEventListener("click",()=>{ const found=new Set(visible("campList").map(i=>i.dataset.k)); if(!found.size) return; campKeysAll().forEach(k=>found.has(k)?EXCL.delete(k):EXCL.add(k)); syncCampaigns(); render(); });
$("cAdd").addEventListener("click",()=>{ visible("campList").forEach(i=>EXCL.delete(i.dataset.k)); syncCampaigns(); render(); });
$("cDrop").addEventListener("click",()=>{ visible("campList").forEach(i=>EXCL.add(i.dataset.k)); syncCampaigns(); render(); });
$("cAll").addEventListener("click",()=>{ EXCL.clear(); syncCampaigns(); render(); });
$("cActive").addEventListener("click",()=>{ DATA.rows.forEach(r=>{ const k=campKey(r); if(/activ|attiv|in corso|running|open/i.test(r.campStatus)) EXCL.delete(k); else EXCL.add(k); }); syncCampaigns(); render(); });
document.querySelectorAll("[data-per]").forEach(b=>b.addEventListener("click",()=>{
  const t=$("dCur").value?new Date($("dCur").value+"T00:00:00Z"):new Date(), y=t.getUTCFullYear(), iso=d=>d.toISOString().slice(0,10);
  if(b.dataset.per==="year"){ $("pFrom").value=`${y}-01-01`; $("pTo").value=`${y}-12-31`; }
  else if(b.dataset.per==="last12"){ const f=new Date(t); f.setUTCFullYear(y-1); f.setUTCDate(f.getUTCDate()+1); $("pFrom").value=iso(f); $("pTo").value=iso(t); }
  else { $("pFrom").value=""; $("pTo").value=""; }
  render(); }));
$("dateFmt").addEventListener("change",()=>{ if(RAW) ingest(RAW,DATA.name); });
["dCur","pFrom","pTo","target","topN","topNT","board"].forEach(id=>$(id).addEventListener("input",render));
["dedup","topFull"].forEach(id=>$(id).addEventListener("change",render));
$("planText").addEventListener("input",()=>{ savePlanText($("planText").value); render(); });
$("planYear").addEventListener("input",render);
$("tblPlan").addEventListener("change",e=>{ const el=e.target; if(!el.classList.contains("pmap")||!el.value) return; PMAP[el.dataset.c]=[el.value]; savePMap(); render(); toast("Abbinamento salvato"); });
$("tblPlan").addEventListener("click",e=>{ const k=e.target.dataset&&e.target.dataset.unmap; if(k==null) return; delete PMAP[k]; savePMap(); render(); });
$("planReset").addEventListener("click",()=>{ $("planText").value=DEFAULT_PLAN; savePlanText(DEFAULT_PLAN); render(); });
$("btnSample").addEventListener("click",()=>{ $("fCur").value=""; loadSample(); });

/*__SAMPLE__*/
function loadSample(){ isSample=true; EXCL.clear(); MG.clear(); MG.add("Direzione"); $("board").value=""; ingest(sampleRows(),"esempio.csv"); }

/* ================= avvio ================= */
$("dCur").value=new Date().toISOString().slice(0,10);
$("planText").value=loadPlanText(); $("planYear").value=new Date().getUTCFullYear();
loadSample();
if(typeof ExcelJS!=="undefined") $("btnXlsx").disabled=false; else $("dlNote").textContent="Libreria Excel non disponibile.";
