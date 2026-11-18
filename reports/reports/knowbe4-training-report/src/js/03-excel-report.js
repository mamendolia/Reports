/* ================= report Excel formattato (ExcelJS) ================= */
const XC={neutral:"FF5D6479",neutralSoft:"FFEEF0F4",ink:"FF151A2B",muted:"FF5D6479",line:"FFDDE0E8",bg:"FFF3F4F7",zebra:"FFF8F9FB",accent:"FF1F45C7",accentSoft:"FFE6ECFC",
  ok:"FF1D7A4C",okSoft:"FFE2F3EA",warn:"FFA15C00",warnSoft:"FFFBEFD9",bad:"FFB4232C",badSoft:"FFFBE4E5",white:"FFFFFFFF"};
const fillOf=argb=>({type:"pattern",pattern:"solid",fgColor:{argb}});
const thin={style:"thin",color:{argb:XC.line}};
const toDate=t=>t==null?null:new Date(t);
// colore di stato in base al testo della cella
function toneOf(v){
  const s=String(v||"").toLowerCase();
  if(/^(in linea|erogato|completo|rimediato|sì)/.test(s)) return "ok";
  if(/da avviare|pianificato/.test(s)) return "neutral";
  if(/da presidiare|in corso|escluso/.test(s)) return "warn";
  if(/critico|scadut|non trovato|non rimediato/.test(s)) return "bad";
  return null;
}
function newSheet(wb,name,tab,opts={}){
  const ws=wb.addWorksheet(name.slice(0,31),{properties:{tabColor:{argb:tab||XC.accent}},views:[{showGridLines:false,...(opts.freeze?{state:"frozen",ySplit:opts.freeze}:{})}],
    pageSetup:{orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9,margins:{left:.4,right:.4,top:.5,bottom:.5,header:.2,footer:.2}}});
  ws.headerFooter.oddFooter="&L&8KnowBe4 – completamento formazione&R&8Pagina &P di &N";
  return ws;
}
function titleBlock(ws,title,sub,span){
  ws.getRow(1).height=8;
  const t=ws.getCell(2,2); t.value=title; t.font={size:18,bold:true,color:{argb:XC.ink}};
  ws.getRow(2).height=28;
  if(sub){ const s=ws.getCell(3,2); s.value=sub; s.font={size:10,color:{argb:XC.muted}}; if(span) ws.mergeCells(3,2,3,1+span); }
  return 5;
}
function sectionTitle(ws,row,text,span){
  const c=ws.getCell(row,2); c.value=text; c.font={size:13,bold:true,color:{argb:XC.ink}};
  for(let j=2;j<=1+span;j++) ws.getCell(row,j).border={bottom:{style:"medium",color:{argb:XC.accent}}};
  ws.getRow(row).height=22; return row+2;
}
/* tabella: cols=[{h,w,fmt,align,bar,status,wrap}] partendo dalla colonna B */
function table(ws,row,cols,rows,o={}){
  const c0=2;
  if(!o.noWidths) cols.forEach((c,i)=>{ const col=ws.getColumn(c0+i); if(c.w && (!col.width||o.forceWidth||col.width<c.w)) col.width=c.w; });
  const hr=ws.getRow(row); hr.height=30;
  cols.forEach((c,i)=>{ const cell=hr.getCell(c0+i); cell.value=c.h; cell.font={bold:true,color:{argb:XC.white},size:10};
    cell.fill=fillOf(XC.accent); cell.alignment={vertical:"middle",horizontal:c.align||(c.fmt?"right":"left"),wrapText:true}; });
  const first=row+1;
  rows.forEach((r,ri)=>{
    const rr=ws.getRow(first+ri), isTot=o.total && ri===rows.length-1;
    let lines=1; cols.forEach((c,i)=>{ if(c.wrap && r[i]) lines=Math.max(lines,Math.ceil(String(r[i]).length/((c.w||ws.getColumn(c0+i).width||20)*1.15))); });
    rr.height=Math.max(18,lines*14+4);
    cols.forEach((c,i)=>{
      const cell=rr.getCell(c0+i); let v=r[i]; if(v===undefined) v=null; cell.value=v;
      if(c.fmt) cell.numFmt=c.fmt;
      cell.alignment={vertical:"middle",horizontal:c.align||(c.fmt?"right":"left"),wrapText:!!c.wrap};
      cell.font={size:10,color:{argb:XC.ink},bold:isTot};
      cell.border={bottom:thin};
      if(isTot){ cell.fill=fillOf(XC.accentSoft); cell.border={top:{style:"medium",color:{argb:XC.accent}},bottom:thin}; }
      else if(ri%2===1) cell.fill=fillOf(XC.zebra);
      if(c.status && v){ const t=toneOf(v); if(t){ cell.fill=fillOf(XC[t+"Soft"]); cell.font={size:10,bold:true,color:{argb:XC[t]}}; cell.alignment={vertical:"middle",horizontal:"center"}; } }
    });
  });
  const last=first+rows.length-1;
  cols.forEach((c,i)=>{ if(c.bar && rows.length){ const L=ws.getColumn(c0+i).letter;
    ws.addConditionalFormatting({ref:`${L}${first}:${L}${last-(o.total?1:0)>=first?last-(o.total?1:0):first}`,rules:[{type:"dataBar",gradient:false,minLength:0,maxLength:100,cfvo:[{type:"num",value:0},{type:"num",value:1}],color:{argb:"FF7D9BFF"}}]}); } });
  if(o.filter && rows.length) ws.autoFilter={from:{row,column:c0},to:{row:last,column:c0+cols.length-1}};
  return last+2;
}
/* scheda KPI su 4 colonne unite */
function kpiCard(ws,row,col,w,label,value,detail,tone,fmt){
  const box=[row,col,row+2,col+w-1];
  ws.mergeCells(row,col,row,col+w-1); ws.mergeCells(row+1,col,row+1,col+w-1); ws.mergeCells(row+2,col,row+2,col+w-1);
  const a=ws.getCell(row,col), b=ws.getCell(row+1,col), d=ws.getCell(row+2,col);
  a.value=label; a.font={size:9,bold:true,color:{argb:XC.muted}};
  b.value=value; if(fmt) b.numFmt=fmt; b.font={size:22,bold:true,color:{argb:tone?XC[tone]:XC.ink}};
  d.value=detail; d.font={size:9,color:{argb:XC.muted}};
  [a,b,d].forEach(c=>{ c.alignment={vertical:"middle",horizontal:"left",indent:1,wrapText:c===d}; });
  for(let r=box[0];r<=box[2];r++) for(let c=box[1];c<=box[3];c++){
    const cell=ws.getCell(r,c); cell.fill=fillOf(tone?XC[tone+"Soft"]:XC.bg);
    cell.border={left:c===box[1]?{style:"thick",color:{argb:tone?XC[tone]:XC.line}}:undefined,top:r===box[0]?thin:undefined,bottom:r===box[2]?thin:undefined,right:c===box[3]?thin:undefined};
  }
}
const toneRag=r=>({ok:"ok",warn:"warn",bad:"bad"}[rag(r)]||null);

async function buildStyledWorkbook(){
  const X=window.__R, T=X.T, PL=X.PLAN;
  const wb=new ExcelJS.Workbook(); wb.creator="Report formazione KnowBe4"; wb.created=new Date();
  const sub=`Situazione al ${fmtIn($("dCur").value)} · ${X.per} · ${X.campIn} campagne · ${X.tenants.length} tenant · fonte: ${DATA.name}`;
  const P="0.0%", P0="0%", N0="#,##0", N1="#,##0.0", D="dd/mm/yyyy";

  /* ---------- Cruscotto ---------- */
  const ws=newSheet(wb,"Cruscotto",XC.accent);
  ws.getColumn(1).width=2;
  const widths=[30,9,10,10,13,12,15,14,11,15,10,14]; widths.forEach((w,i)=>ws.getColumn(2+i).width=w);
  let r=titleBlock(ws,"Completamento formazione KnowBe4",sub,12);
  ws.getRow(r).height=6; r++;
  const cards=[
    ["COMPLETAMENTO FORMAZIONE",T.compRate,`${int(T.comp)} completati su ${int(T.enr)} assegnazioni (${dec(X.perUser(T),1)} corsi per utente)`,toneRag(T.compRate),P],
    ["UTENTI CON FORMAZIONE COMPLETA",T.fullyRate,`${int(T.fully)} su ${int(T.enrolledUsers)} utenti`,toneRag(T.fullyRate),P],
    ["UTENTI IN REGOLA",T.okRate,`${int(T.inOk)} su ${int(T.enrolledUsers)} senza corsi scaduti · ${int(T.withOverdue)} in ritardo`,toneRag(T.okRate),P],
    ["ORGANI DI GESTIONE",X.mgmt.length?X.M.compRate:"–",X.mgmt.length?`${int(X.mgmt.length)} persone · ${int(X.M.fully)} con formazione completa`:"nessun gruppo selezionato",X.mgmt.length?toneRag(X.M.compRate):null,P],
    ["PHISH-PRONE % MEDIO",T.ppp==null?"–":T.ppp/100,`${int(X.users.filter(u=>u.ppp>0).length)} utenti con PPP > 0`,T.ppp==null?null:T.ppp<=10?"ok":T.ppp<=20?"warn":"bad",P],
    ["PIANO DI EROGAZIONE",PL.due.length?`${PL.done.length} / ${PL.due.length}`:"–",PL.due.length?`corsi erogati sui previsti a oggi · completamento medio ${pct(PL.avg,1)}`:"nessun piano",PL.due.length?(PL.done.length===PL.due.length?"ok":"warn"):null,null]
  ];
  cards.forEach((c,i)=>{ const row=r+Math.floor(i/3)*4, col=2+(i%3)*4; kpiCard(ws,row,col,4,...c); ws.getRow(row+1).height=30; ws.getRow(row+2).height=26; });
  r+=8;
  r=sectionTitle(ws,r,"Completamento per tenant",12);
  const tRows=X.tg.map(g=>[tenantName(g.name),g.a.enrolledUsers,(X.DC.get(g.name)||new Set()).size,X.perUser(g.a),g.a.enr,g.a.comp,g.a.compRate,g.a.fullyRate,g.a.okRate,g.ml.length?g.ma.compRate:null,g.a.ppp==null?null:g.a.ppp/100,ragLabel(rag(g.a.compRate))]);
  if(X.tg.length>1) tRows.push(["Totale gruppo",T.enrolledUsers,X.dcAll,X.perUser(T),T.enr,T.comp,T.compRate,T.fullyRate,T.okRate,X.mgmt.length?X.M.compRate:null,T.ppp==null?null:T.ppp/100,ragLabel(rag(T.compRate))]);
  r=table(ws,r,[{h:"Tenant"},{h:"Utenti",fmt:N0},{h:"Corsi distinti",fmt:N0},{h:"Corsi per utente",fmt:N1},{h:"Assegnazioni",fmt:N0},{h:"Completati",fmt:N0},{h:"Completamento",fmt:P,bar:true},{h:"Formazione completa",fmt:P},{h:"Utenti in regola",fmt:P},{h:"Organi di gestione",fmt:P},{h:"PPP medio",fmt:P},{h:"Stato",status:true,align:"center"}],tRows,{total:X.tg.length>1,noWidths:true});
  r=sectionTitle(ws,r,"Primi 5 del gruppo",12);
  X.top.slice(0,5).forEach((x,i)=>{ const u=x.u;
    const a=ws.getCell(r,2); a.value=`${i+1}.  ${nameOf(u)}`; a.font={size:11,bold:true,color:{argb:XC.ink}};
    const b=ws.getCell(r,3); ws.mergeCells(r,3,r,6); b.value=tenantName(u.acct); b.font={size:10,color:{argb:XC.muted}};
    const c=ws.getCell(r,7); c.value=x.s; c.numFmt="0.0"; c.font={size:11,bold:true,color:{argb:XC.accent}};
    const d=ws.getCell(r,8); ws.mergeCells(r,8,r,13); d.value=`${u.completed}/${u.enrolled} corsi · ${pct((u.completed-u.completedPD)/u.enrolled)} in tempo${u.avgDays!=null?` · ${dec(u.avgDays,1)} giorni medi`:""}`; d.font={size:10,color:{argb:XC.muted}};
    for(let j=2;j<=13;j++) ws.getCell(r,j).border={bottom:thin};
    ws.getRow(r).height=20; r++; });
  r++;
  const note=ws.getCell(r,2); ws.mergeCells(r,2,r,13); note.value="Completamento = corsi completati / assegnazioni (1 = un corso assegnato a un utente). Formazione completa = utenti con tutti i corsi completati. Utenti in regola = utenti senza corsi scaduti non completati. Dettagli negli altri fogli."; note.font={size:9,italic:true,color:{argb:XC.muted}}; note.alignment={wrapText:true}; ws.getRow(r).height=26;

  /* ---------- Piano erogato ---------- */
  const MESE=m=>MESI_IT[m][0].toUpperCase()+MESI_IT[m].slice(1);
  const wp=newSheet(wb,"Piano erogato","FF1D7A4C",{});
  wp.getColumn(1).width=2;
  let rp=titleBlock(wp,`Piano di erogazione ${PL.yr}`,`${PL.done.length} corsi erogati su ${PL.due.length} previsti a oggi · completamento medio ${pct(PL.avg,1)} · ${sub}`,6+X.tenants.length);
  const multi=X.tenants.length>1;
  rp=table(wp,rp,[{h:"Mese",w:16},{h:"Corso",w:58,wrap:true},{h:"Stato",w:22,status:true,align:"center"},{h:"Utenti",w:9,fmt:N0},{h:"Completati",w:11,fmt:N0},{h:"Completamento",w:15,fmt:P,bar:true},...(multi?X.tenants.map(t=>({h:tenantName(t),w:16,fmt:P0})):[]),{h:"Prima assegnazione",w:14,fmt:D,align:"center"},{h:"Nome nell'export",w:52,wrap:true}],
    PL.rows.map(x=>[x.months.slice().sort((a,b)=>a-b).map(MESE).join(", "),x.course,x.status.l,x.n?x.users:null,x.n?x.comp:null,x.rate,...(multi?x.byT.map(b=>b.n?b.rate:null):[]),toDate(x.firstEnr),x.names.filter(n=>normC(n)!==normC(x.course)).join("; ")]),{});
  if(PL.offPlan.length){ rp=sectionTitle(wp,rp,"Corsi nell'export non presenti nel piano",4);
    rp=table(wp,rp,[{h:"Mese",w:16},{h:"Corso",w:58},{h:"Stato",w:22},{h:"Assegnazioni",w:9,fmt:N0}],PL.offPlan.map(o=>["",o.c,"",o.n]),{}); }

  /* ---------- Organi di gestione ---------- */
  const wm=newSheet(wb,"Organi di gestione","FF7A4BC2");
  wm.getColumn(1).width=2;
  let rm=titleBlock(wm,"Organi di gestione",`Gruppi: ${[...MG].join(", ")||"nessuno"} · ${int(X.mgmt.length)} persone · ${sub}`,10);
  rm=table(wm,rm,[{h:"Tenant",w:30},{h:"Persone",w:10,fmt:N0},{h:"Assegnazioni",w:13,fmt:N0},{h:"Completati",w:11,fmt:N0},{h:"Completamento",w:15,fmt:P,bar:true},{h:"Formazione completa",w:14,fmt:P},{h:"In regola",w:12,fmt:P},{h:"Persone in ritardo",w:14,fmt:N0},{h:"PPP medio",w:11,fmt:P},{h:"Stato",w:16,status:true,align:"center"}],
    [...X.tg.map(g=>[tenantName(g.name),g.ml.length,g.ma.enr,g.ma.comp,g.ma.compRate,g.ma.fullyRate,g.ma.okRate,g.ma.withOverdue,g.ma.ppp==null?null:g.ma.ppp/100,g.ml.length?ragLabel(rag(g.ma.compRate)):""]),
     ...(X.tg.length>1?[["Totale gruppo",X.mgmt.length,X.M.enr,X.M.comp,X.M.compRate,X.M.fullyRate,X.M.okRate,X.M.withOverdue,X.M.ppp==null?null:X.M.ppp/100,X.mgmt.length?ragLabel(rag(X.M.compRate)):""]]:[])],{total:X.tg.length>1});
  if(X.mgmt.length){ rm=sectionTitle(wm,rm,"Persone",10);
    rm=table(wm,rm,[{h:"Tenant"},{h:"Persona",w:24},{h:"Email",w:32},{h:"Gruppi",w:30,wrap:true},{h:"Stato",status:true,align:"center"},{h:"Completati",fmt:N0},{h:"Assegnati",fmt:N0},{h:"Corsi scaduti",fmt:N0},{h:"Ultimo completamento",fmt:D,align:"center"},{h:"PPP",fmt:"0.0"}],
      [...X.mgmt].sort((a,b)=>a.acct.localeCompare(b.acct)||fullName(a).localeCompare(fullName(b))).map(u=>[tenantName(u.acct),fullName(u),u.email,u.graw.join(", "),statusOf(u).l,u.completed,u.enrolled,u.inProgressPD+u.notStartedPD,toDate(u.lastComp),u.ppp]),{}); }

  /* ---------- Top gruppo ---------- */
  const topCols=[{h:"#",w:6,fmt:N0,align:"center"},{h:"Utente",w:28},{h:"Tenant",w:30},{h:"Gruppi",w:30,wrap:true},{h:"Punteggio",w:11,fmt:"0.0"},{h:"Completati",w:11,fmt:N0},{h:"Assegnati",w:10,fmt:N0},{h:"In tempo",w:10,fmt:P0},{h:"Giorni medi",w:11,fmt:N1},{h:"Media test",w:10,fmt:N0},{h:"PPP",w:8,fmt:"0.0"}];
  const topRow=(x,i)=>{const u=x.u; return [i+1,nameOf(u),tenantName(u.acct),u.graw.join(", "),x.s,u.completed,u.enrolled,(u.completed-u.completedPD)/u.enrolled,u.avgDays,u.avgScore==null?null:Math.round(u.avgScore),u.ppp];};
  const wt=newSheet(wb,"Top gruppo","FFA15C00");
  wt.getColumn(1).width=2;
  let rt=titleBlock(wt,`Top ${X.top.length} del gruppo`,RULE,11);
  wt.getRow(3).height=42; wt.getCell(3,2).alignment={wrapText:true,vertical:"top"};
  rt=table(wt,rt,topCols,X.top.map(topRow),{});
  [1,2,3].forEach(i=>{ const c=wt.getCell(rt-2-X.top.length+i,2); if(i<=X.top.length){ c.fill=fillOf(["FFF6D365","FFD9DDE5","FFE8C39E"][i-1]); c.font={bold:true,size:11,color:{argb:XC.ink}}; } });

  /* ---------- Top per tenant ---------- */
  const wtt=newSheet(wb,"Top per tenant","FFA15C00");
  wtt.getColumn(1).width=2;
  let rr=titleBlock(wtt,`Top ${X.NT} per tenant`,RULE,11);
  wtt.getRow(3).height=42; wtt.getCell(3,2).alignment={wrapText:true,vertical:"top"};
  X.perT.forEach(t=>{
    const h=wtt.getCell(rr,2); wtt.mergeCells(rr,2,rr,12); h.value=`${tenantName(t.name)}   ·   completamento ${pct(t.a.compRate,1)}   ·   ${int(t.rk.length)} in classifica su ${int(t.n)}`;
    h.font={bold:true,size:12,color:{argb:XC.accent}}; h.fill=fillOf(XC.accentSoft); h.alignment={vertical:"middle",indent:1}; wtt.getRow(rr).height=24;
    rr=table(wtt,rr+1,topCols,t.rk.slice(0,X.NT).map(topRow),{})+1;
  });

  /* ---------- Utenti ---------- */
  const wu=newSheet(wb,"Utenti","FF5D6479",{freeze:4});
  wu.getColumn(1).width=2;
  let ru=titleBlock(wu,"Stato per utente",sub,14);
  table(wu,ru,[{h:"Tenant",w:28},{h:"Nome",w:14},{h:"Cognome",w:16},{h:"Email",w:30},{h:"Gruppi",w:30},{h:"Stato",w:22,status:true,align:"center"},{h:"Assegnati",w:10,fmt:N0},{h:"Completati",w:11,fmt:N0},{h:"Completati in ritardo",w:12,fmt:N0},{h:"Corsi scaduti",w:11,fmt:N0},{h:"Ultimo completamento",w:14,fmt:D,align:"center"},{h:"Punteggio",w:10,fmt:"0.0"},{h:"PPP",w:8,fmt:"0.0"},{h:"Organo di gestione",w:12,align:"center"}],
    X.users.slice().sort((a,b)=>a.acct.localeCompare(b.acct)||fullName(a).localeCompare(fullName(b))).map(u=>[tenantName(u.acct),u.first,u.last,u.email,u.graw.join(", "),statusOf(u).l,u.enrolled,u.completed,u.completedPD,u.inProgressPD+u.notStartedPD,toDate(u.lastComp),userScore(u),u.ppp,X.mgmt.includes(u)?"Sì":""]),{filter:true});

  /* ---------- Registro ---------- */
  const wr=newSheet(wb,"Registro formazione","FF5D6479",{freeze:4});
  wr.getColumn(1).width=2;
  let rg=titleBlock(wr,"Registro della formazione","Una riga per ogni corso assegnato nel perimetro, prima della deduplica",18);
  table(wr,rg,[{h:"Tenant",w:24},{h:"Email",w:30},{h:"Nome",w:14},{h:"Cognome",w:16},{h:"Gruppi",w:26},{h:"Campagna",w:30},{h:"Stato campagna",w:12},{h:"Corso",w:44},{h:"Tipo",w:16},{h:"Stato",w:14,status:true,align:"center"},{h:"Stato KnowBe4",w:14},{h:"Scaduto",w:9,align:"center"},{h:"Assegnato il",w:12,fmt:D,align:"center"},{h:"Avviato il",w:12,fmt:D,align:"center"},{h:"Completato il",w:12,fmt:D,align:"center"},{h:"Tempo (min)",w:10,fmt:N0},{h:"Punteggio",w:9,fmt:N0},{h:"Nota deduplica",w:30}],
    [...X.FR].sort((a,b)=>a.acct.localeCompare(b.acct)||a.uid.localeCompare(b.uid)||(a.enr||0)-(b.enr||0)).map(x=>[tenantName(x.acct),x.email,x.first,x.last,x.groups.join(", "),x.camp,x.campStatus,x.content,x.ctype,STL[x.st]==="Completato"?"Completo":STL[x.st],x.rawSt,x.pd?"Sì":"",toDate(x.enr),toDate(x.start),toDate(x.comp),x.time?Math.round(x.time/60):null,x.score,x.dup]),{filter:true});

  /* ---------- Note ---------- */
  const wn=newSheet(wb,"Note","FF9AA1B8");
  wn.getColumn(1).width=2; wn.getColumn(2).width=140;
  let rn=titleBlock(wn,"Note sulla qualità dei dati",sub,1);
  const excluded=[...EXCL].filter(k=>DATA.rows.some(x=>campKey(x)===k)).map(k=>k.split("§").filter(Boolean).join(" · "));
  [`Campagne escluse: ${excluded.join("; ")||"nessuna"}`,`Deduplica corsi tra campagne: ${$("dedup").checked?"attiva (vale l'esito migliore)":"disattivata"}`,...[...$("notes").querySelectorAll("li")].map(li=>li.textContent)]
    .forEach(t=>{ const c=wn.getCell(rn++,2); c.value="• "+t; c.alignment={wrapText:true,vertical:"top"}; c.font={size:10,color:{argb:XC.ink}}; });

  return wb.xlsx.writeBuffer();
}
