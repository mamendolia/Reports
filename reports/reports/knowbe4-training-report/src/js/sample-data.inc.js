/* ================= dati di esempio (fittizi) ================= */
function sampleRows(){
  let s=7; const rnd=()=>(s=(s*16807)%2147483647)/2147483647, pick=a=>a[Math.floor(rnd()*a.length)];
  const nomi=["Giulia","Marco","Sara","Luca","Elena","Paolo","Chiara","Davide","Francesca","Andrea","Martina","Simone","Laura","Matteo","Valentina","Stefano"];
  const cogn=["Rossi","Bianchi","Ferrari","Esposito","Colombo","Ricci","Marino","Greco","Bruno","Gallo","Conti","De Luca","Costa","Fontana","Moretti","Barbieri"];
  const H=["Email","Account","First Name","Last Name","Current PPP","Risk Score","Groups","Campaign Name","Campaign Status","Content Name","Content Type","Content Duration","Training Status","Past Due","Enrolled On (UTC)","Started On (UTC)","Completed On (UTC)","Total Time Spent","Time Remaining","Score"];
  const MESI_C=["Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre"];
  const camps=parsePlan(DEFAULT_PLAN).filter(x=>x.m>=2&&x.m<=9).reduce((acc,x)=>{ let c=acc.find(c=>c.m===x.m); if(!c){ c={m:x.m,n:`Formazione ${MESI_C[x.m-2]} 2026`,st:x.m<9?"Closed":"Active",start:Date.UTC(2026,x.m,3),mods:[]}; acc.push(c); }
    c.mods.push([x.course, /inside man/i.test(x.course)?"Video Module":"Training Module", /inside man/i.test(x.course)?8:20]); return acc; },[]);
  camps.push({n:"Onboarding nuovi assunti",st:"Active",start:Date.UTC(2026,1,10),mods:[["Security Awareness Fundamentals","Training Module",45]]});
  const accts=[["Esempio S.p.A.",["Amministrazione","Produzione","Vendite","IT","Direzione"]],["Esempio Logistica S.r.l.",["Magazzino","Trasporti","Uffici","Direzione"]]];
  const ref=Date.UTC(2026,10,10), ts=t=>{const d=new Date(t); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`;};
  const hms=sec=>`${pad(Math.floor(sec/3600))}:${pad(Math.floor(sec%3600/60))}:${pad(sec%60)}`;
  const rows=[H];
  for(let i=0;i<70;i++){
    const [acct,grs]=accts[i<44?0:1], fn=pick(nomi), ln=pick(cogn), email=`${fn}.${ln}${i}`.toLowerCase().replace(/\s/g,"")+(i<44?"@esempio.it":"@esempio-logistica.it");
    const dir=(i%22===0||i%22===1), gr=dir?"Direzione":pick(grs.filter(g=>g!=="Direzione"));
    const ppp = rnd()<.8?0:pick([5,10,20,33.3]), risk=Math.round(200+rnd()*500);
    const groups=[gr, ...(rnd()<.3?["Tutti i dipendenti"]:[]), ...(ppp>0||rnd()<.08?["Remedial Phishing"]:[])].join(", ");
    const zeal = {"Direzione":.75,"IT":.95,"Produzione":.5,"Magazzino":.45,"Vendite":.65}[gr] ?? .8;
    for(const c of camps){
      if(c.n.startsWith("NIS2") && !dir) continue;
      if(c.n==="Onboarding 2026" && rnd()<.25) continue;
      const enr=c.start+Math.floor(rnd()*5)*DAY, due=enr+30*DAY;
      for(const [mn,mt,md] of c.mods){
        let st,start=null,comp=null,time=0,score="";
        const r=rnd();
        if(r<zeal){ start=enr+Math.floor(rnd()*20)*DAY; comp=start+Math.floor(rnd()*3)*DAY+3600000*Math.floor(rnd()*8); if(comp>ref){comp=null;}
          if(comp){ time=Math.round(md*60*(0.6+rnd()*0.8)); st = mt==="Assessment" && rnd()<.12 ? "Failed" : "Passed"; if(mt==="Assessment") score=st==="Failed"?Math.round(40+rnd()*25):Math.round(70+rnd()*30); }
          else { st="In Progress"; time=Math.round(md*20*rnd()); } }
        else if(r<zeal+.1){ st="In Progress"; start=enr+Math.floor(rnd()*20)*DAY; if(start>ref) start=ref-DAY; time=Math.round(md*25*rnd()); }
        else st="Not Started";
        const pd = (st!=="Passed" && due<ref) || (comp && comp>due) ? "Yes":"No";
        rows.push([email,acct,fn,ln,ppp,risk,groups,c.n,c.st,mn,mt,md,st,pd,ts(enr),start?ts(start):"",comp?ts(comp):"",hms(time),"",score]);
      }
    }
  }
  // una riga duplicata identica
  rows.push(rows[5].slice());
  return rows;
}