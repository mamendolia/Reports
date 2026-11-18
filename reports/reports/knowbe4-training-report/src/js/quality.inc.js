  // qualità
  const notes=[], cnt=(arr,f)=>{const m=new Map(); arr.forEach(x=>{const k=f(x); m.set(k,(m.get(k)||0)+1);}); return [...m.entries()].sort((a,b)=>b[1]-a[1]);};
  notes.push(`Lette <strong>${int(DATA.rows.length)}</strong> righe di iscrizione; nel perimetro <strong>${int(FR.length)}</strong>${info.byAcct?` (${int(info.byAcct)} di altre aziende`:" ("}${info.byCamp?`${info.byAcct?", ":""}${int(info.byCamp)} di campagne escluse`:""}${info.byPeriod?`${info.byAcct||info.byCamp?", ":""}${int(info.byPeriod)} fuori periodo`:""}${info.byAcct||info.byCamp||info.byPeriod?")":"nessuna esclusa)"}.`);
  notes.push(`Duplicati: righe identiche rimosse ${int(info.exact)}; ${$("dedup").checked?`corsi ripetuti in più campagne contati una volta sola ${int(info.cross)} (vale l'esito migliore)`:"deduplica tra campagne disattivata"}. Risultato: <strong>${int(DR.length)}</strong> assegnazioni per <strong>${int(users.length)}</strong> utenti.`);
  notes.push(`Valori di Training Status trovati, con come li ho letti: ${cnt(DATA.rows,r=>r.rawSt+"→"+r.st).map(([k,n])=>{const [a,b]=k.split("→"); return `"${esc(a||"(vuoto)")}" → ${STL[b]} (${int(n)})`;}).join(", ")}.`);
  const unk=cnt(DATA.rows.filter(r=>!r.known),r=>r.rawSt); if(unk.length) notes.push(`<strong>Stati non riconosciuti</strong>, interpretati dalle date: ${unk.map(([k,n])=>`"${esc(k||"(vuoto)")}" (${int(n)})`).join(", ")}. Verifica che sia corretto.`);
  notes.push(`Valori di Past Due trovati: ${cnt(DATA.rows,r=>r.rawPd+"→"+(r.pd?"scaduto":"no")).map(([k,n])=>{const [a,b]=k.split("→"); return `"${esc(a||"(vuoto)")}" → ${b} (${int(n)})`;}).join(", ")}.`);
  notes.push(`Date: ${DATE_INFO}. Esempio: prima assegnazione ${fmtD(Math.min(...DATA.rows.map(r=>r.enr).filter(x=>x!=null)))}.`);
  const compNoDate=DATA.rows.filter(r=>r.st==="completed"&&r.comp==null).length; if(compNoDate) notes.push(`${int(compNoDate)} righe completate senza "Completed On": escluse dall'andamento mensile.`);
  if(info.noDate) notes.push(`${int(info.noDate)} righe senza "Enrolled On" escluse dal filtro per periodo.`);
  if(DATA.plain) notes.push(`${int(DATA.plain)} valori di durata o tempo erano numeri semplici: letti come minuti.`);
  notes.push(`Gruppi separati da "${esc(DATA.gsep)}"; ${int(users.filter(u=>!u.groups.length).length)} utenti senza gruppi.`);
  if(!DATA.hasEmail) notes.push(`Email assenti o vuote: gli utenti sono identificati da azienda + nome e cognome${DATA.rows.some(r=>!r.first&&!r.last)?" (o dalla riga, se anche questi mancano: in quel caso ogni riga è un utente diverso)":""}.`);
  const nf=DATA.notFound.filter(k=>!["remain"].includes(k)); if(nf.length) notes.push(`Colonne non presenti nel file: ${nf.join(", ")}.`);
  if(!$("dCur").value) notes.push(`Data dell'estrazione non indicata.`);
  $("notes").innerHTML=notes.map(n=>`<li>${n}</li>`).join("");