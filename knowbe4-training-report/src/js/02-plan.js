/* ================= piano di erogazione =================
   DEFAULT_PLAN è un piano di esempio (titoli del catalogo KnowBe4); sostituiscilo dalla pagina con il tuo. */
const DEFAULT_PLAN=`Marzo	The Inside Man: stagione 1 ep. 01 - Quello nuovo (ingegneria sociale)
	Il tuo ruolo 2026: tu e la sicurezza su internet
Aprile	The Inside Man: stagione 1 ep. 01 - Quello nuovo (ingegneria sociale)
	
	Il tuo ruolo 2026: tu e la sicurezza su internet
	
	
Maggio	Zona Pericolosa 2026
	
	The Inside Man: stagione 1 ep. 02 - Vita sociale (social media)
	
Giugno	Phishing Foundations
	
	The Inside Man: stagione 1 ep. 03 - Dalla nostra parte (attacchi di phishing)
	
Luglio	Nozioni di base sulla privacy dei dati
	The Inside Man: stagione 1 ep. 04 - Sorpresa (smaltimento dei documenti)
	
	
Agosto	The Inside Man: stagione 1 ep. 05 - A portata di mano (politica della scrivania pulita)
	
	The Inside Man: stagione 1 ep. 06 - Festa in maschera (servizi cloud)
	
Settembre	"
Navigazione web sicura"
	
	The Inside Man: stagione 1 ep. 07 - Prendere tempo (password)
	
Ottobre	The Inside Man: stagione 1 ep. 08 - Trappole (ransomware)
	
	How to Become A Human Firewall
	
Novembre	The Inside Man: stagione 1 ep. 09 - Nel mondo delle creature selvagge (sicurezza in viaggio)
	
	
	Fondamenti di sicurezza informatica: Password sicure
	
	The Inside Man: stagione 1 ep. 10 - Tieniti stretti gli amici
	
Dicembre	The Inside Man: stagione 1 ep. 11 - Squillano le trombe (dispositivi esterni)
	
	DeepFake Truffe e Disinformazione
	The Inside Man: stagione 1 ep. 12 - Scacco matto (minacce interne)`;
const MESI_IT=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
const MESI_EN=["january","february","march","april","may","june","july","august","september","october","november","december"];
const monthOf=t=>{ const s=String(t||"").trim().toLowerCase().replace(/[^a-zà-ù]/g,""); if(!s) return -1;
  let i=MESI_IT.indexOf(s); if(i<0) i=MESI_EN.indexOf(s); if(i<0) i=MESI_IT.findIndex(m=>s.length>=3&&m.startsWith(s)); return i; };
function parsePlan(text){
  const out=[]; let m=-1;
  String(text||"").split(/\r?\n/).forEach(line=>{
    const cells=line.split("\t"); let first=(cells[0]||"").trim(), rest=cells.slice(1).join(" ").trim();
    if(cells.length===1){ const mm=monthOf(first); if(mm>=0){ m=mm; return; } rest=first; first=""; }
    else { const mm=monthOf(first); if(mm>=0) m=mm; else if(first) rest=(first+" "+rest).trim(); }
    const course=rest.replace(/^["“”']+|["“”']+$/g,"").replace(/\s+/g," ").trim();
    if(course && m>=0) out.push({m,course});
  });
  return out;
}
const normC=s=>String(s||"").toLowerCase().replace(/[“”"'’]/g,"").replace(/[^a-z0-9à-ù]+/g," ").replace(/\b0+(\d)/g,"$1").trim();
/* titoli italiani del piano ↔ titoli inglesi dell'export KnowBe4 */
const ALIASES=[
  ["Il tuo ruolo 2026: tu e la sicurezza su internet","2026 Your Role: Internet Security and You"],
  ["Zona Pericolosa 2026","2026 Danger Zone"],
  ["Nozioni di base sulla privacy dei dati","Data Privacy Basics"],
  ["Navigazione web sicura","Safe Web Surfing Game"],
  ["Navigazione web sicura","Safe Web Surfing"],
  ["Fondamenti di sicurezza informatica: Password sicure","Security Awareness Fundamentals: Strong Passwords"],
  ["Fondamenti di sicurezza informatica: Password sicure","Cybersecurity Fundamentals: Strong Passwords"],
  ["DeepFake Truffe e Disinformazione","Deepfakes, Scams and Disinformation"],
  ["DeepFake Truffe e Disinformazione","Deepfake Scams and Disinformation"]
].map(([a,b])=>[normC(a),normC(b)]);
const insideMan=t=>{ const m=normC(t).match(/inside man\b.*?(?:stagione|season|s)\s*(\d+).*?(?:ep|episodio|episode)\s*(\d+)/); return m?m[1]+"-"+m[2]:null; };
function sameCourse(a,b){
  const x=normC(a), y=normC(b); if(!x||!y) return false; if(x===y) return true;
  if(ALIASES.some(([p,q])=>(p===x&&q===y)||(p===y&&q===x))) return true;
  const ia=insideMan(a), ib=insideMan(b); if(ia||ib) return ia!=null && ia===ib;   // The Inside Man: stesso episodio = stesso corso
  const nx=(x.match(/\d+/g)||[]).join(","), ny=(y.match(/\d+/g)||[]).join(",");
  if(nx!==ny) return false;                         // numeri diversi (es. ep. 01 / ep. 02): corsi diversi
  if(x.length>12 && y.length>12 && (x.includes(y)||y.includes(x))) return true;
  const A=new Set(x.split(" ")), B=new Set(y.split(" ")); let inter=0; A.forEach(t=>{ if(B.has(t)) inter++; });
  return inter/(A.size+B.size-inter) >= 0.75;
}
function simCourse(a,b){ const x=normC(a), y=normC(b); if(!x||!y) return 0;
  const A=new Set(x.split(" ")), B=new Set(y.split(" ")); let inter=0; A.forEach(t=>{ if(B.has(t)) inter++; });
  let s=inter/(A.size+B.size-inter); const nx=(x.match(/\d+/g)||[]).join(","), ny=(y.match(/\d+/g)||[]).join(","); if(nx&&nx===ny) s+=.3; return s; }
let PMAP={}; try{ PMAP=JSON.parse(localStorage.getItem("kb4_piano_map")||"{}")||{}; }catch(e){ PMAP={}; }
function savePMap(){ try{ localStorage.setItem("kb4_piano_map",JSON.stringify(PMAP)); }catch(e){} }
function loadPlanText(){ try{ const v=localStorage.getItem("kb4_piano"); if(v) return v; }catch(e){} return DEFAULT_PLAN; }
function savePlanText(v){ try{ localStorage.setItem("kb4_piano",v); }catch(e){} }

function renderPlan(DR,tenants){
  const plan=parsePlan($("planText").value);
  const refD=$("dCur").value?new Date($("dCur").value+"T00:00:00Z"):new Date(), curM=refD.getUTCMonth(), yr=+$("planYear").value||refD.getUTCFullYear(), curY=refD.getUTCFullYear();
  const isFuture=m=> yr>curY || (yr===curY && m>=curM);
  // un corso può comparire in più mesi: una riga per corso, con tutti i mesi
  const items=[]; plan.forEach(p=>{ const it=items.find(x=>normC(x.course)===normC(p.course)); if(it){ if(!it.months.includes(p.m)) it.months.push(p.m); } else items.push({course:p.course,months:[p.m]}); });
  const contents=[...new Set(DR.map(r=>r.content))];
  const allContents=[...new Set(DATA.rows.map(r=>r.content))];
  const matched=new Set();
  const rows=items.map(it=>{
    const manual=(PMAP[normC(it.course)]||[]).filter(n=>n);
    const names=contents.filter(c=>manual.includes(c)||sameCourse(c,it.course)); names.forEach(n=>matched.add(n));
    const inFile=allContents.filter(c=>manual.includes(c)||sameCourse(c,it.course));
    const R=DR.filter(r=>names.includes(r.content));
    const a=st=>R.filter(r=>r.st===st).length;
    const byT=tenants.map(t=>{ const x=R.filter(r=>r.acct===t); const c=x.filter(r=>r.st==="completed").length; return {t,n:x.length,c,rate:x.length?c/x.length:null}; });
    const first=Math.min(...it.months), en=R.map(r=>r.enr).filter(v=>v!=null);
    let status;
    if(R.length) status={k:"ok",l:"Erogato",c:"ok"};
    else if(isFuture(first)) status={k:"next",l:first===curM&&yr===curY?"Da avviare (mese in corso)":"Pianificato",c:"neutral"};
    else if(inFile.length) status={k:"filt",l:"Escluso dai filtri",c:"warn"};
    else status={k:"miss",l:"Non trovato nell'export",c:"bad"};
    const im=insideMan(it.course);
    const sugg=allContents.filter(c=>!(im && insideMan(c) && insideMan(c)!==im)).map(c=>({c,s:simCourse(c,it.course)})).sort((a,b)=>b.s-a.s);
    return {...it,first,names,manual,inFile,sugg,n:R.length,comp:a("completed"),rate:R.length?a("completed")/R.length:null,users:new Set(R.map(r=>r.uid)).size,byT,status,firstEnr:en.length?Math.min(...en):null};
  }).sort((x,y)=>x.first-y.first);
  const offPlan=contents.filter(c=>!matched.has(c)).map(c=>({c,n:DR.filter(r=>r.content===c).length})).sort((a,b)=>b.n-a.n);
  const due=rows.filter(r=>!isFuture(r.first)), done=due.filter(r=>r.status.k==="ok");
  const missN=rows.filter(r=>r.status.k==="miss").length, filtN=rows.filter(r=>r.status.k==="filt").length;
  const avg=done.length?done.reduce((s,r)=>s+r.rate,0)/done.length:null;
  const k=(lab,val,det,cls)=>`<div class="kpi ${cls}"><span class="lab">${lab}</span><span class="val">${val}</span><span class="det">${det}</span></div>`;
  $("planKpis").innerHTML=!plan.length?"":
    k("Corsi previsti a oggi",`${int(done.length)} / ${int(due.length)}`,`erogati sul totale dei corsi dei mesi passati`,due.length&&done.length===due.length?"ok":due.length?"warn":"neutral")+
    k("Completamento medio",pct(avg,1),`media dei corsi del piano già erogati`,rag(avg))+
    k("Da avviare",int(rows.length-due.length),`corsi dal mese in corso in avanti`,"neutral")+
    k("Fuori piano",int(offPlan.length),`corsi nell'export non presenti nel piano`,offPlan.length?"warn":"ok");
  const mlab=ms=>ms.sort((a,b)=>a-b).map(m=>MESI_IT[m][0].toUpperCase()+MESI_IT[m].slice(1)).join(", ");
  $("tblPlan").innerHTML=!plan.length?`<tbody><tr><td class="muted">Nessun piano: incollalo in "Modifica piano".</td></tr></tbody>`:
    `<thead><tr><th>Mese</th><th>Corso</th><th>Stato</th><th class="n">Utenti</th><th>Completamento</th>${tenants.length>1?tenants.map(t=>`<th class="n">${esc(tenantName(t))}</th>`).join(""):""}<th>Prima assegnazione</th><th>Nome nell'export</th></tr></thead><tbody>${
    rows.map(r=>`<tr><td>${mlab(r.months)}</td><td class="tw">${esc(r.course)}</td><td><span class="pill ${r.status.c}">${r.status.l}</span></td><td class="n">${r.n?int(r.users):""}</td>
      <td>${r.n?`<div class="cell-bar"><div class="bar" aria-hidden="true"><i style="width:${(r.rate||0)*100}%"></i></div><span class="num">${pct(r.rate)} · ${int(r.comp)}/${int(r.n)}</span></div>`:""}</td>
      ${tenants.length>1?r.byT.map(b=>`<td class="n">${b.n?pct(b.rate):"–"}</td>`).join(""):""}<td>${fmtD(r.firstEnr)}</td><td class="small tw">${
        r.names.filter(n=>normC(n)!==normC(r.course)).map(n=>`<span class="muted">${esc(n)}</span>`).join("; ")}${
        r.manual.length?` <button type="button" class="linkbtn" data-unmap="${esc(normC(r.course))}">rimuovi abbinamento</button>`:""}${
        (r.status.k==="miss" && allContents.length) ? `<select class="pmap" data-c="${esc(normC(r.course))}" aria-label="Abbina a un corso dell'export"><option value="">Abbina a un corso dell'export…</option>${
          r.sugg.slice(0,40).map((x,i)=>`<option value="${esc(x.c)}">${i<3&&x.s>.15?"★ ":""}${esc(x.c)}</option>`).join("")}</select>`:""}</td></tr>`).join("")}</tbody>`;
  $("planHelp").innerHTML = (missN||filtN) ? `<div class="banner sample">${missN?`<strong>${missN} corsi del piano non trovati</strong> nell'export con lo stesso nome: scegli nella colonna "Nome nell'export" a quale corso corrispondono (★ = più simili). L'abbinamento viene ricordato.`:""}${filtN?` ${filtN} corsi sono nel file ma esclusi da filtro periodo o campagne.`:""}</div>` : "";
  $("planOff").innerHTML=offPlan.length?`<strong>Corsi nell'export non presenti nel piano:</strong> ${offPlan.map(o=>`${esc(o.c)} (${int(o.n)})`).join(", ")}.`:"";
  return {rows,offPlan,due,done,avg,yr};
}
