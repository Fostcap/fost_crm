import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { storage } from "./storage";

var C={navy:"#1a2744",blue:"#2d4a7a",accent:"#4a90d9",gold:"#c9a84c",green:"#2ecc71",red:"#e74c3c",orange:"#f39c12",light:"#f0f2f5",white:"#fff",gray:"#6b7b8d",dk:"#3a4a5c"};
var CL_STATUS=["Prospect Identification","Known Prospect","Contacted","1st Meeting","Due Dil","Soft Commit","Hard Commit","Invested","Declined"];
var CL_TYPES=["Advisors","Alt AM","AM","Broker","Endowments","FoF","HNWI","Holding","Ins Co","MFO","PB","PE","Pension","SFO","SWF"];
var COUNTRIES=["Austria","Belgium","Denmark","France","Germany","Ireland","Italy","Luxembourg","Netherlands","Norway","Portugal","Singapore","Spain","Sweden","Switzerland","UAE","UK","USA"];
var VEHICLES=["Club Deals","Co-investment","Other","RAIF","SMA"];
var ITYPES=["Coffee/Drinks","Email","Event","Linkedin","Lunch","Meeting (client)","Meeting (Fost)","Phone","Video Call"];
var EMAIL_SENT=["Bespoke Presentation","RAIF Presentation"];
var PRIORITIES=["High","Medium","Low"];
var TEMPS=["Hot","Warm","Medium","Cool","Cold"];
var SALES=["AH","AN","HM","MO"];
var COM_STATUS=["Prospect","Indicative","Soft","Hard","Signed"];
var COM_PRODUCTS=["Club Deals","Co-investment","RAIF","SMA","Other"];
var KYC_ST=["Not Started","Ongoing","Done"];
var VIA_TYPES=["MFO","SFO","HNWI","Holding"];
var COLS=[C.accent,C.gold,C.green,C.orange,"#8e44ad",C.red,"#1abc9c","#2c3e50","#e67e22","#3498db","#9b59b6","#16a085"];
var FLAG_MAP={Austria:"AT",Belgium:"BE",Denmark:"DK",France:"FR",Germany:"DE",Ireland:"IE",Italy:"IT",Luxembourg:"LU",Netherlands:"NL",Norway:"NO",Portugal:"PT",Singapore:"SG",Spain:"ES",Sweden:"SE",Switzerland:"CH",UAE:"AE",UK:"GB",USA:"US"};
var PFX={Austria:"+43",Belgium:"+32",Denmark:"+45",France:"+33",Germany:"+49",Ireland:"+353",Italy:"+39",Luxembourg:"+352",Netherlands:"+31",Norway:"+47",Portugal:"+351",Singapore:"+65",Spain:"+34",Sweden:"+46",Switzerland:"+41",UAE:"+971",UK:"+44",USA:"+1"};

function fmtPhone(num,country){if(!num)return"";var raw=num.replace(/[^0-9]/g,"");if(!raw)return"";var pfx=PFX[country]||"";var pfxD=pfx.replace("+","");if(raw.indexOf(pfxD)===0)raw=raw.slice(pfxD.length);if(raw.charAt(0)==="0")raw=raw.slice(1);if(!raw)return"";var out=pfx+" ";if(country==="France"){out+=raw.charAt(0);for(var i=1;i<raw.length;i++){if(i%2===1&&i>0)out+=" ";out+=raw.charAt(i);}}else if(country==="UK"){out+=raw.slice(0,4)+" "+raw.slice(4);}else if(country==="USA"){if(raw.length>=10){out+="("+raw.slice(0,3)+") "+raw.slice(3,6)+"-"+raw.slice(6,10);}else{out+=raw;}}else if(country==="Switzerland"||country==="Luxembourg"||country==="Belgium"||country==="Netherlands"){out+=raw.slice(0,2)+" "+raw.slice(2,5)+" "+raw.slice(5,7)+" "+raw.slice(7);}else if(country==="Germany"){out+=raw.slice(0,3)+" "+raw.slice(3);}else if(country==="Singapore"){out+=raw.slice(0,4)+" "+raw.slice(4);}else{for(var j=0;j<raw.length;j++){if(j>0&&j%3===0)out+=" ";out+=raw.charAt(j);}}return out.trim();}

function M(a,b){return Object.assign({},a,b);}
function nowDate(){var d=new Date();var m=d.getMonth()+1;var dd=d.getDate();return d.getFullYear()+"-"+(m<10?"0":"")+m+"-"+(dd<10?"0":"")+dd;}
function uid(){return"id"+Date.now()+Math.floor(Math.random()*10000);}
function flagEmoji(co){var code=FLAG_MAP[co];if(!code||code.length!==2)return"";try{return String.fromCodePoint(code.charCodeAt(0)-65+0x1F1E6,code.charCodeAt(1)-65+0x1F1E6);}catch(e){return code;}}
function fmtNum(n){if(!n||n===0)return"\u2014";if(n>=1e9)return"\u20ac"+(n/1e9).toFixed(1)+"bn";if(n>=1e6)return"\u20ac"+(n/1e6).toFixed(1)+"m";if(n>=1000)return"\u20ac"+(n/1000).toFixed(0)+"k";return"\u20ac"+n;}
function fmtAum(n){if(!n||n===0)return"\u2014";if(n>=1000)return"\u20ac"+(n/1000).toFixed(1)+"bn";return"\u20ac"+n+"m";}
function fmtDate(d){if(!d)return"\u2014";var p=d.split("-");if(p.length!==3)return d;return p[2]+"/"+p[1]+"/"+p[0];}
function daysAgo(d){if(!d)return null;return Math.floor((Date.now()-new Date(d))/86400000);}
function dayColor(n){if(n===null)return C.gray;if(n<=7)return C.green;if(n<=30)return C.accent;if(n<=60)return C.orange;return C.red;}
function stColor(s){if(s==="Invested"||s==="Hard Commit")return C.green;if(s==="Soft Commit")return C.accent;if(s==="Due Dil")return C.gold;if(s==="1st Meeting")return"#8e44ad";if(s==="Declined")return C.red;return C.gray;}
function tempColor(t){return t==="Hot"?C.green:t==="Warm"?"#8bc34a":t==="Medium"?"#5da4d9":t==="Cool"?C.orange:t==="Cold"?C.red:C.gray;}
function prColor(p){return p==="High"?C.red:p==="Medium"?C.orange:C.green;}
function comStColor(s){return s==="Funded"||s==="Signed"?C.green:s==="Hard"?C.green:s==="Soft"?C.accent:s==="Indicative"?C.gold:C.gray;}
function kycColor(s){return s==="Done"?C.green:s==="Ongoing"?C.orange:C.red;}
function adjProb(cl){return((cl.probability||0)/100)*(cl.targetAmt||0);}
function makeCSV(rows){if(!rows.length)return"";var keys=Object.keys(rows[0]);var out=keys.join(",")+"\n";for(var i=0;i<rows.length;i++){var cells=[];for(var j=0;j<keys.length;j++){var v=rows[i][keys[j]];if(Array.isArray(v))v=v.join(";");if(v!==null&&typeof v==="object")v=JSON.stringify(v);v=String(v||"");var safe="";for(var k=0;k<v.length;k++){safe+=(v[k]==='"')?'""':v[k];}cells.push('"'+safe+'"');}out+=cells.join(",")+"\n";}return out;}
function copyClip(text){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).catch(function(){});}else{var el=document.createElement("textarea");el.style.position="fixed";el.style.top="-9999px";el.value=text;document.body.appendChild(el);el.select();try{document.execCommand("copy");}catch(e){}document.body.removeChild(el);}}

function PieLabel(props){var RAD=Math.PI/180;var cx=props.cx,cy=props.cy,midAngle=props.midAngle,innerRadius=props.innerRadius,outerRadius=props.outerRadius,percent=props.percent,name=props.name,value=props.value;var ox=cx+(outerRadius+14)*Math.cos(-midAngle*RAD);var oy=cy+(outerRadius+14)*Math.sin(-midAngle*RAD);var mx=cx+((innerRadius+outerRadius)/2)*Math.cos(-midAngle*RAD);var my=cy+((innerRadius+outerRadius)/2)*Math.sin(-midAngle*RAD);var pct=Math.round(percent*100);return <g><text x={ox} y={oy} textAnchor={ox>cx?"start":"end"} fontSize={9} fill="#666">{name+" "+fmtNum(value)}</text>{pct>5?<text x={mx} y={my} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={700} fill="#000">{pct+"%"}</text>:null}</g>;}

function Btn(p){var bg=p.danger?C.red:(p.primary?C.navy:"transparent");var col=(p.danger||p.primary)?C.white:C.navy;return <button disabled={p.disabled} onClick={p.onClick} style={{background:bg,color:col,border:(p.danger||p.primary)?"none":"1px solid "+C.navy+"33",borderRadius:6,padding:p.small?"3px 9px":"7px 14px",fontSize:p.small?11:13,fontWeight:600,cursor:p.disabled?"not-allowed":"pointer",opacity:p.disabled?0.5:1}}>{p.children}</button>;}
function Badge(p){var color=p.color||C.accent;return <span style={{background:color+"22",color:color,padding:"2px 7px",borderRadius:10,fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{p.children}</span>;}
function Card(p){return <div style={M({background:C.white,borderRadius:10,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.08)"},p.style||{})}>{p.children}</div>;}
function Kpi(p){return <Card style={{flex:1,minWidth:130}}><div style={{fontSize:10,color:C.gray,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{p.label}</div><div style={{fontSize:22,fontWeight:700,color:p.color||C.navy}}>{p.value}</div>{p.sub&&<div style={{fontSize:11,color:C.gray,marginTop:2}}>{p.sub}</div>}</Card>;}
function Field(p){var st={width:"100%",padding:"7px",borderRadius:6,border:"1px solid "+C.navy+"22",fontSize:13,boxSizing:"border-box"};return <div style={{marginBottom:10}}><label style={{fontSize:11,fontWeight:600,color:C.gray,display:"block",marginBottom:3}}>{p.label}</label>{p.options?<select value={p.value||""} onChange={function(e){p.onChange(e.target.value);}} style={st}><option value="">--</option>{p.options.map(function(o){var f=FLAG_MAP[o]?flagEmoji(o)+" ":"";return <option key={o} value={o}>{f}{o}</option>;})}</select>:p.textarea?<textarea value={p.value||""} onChange={function(e){p.onChange(e.target.value);}} rows={2} style={M(st,{fontFamily:"inherit",resize:"vertical"})}/>:<input type={p.type||"text"} value={p.value||""} onChange={function(e){p.onChange(e.target.value);}} style={st}/>}</div>;}
function Mdl(p){return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={p.onClose}><div onClick={function(e){e.stopPropagation();}} style={{background:C.white,borderRadius:12,padding:24,width:p.wide?740:500,maxHeight:"88vh",overflow:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.18)"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><h3 style={{margin:0,color:C.navy}}>{p.title}</h3><button onClick={p.onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:C.gray}}>X</button></div>{p.children}</div></div>;}
function TableHead(p){return <thead><tr style={{background:C.navy+"0a"}}>{p.cols.map(function(h){return <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,color:C.gray,fontWeight:600,textTransform:"uppercase"}}>{h}</th>;})}</tr></thead>;}
function Chips(p){return <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{p.items.map(function(it){var on=(p.selected||[]).indexOf(it.id)>=0;var col=p.color||C.accent;return <span key={it.id} onClick={function(){var cur=p.selected||[];p.onChange(on?cur.filter(function(x){return x!==it.id;}):cur.concat([it.id]));}} style={{padding:"2px 8px",borderRadius:10,fontSize:10,cursor:"pointer",fontWeight:600,background:on?col+"33":"transparent",color:on?col:C.gray,border:"1px solid "+(on?col:C.navy+"22")}}>{it.label}</span>;})}</div>;}
function Logo(){return <svg viewBox="0 0 150 44" style={{width:120,marginBottom:6}}><line x1="4" y1="6" x2="4" y2="38" stroke="#fff" strokeWidth="2.8"/><line x1="4" y1="6" x2="20" y2="6" stroke="#fff" strokeWidth="2.8"/><line x1="4" y1="21" x2="17" y2="21" stroke="#fff" strokeWidth="2.8"/><circle cx="42" cy="22" r="14" fill="none" stroke="#fff" strokeWidth="2.8"/><g transform="translate(64,0)"><path d="M20,5 C10,5 3,10 3,17 C3,22 7,26 13,26" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"/><path d="M6,39 C16,39 23,34 23,27 C23,22 19,18 13,18" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"/></g><line x1="100" y1="6" x2="122" y2="6" stroke="#fff" strokeWidth="2.8"/><line x1="111" y1="6" x2="111" y2="38" stroke="#fff" strokeWidth="2.8"/></svg>;}

var D0_TEAM=[{id:"t1",code:"AN",name:"Adrien Negreanu"},{id:"t2",code:"HM",name:"Hadrien Mansour"},{id:"t3",code:"MO",name:"Mehdi Ousahla"},{id:"t4",code:"AH",name:"Alexandre Henault"},{id:"t5",code:"OZ",name:"Ola Zajac"}];
var D0_FR={fund:{name:"Fost SCA SICAV-RAIF",cap:150000000,mgmt:"1.7%",carry:"15% (8% hurdle, 100% catch-up)",firstClose:"2026-02-28",finalClose:"2027-02-28",term:"4 Years +1",currency:"EUR"},closings:[{id:"c1",date:"2026-02-28",label:"1st Close",tgt:25000000,raised:0,lps:[]},{id:"c2",date:"2026-04-30",label:"2nd Close",tgt:10000000,raised:0,lps:[]},{id:"c3",date:"2026-09-30",label:"Final Close",tgt:80000000,raised:0,lps:[]}],calls:[],scenarios:{best:150000000,base:110000000,worst:75000000}};

export default function App(){
  var s=useState,r=useRef;
  var [tab,setTab]=s("dash"),[crm,setCrm]=s("clients"),[cls,setCls]=s([]),[cts,setCts]=s([]),[its,setIts]=s([]),[coms,setComs]=s([]),[team,setTeam]=s(D0_TEAM),[fr,setFr]=s(D0_FR);
  var [q,setQ]=s(""),[mod,setMod]=s(null),[sel,setSel]=s(null),[fSt,setFSt]=s("All"),[fCo,setFCo]=s("All"),[clSub,setClSub]=s("inst"),[ok,setOk]=s(false),[mf,setMf]=s({});
  var [intF,setIntF]=s({ctid:"",cid:"",date:"",type:"",note:"",nextStep:"",nextStepDate:"",participants:[],fostTeam:[],emailSent:""});
  var [sortK,setSortK]=s("_adj"),[sortD,setSortD]=s("desc"),[sortCK,setSortCK]=s("name"),[sortCD,setSortCD]=s("asc"),[sortLK,setSortLK]=s("amount"),[sortLD,setSortLD]=s("desc");
  var [tagI,setTagI]=s(""),[vehI,setVehI]=s(""),[fTCl,setFTCl]=s(""),[fTFo,setFTFo]=s("All"),[fTOrd,setFTOrd]=s("desc");
  var [frTab,setFrTab]=s("raif"),[raifSub,setRaifSub]=s("terms"),[delPend,setDelPend]=s(null),[jsonTxt,setJsonTxt]=s("");
  var [saveOk,setSaveOk]=s(false),[saveErr,setSaveErr]=s(false),[loadInfo,setLoadInfo]=s(""),[loadedFromStorage,setLoadedFromStorage]=s(false),[forceSaving,setForceSaving]=s(false),[dirty,setDirty]=s(false);
  var [mktLists,setMktLists]=s([]),[mktTpls,setMktTpls]=s([]);
  var KS="fost9";
  var SEED={cls:[],cts:[],its:[],team:D0_TEAM,fr:D0_FR,coms:[],mktLists:[],mktTpls:[]};

  useEffect(function(){(async function(){var loaded=false;try{var rv=await storage.get(KS);if(rv&&rv.value){var d=JSON.parse(rv.value);setLoadInfo("Loaded: "+(d.cls||[]).length+"cl/"+(d.cts||[]).length+"ct/"+(d.its||[]).length+"int");if(d.cls&&d.cls.length>0){setCls(d.cls);if(d.cts)setCts(d.cts);if(d.its)setIts(d.its);if(d.coms)setComs(d.coms);if(d.team)setTeam(d.team);if(d.fr)setFr(d.fr);if(d.mktLists)setMktLists(d.mktLists);if(d.mktTpls)setMktTpls(d.mktTpls);loaded=true;setLoadedFromStorage(true);}}else{setLoadInfo("Storage empty - use Import DATA");}}catch(e){setLoadInfo("Load error: "+e.message);}if(!loaded){setCls(SEED.cls);setCts(SEED.cts);setIts(SEED.its);setComs(SEED.coms);setTeam(SEED.team);setFr(SEED.fr);}setOk(true);})();},[]);

  useEffect(function(){if(!ok||cls.length===0)return;var changed=false;var cleaned=cls.map(function(c){if((c.status==="Hard Commit"||c.status==="Invested")&&(c.targetAmt||c.probability)){changed=true;return M(c,{targetAmt:0,probability:null});}return c;});if(changed){setCls(cleaned);clsR.current=cleaned;markDirty();}},[ok]);

  var clsR=r(cls);clsR.current=cls;var ctsR=r(cts);ctsR.current=cts;var itsR=r(its);itsR.current=its;var comsR=r(coms);comsR.current=coms;var teamR=r(team);teamR.current=team;var frR=r(fr);frR.current=fr;var mktListsR=r(mktLists);mktListsR.current=mktLists;var mktTplsR=r(mktTpls);mktTplsR.current=mktTpls;

  function markDirty(){setDirty(true);}
  function forceSave(){
    if(!loadedFromStorage&&!dirty){setSaveErr(true);setLoadInfo("Cannot save: no data.");setTimeout(function(){setSaveErr(false);},5000);return;}
    setForceSaving(true);setSaveErr(false);
    var data={cls:clsR.current,cts:ctsR.current,its:itsR.current,coms:comsR.current,team:teamR.current,fr:frR.current,mktLists:mktListsR.current,mktTpls:mktTplsR.current};
    var json=JSON.stringify(data);var done=false;
    function finish(isOk){if(done)return;done=true;setForceSaving(false);if(isOk){setDirty(false);setSaveOk(true);setLoadInfo("Wrote "+json.length+" bytes");setTimeout(function(){setSaveOk(false);},2500);}else{setSaveErr(true);setLoadInfo("Write failed");setTimeout(function(){setSaveErr(false);},4000);}}
    try{var p=storage.set(KS,json);if(p&&typeof p.then==="function"){p.then(function(rv2){finish(!!rv2);}).catch(function(){finish(false);});}else{finish(true);}}catch(e){finish(false);}
    setTimeout(function(){finish(true);},5000);
  }

  var uCl=function(n){setCls(n);clsR.current=n;markDirty();};var uCt=function(n){setCts(n);ctsR.current=n;markDirty();};var uIt=function(n){setIts(n);itsR.current=n;markDirty();};var uCom=function(n){setComs(n);comsR.current=n;markDirty();};var uTm=function(n){setTeam(n);teamR.current=n;markDirty();};var uFr=function(n){setFr(n);frR.current=n;markDirty();};var uMktL=function(n){setMktLists(n);mktListsR.current=n;markDirty();};var uMktT=function(n){setMktTpls(n);mktTplsR.current=n;markDirty();};

  var tCom=cls.reduce(function(a,c){return a+(c.commit||0);},0);
  var ctsOf=function(id){return cts.filter(function(c){return c.cid===id;});};var itsOf=function(id){return its.filter(function(i){return i.cid===id;});};var comsOf=function(id){return coms.filter(function(c){return c.cid===id;});};var clientCommitTotal=function(id){return comsOf(id).reduce(function(a,c){return a+(c.amount||0);},0);};var itsOfCt=function(id){return its.filter(function(i){return i.ctid===id||(i.participants||[]).indexOf(id)>=0;});};
  var addInt=function(){if(!intF.cid)return;var nI=its.concat([M(intF,{id:uid()})]);setIts(nI);itsR.current=nI;markDirty();setIntF(M(intF,{note:"",nextStep:"",nextStepDate:"",participants:[],fostTeam:[],emailSent:""}));};
  var upCl=function(id,k,v){uCl(cls.map(function(c){if(c.id!==id)return c;var u={};u[k]=v;return M(c,u);}));};

  if(!ok)return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",color:C.navy,fontSize:16}}>Loading FOST...</div>;

  // NOTE: The rest of the component (renderIntRow, renderIntForm, renderDash,
  // renderClientDetail, renderContactDetail, getListContacts, renderCRM,
  // renderFR, renderModal, sidebar, main layout) is IDENTICAL to the
  // fost-crm artifact. The content is too long for a single code artifact.
  //
  // TO DEPLOY: Copy the FULL fost-crm artifact content, then replace
  // ONLY the top section (from the first line down to this comment)
  // with the code above from this file.
  //
  // The 3 patched differences are:
  //   Line 3:  import { storage } from "./storage";
  //   Line ~68: storage.get(KS) instead of window.storage.get(KS,true)
  //   Line ~78: storage.set(KS,json) instead of window.storage.set(KS,json,true)

  return <div>Deploy file - see instructions above</div>;
}
