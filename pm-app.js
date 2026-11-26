const $=id=>document.getElementById(id),C=PMCalc;
const AR='٠١٢٣٤٥٦٧٨٩',PR='۰۱۲۳۴۵۶۷۸۹';
const CUR='ج.م';
const fmt=(n,d=2)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:d,minimumFractionDigits:0}).format(n);
const money=n=>fmt(n)+' '+CUR;
const pct=n=>fmt(n*100,2)+'%';
function parse(id){let s=$(id).value.trim();if(!s)return null;
 s=s.replace(/[٠-٩]/g,d=>AR.indexOf(d)).replace(/[۰-۹]/g,d=>PR.indexOf(d)).replace(/[,٬\s]/g,'').replace(/[٫]/g,'.');
 const n=Number(s);return Number.isFinite(n)?n:NaN}
function group(s){s=String(s).replace(/[٠-٩]/g,d=>AR.indexOf(d)).replace(/[۰-۹]/g,d=>PR.indexOf(d)).replace(/[٫]/g,'.').replace(/[^0-9.]/g,'');
 const i=s.indexOf('.');let ip=i<0?s:s.slice(0,i),dp=i<0?null:s.slice(i+1).replace(/\./g,'');
 ip=ip.replace(/^0+(?=\d)/,'').replace(/\B(?=(\d{3})+(?!\d))/g,',');return dp===null?ip:ip+'.'+dp}
function liveFormat(e){const el=e.target,pos=el.selectionStart,before=el.value.slice(0,pos).replace(/[^0-9٠-٩۰-۹.٫]/g,'').length;
 const v=group(el.value);if(v===el.value)return;el.value=v;let n=0,p=0;while(p<v.length&&n<before){if(/[0-9.]/.test(v[p]))n++;p++}try{el.setSelectionRange(p,p)}catch(_){}}
['afArea','afBuy','afCur','dfAmount','dlPrice','dlTarget','dlCommVal'].forEach(id=>{const el=$(id);el.addEventListener('input',liveFormat);el.setAttribute('autocomplete','off')});
const esc=s=>String(s==null?'':s).replace(/</g,'&lt;');
// data
const KEY='pm-data-v1';
let DB={clients:[],assets:[],deposits:[],deals:[]};
try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&d.clients)DB=d}catch(_){}
const save=()=>localStorage.setItem(KEY,JSON.stringify(DB));
const nid=p=>p+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36);
const client=id=>DB.clients.find(c=>c.id===id);
const clientName=id=>{const c=client(id);return c?c.name:'عميل محذوف'};
const today=()=>new Date().toISOString().slice(0,10);
const dateTs=s=>{const t=Date.parse(s);return Number.isFinite(t)?t:0};
// tabs
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('nav button,main>section').forEach(x=>x.classList.remove('on'));
 b.classList.add('on');$(b.dataset.t).classList.add('on');scrollTo(0,0);
 if(b.dataset.t==='d')renderDash();if(b.dataset.t==='m')renderComm();});
// theme
function setTheme(t){document.documentElement.dataset.theme=t;try{localStorage.setItem('pm-theme',t)}catch(_){}$('theme').textContent=t==='dark'?'☀️':'🌙';document.querySelector('meta[name=theme-color]').content=t==='dark'?'#0A1222':'#0F1B33'}
$('theme').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
setTheme(document.documentElement.dataset.theme||'light');
const row=(n,v,cls)=>`<div class="m"><span class="n">${n}</span><span class="val ${cls||''}">${v}</span></div>`;
const rowNA=(n,v)=>`<div class="m"><span class="n">${n}</span><span class="na">${v}</span></div>`;
// ===== dashboard =====
function renderDash(){
 const t=C.dashboard(DB),box=$('dbody');
 const now=new Date(),mStart=new Date(now.getFullYear(),now.getMonth(),1).getTime();
 const yStart=new Date(now.getFullYear(),0,1).getTime();
 const m=C.inRange(DB,mStart,now.getTime()+864e5),y=C.inRange(DB,yStart,now.getTime()+864e5);
 if(!DB.clients.length){box.innerHTML=`<div class="hero"><div class="k">أهلا بيك</div><div class="v" style="font-size:22px">ابدأ من تاب "العملاء"</div></div><div class="card"><p class="note" style="text-align:center;padding:14px">ضيف عميلك الأول، وبعده سجل أملاكه ودفعاته الكاش، ومع كل صفقة بيع أو شراء البرنامج يحسب عمولتك والأوفر برايس لوحده.</p></div>`;return}
 let byToRows=Object.keys(t.byTo).map(k=>row('عمولة: '+esc(k),money(t.byTo[k]))).join('');
 box.innerHTML=`
 <div class="hero"><div class="k">إجمالي المحافظ (أصول + كاش)</div><div class="v">${money(t.total)}</div>
  <div class="sub"><div><span>قيمة الأصول القائمة</span><b>${money(t.assetsValue)}</b></div><div><span>الكاش المتاح</span><b>${money(t.cash)}</b></div>
  <div><span>العملاء</span><b>${t.clients}</b></div><div><span>الأصول القائمة</span><b>${t.assetsCount}</b></div></div></div>
 <div class="card"><h2>عمولاتك وأوفر برايس</h2>
  ${row('إجمالي العمولات',money(t.commissions),'gold')}
  ${row('إجمالي الأوفر برايس',money(t.overs),'gold')}
  ${row('عمولات الشهر ده',money(m.comm))}
  ${row('عمولات السنة دي',money(y.comm))}
  ${byToRows||''}
  ${row('عدد الصفقات المسجلة',fmt(t.dealsCount))}
 </div>
 <div class="card"><h2>ملخص كل عميل</h2>${DB.clients.map(c=>{const x=C.clientTotals(DB,c.id);
  return `<div class="item"><div class="top"><span class="nm"><a href="#" data-open="${c.id}">${esc(c.name)}</a></span><b>${money(x.total)}</b></div>
  <div class="meta">أصول ${x.assetsCount} · كاش ${money(x.cash)} · صفقات ${x.dealsCount}</div></div>`}).join('')||'<div class="empty">لا يوجد عملاء بعد</div>'}</div>`;
}
$('dbody').onclick=e=>{const o=e.target.dataset.open;if(o){e.preventDefault();openClient(o)}};
// export / import
$('export').onclick=()=>{const b=new Blob([JSON.stringify(DB,null,1)],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='portfolio-backup-'+today()+'.json';document.body.appendChild(a);a.click();a.remove()};
$('import').onclick=()=>$('importFile').click();
$('importFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
 r.onload=()=>{try{const d=JSON.parse(r.result);if(!d||!Array.isArray(d.clients))throw 0;
  if(confirm('الاستيراد هيستبدل كل البيانات الحالية. متأكد؟')){DB={clients:d.clients||[],assets:d.assets||[],deposits:d.deposits||[],deals:d.deals||[]};save();renderDash();renderClients();renderComm();alert('تم الاستيراد')}}catch(_){alert('ملف غير صالح')}};
 r.readAsText(f);e.target.value=''};
// ===== clients =====
function renderClients(){
 $('clist').innerHTML=DB.clients.length?DB.clients.map(c=>{const x=C.clientTotals(DB,c.id);
  return `<div class="item"><div class="top"><span class="nm"><a href="#" data-open="${c.id}">${esc(c.name)}</a></span><b>${money(x.total)}</b></div>
  <div class="meta">${c.phone?esc(c.phone)+' · ':''}أصول ${x.assetsCount} · كاش ${money(x.cash)}</div>
  <div class="tools"><button data-edit="${c.id}">تعديل</button><button class="del" data-del="${c.id}">حذف</button></div></div>`}).join('')
  :'<div class="empty">لا يوجد عملاء بعد. ضيف أول عميل من الفورم فوق.</div>'}
$('clist').onclick=e=>{const o=e.target.dataset.open,ed=e.target.dataset.del,ee=e.target.dataset.edit;
 if(o){e.preventDefault();openClient(o);return}
 if(ee){const c=client(ee);$('cfId').value=c.id;$('cfName').value=c.name;$('cfPhone').value=c.phone||'';$('cfNotes').value=c.notes||'';
  $('cformTitle').textContent='تعديل عميل';$('cfCancel').style.display='';scrollTo(0,0);return}
 if(ed){const x=C.clientTotals(DB,ed);
  if(x.assetsCount||x.dealsCount||x.deposits){alert('العميل ده عليه أصول أو حركات. امسحها الأول عشان تمسح العميل.');return}
  if(confirm('حذف العميل ده؟')){DB.clients=DB.clients.filter(c=>c.id!==ed);save();renderClients();renderDash()}}};
$('cfCancel').onclick=()=>{$('cfId').value='';$('cfName').value='';$('cfPhone').value='';$('cfNotes').value='';$('cformTitle').textContent='إضافة عميل';$('cfCancel').style.display='none'};
$('cfSave').onclick=()=>{const n=$('cfName').value.trim();if(!n){$('perr').innerHTML='<div class="err">اكتب اسم العميل.</div>';return}$('perr').innerHTML='';
 const id=$('cfId').value;
 if(id){const c=client(id);c.name=n;c.phone=$('cfPhone').value.trim();c.notes=$('cfNotes').value.trim()}
 else DB.clients.push({id:nid('c'),name:n,phone:$('cfPhone').value.trim(),notes:$('cfNotes').value.trim()});
 save();$('cfCancel').onclick();renderClients();renderDash()};
// ===== client detail =====
let CUR_C=null;
function openClient(id){CUR_C=id;$('plistView').style.display='none';$('pdetailView').style.display='';
 document.querySelector('nav [data-t=p]').click();renderDetail();scrollTo(0,0)}
$('backToList').onclick=()=>{CUR_C=null;$('pdetailView').style.display='none';$('plistView').style.display='';renderClients()};
const STATUS={active:'مملوك',sale:'معروض للبيع',sold:'مباع'},SCLASS={active:'b-act',sale:'b-sale',sold:'b-sold'};
function renderDetail(){
 const c=client(CUR_C);if(!c)return $('backToList').onclick();
 const x=C.clientTotals(DB,CUR_C);
 $('pdetail').innerHTML=`<div class="hero"><div class="k">${esc(c.name)}${c.phone?' · '+esc(c.phone):''}</div><div class="v">${money(x.total)}</div>
  <div class="sub"><div><span>قيمة الأصول</span><b>${money(x.assetsValue)}</b></div><div><span>الكاش</span><b>${money(x.cash)}</b></div>
  <div><span>عمولات من صفقاته</span><b>${money(x.commissions)}</b></div><div><span>أوفر برايس</span><b>${money(x.overs)}</b></div></div></div>`;
 // assets list
 const assets=DB.assets.filter(a=>a.cid===CUR_C);
 $('alist').innerHTML=assets.length?assets.map(a=>{const v=a.curValue!=null?a.curValue:a.buyPrice;
  return `<div class="item"><div class="top"><span class="nm">${esc(a.name)}<span class="badge ${SCLASS[a.status]}">${STATUS[a.status]}</span></span><b>${v!=null?money(v):'—'}</b></div>
  <div class="meta">${esc(a.type)}${a.area?' · '+fmt(a.area)+' م²':''}${a.loc?' · '+esc(a.loc):''}${a.buyPrice!=null?' · شراء '+money(a.buyPrice):''}${a.buyDate?' · '+a.buyDate:''}</div>
  ${a.notes?`<div class="meta">${esc(a.notes)}</div>`:''}
  <div class="tools"><button data-aedit="${a.id}">تعديل</button><button class="del" data-adel="${a.id}">حذف</button></div></div>`}).join('')
  :'<div class="empty">لا توجد أصول مسجلة للعميل ده.</div>';
 // deals + deposits merged timeline
 const items=[...DB.deposits.filter(d=>d.cid===CUR_C).map(d=>({t:dateTs(d.date),k:'dep',d})),
              ...DB.deals.filter(d=>d.cid===CUR_C).map(d=>({t:dateTs(d.date),k:'deal',d}))].sort((a,b)=>b.t-a.t);
 $('dlist').innerHTML=items.length?items.map(it=>{
  if(it.k==='dep'){const d=it.d;return `<div class="item"><div class="top"><span class="nm">دفعة كاش<span class="badge b-dep">إيداع</span></span><b class="pos">+${money(d.amount)}</b></div>
   <div class="meta">${d.date}${d.note?' · '+esc(d.note):''}</div>
   <div class="tools"><button class="del" data-depdel="${d.id}">حذف</button></div></div>`}
  const d=it.d,cc=C.dealCalc(d),sell=d.kind==='sell';
  return `<div class="item"><div class="top"><span class="nm">${esc(d.assetName||'صفقة')}<span class="badge ${sell?'b-sell':'b-buy'}">${sell?'بيع':'شراء'}</span></span><b>${money(d.price)}</b></div>
  <div class="meta">${d.date} · ${sell?'صافي العميل '+money(cc.clientNet):'إجمالي الخارج '+(cc.clientNet!=null?money(cc.clientNet):'—')}</div>
  <div class="nums">${cc.commission!=null?`<span>عمولة (${esc(d.commTo||'أنا')}): <b>${money(cc.commission)}</b></span>`:''}${cc.over?`<span>أوفر برايس: <b class="gold">${money(cc.over)}</b></span>`:''}${d.target!=null?`<span>المطلوب: <b>${money(d.target)}</b></span>`:''}</div>
  ${d.notes?`<div class="meta">${esc(d.notes)}</div>`:''}
  <div class="tools"><button class="del" data-dldel="${d.id}">حذف</button></div></div>`}).join('')
  :'<div class="empty">لا توجد دفعات أو صفقات بعد.</div>';
 fillDealAssets();
}
// ===== assets form =====
$('afCancel').onclick=()=>{$('afId').value='';['afName','afArea','afLoc','afBuy','afCur','afNotes'].forEach(i=>$(i).value='');$('afBuyDate').value='';$('afStatus').value='active';$('afType').selectedIndex=0;$('aformTitle').textContent='إضافة أصل (عقار)';$('afCancel').style.display='none'};
$('afSave').onclick=()=>{const n=$('afName').value.trim();if(!n)return alert('اكتب اسم الأصل');
 const o={name:n,type:$('afType').value,status:$('afStatus').value,area:parse('afArea'),loc:$('afLoc').value.trim(),
  buyPrice:parse('afBuy'),buyDate:$('afBuyDate').value||'',curValue:parse('afCur'),notes:$('afNotes').value.trim()};
 for(const k of['area','buyPrice','curValue'])if(Number.isNaN(o[k]))return alert('رقم غير صالح في الأسعار أو المساحة');
 const id=$('afId').value;
 if(id){Object.assign(DB.assets.find(a=>a.id===id),o)}else DB.assets.push(Object.assign({id:nid('a'),cid:CUR_C},o));
 save();$('afCancel').onclick();renderDetail();renderDash()};
// ===== deposit =====
$('dfDate').value=today();
$('dfSave').onclick=()=>{const a=parse('dfAmount');if(a==null||Number.isNaN(a)||!(a>0))return alert('اكتب مبلغ الدفعة');
 DB.deposits.push({id:nid('d'),cid:CUR_C,date:$('dfDate').value||today(),amount:a,note:$('dfNote').value.trim()});
 save();$('dfAmount').value='';$('dfNote').value='';renderDetail();renderDash()};
// ===== deal form =====
$('dlDate').value=today();
function fillDealAssets(){const sell=$('dlKind').value==='sell';
 $('dlAssetBox').style.display=sell?'':'none';$('dlNewBox').style.display=sell?'none':'';
 $('dlTargetBox').style.display=sell?'':'none';
 $('dlPriceLbl').textContent=sell?'سعر البيع الفعلي':'سعر الشراء';
 const list=DB.assets.filter(a=>a.cid===CUR_C&&a.status!=='sold');
 $('dlAsset').innerHTML='<option value="">— اختياري، اختار أصل مسجل —</option>'+list.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}
document.querySelectorAll('#dlKindChips button').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('#dlKindChips button').forEach(x=>x.classList.toggle('on',x===b));
 $('dlKind').value=b.dataset.k;fillDealAssets();previewDeal()});
function previewDeal(){const box=$('dlCalc');box.textContent='';
 const price=parse('dlPrice');if(price==null||Number.isNaN(price))return;
 const d={kind:$('dlKind').value,price,target:parse('dlTarget'),commType:$('dlCommType').value,commVal:parse('dlCommVal')};
 const c=C.dealCalc(d),parts=[];
 if(c.commission!=null)parts.push('العمولة: '+money(c.commission));
 if($('dlKind').value==='sell'){
  if(c.over)parts.push('الأوفر برايس: '+money(c.over));
  if(c.clientNet!=null)parts.push('صافي العميل: '+money(c.clientNet));
 }else if(c.clientNet!=null)parts.push('إجمالي الخارج من كاش العميل: '+money(c.clientNet));
 box.textContent=parts.join('  |  ')}
['dlPrice','dlTarget','dlCommVal'].forEach(id=>$(id).addEventListener('input',previewDeal));
$('dlCommType').onchange=previewDeal;$('dlAsset').onchange=previewDeal;
$('dlSave').onclick=()=>{const kind=$('dlKind').value,price=parse('dlPrice');
 if(price==null||Number.isNaN(price)||!(price>0)){$('dlerr').innerHTML='<div class="err">اكتب سعر الصفقة بشكل صحيح.</div>';return}
 const target=parse('dlTarget'),commVal=parse('dlCommVal');
 if(Number.isNaN(target)||Number.isNaN(commVal)){$('dlerr').innerHTML='<div class="err">رقم غير صالح في السعر المطلوب أو العمولة.</div>';return}
 let assetId=$('dlAsset').value||'',assetName='';
 if(kind==='sell'&&assetId){const a=DB.assets.find(x=>x.id===assetId);assetName=a?a.name:'';a.status='sold';a.curValue=price}
 if(kind==='buy'){assetName=$('dlNewName').value.trim();
  if(assetName){const na={id:nid('a'),cid:CUR_C,name:assetName,type:'أخرى',status:'active',area:null,loc:'',buyPrice:price,buyDate:$('dlDate').value||today(),curValue:null,notes:''};DB.assets.push(na);assetId=na.id}}
 if(!assetName&&assetId){const a=DB.assets.find(x=>x.id===assetId);assetName=a?a.name:''}
 DB.deals.push({id:nid('x'),cid:CUR_C,kind,assetId,assetName,price,target,commType:$('dlCommType').value,commVal,
  commTo:$('dlCommTo').value.trim()||'أنا',date:$('dlDate').value||today(),dateTs:dateTs($('dlDate').value||today()),notes:$('dlNotes').value.trim()});
 save();$('dlerr').innerHTML='';['dlPrice','dlTarget','dlCommVal','dlNewName','dlNotes'].forEach(i=>$(i).value='');$('dlAsset').value='';$('dlCalc').textContent='';
 renderDetail();renderDash();renderComm()};
// ===== asset/deposit/deal list actions =====
$('alist').onclick=e=>{const ed=e.target.dataset.aedit,dl=e.target.dataset.adel;
 if(ed){const a=DB.assets.find(x=>x.id===ed);$('afId').value=a.id;$('afName').value=a.name;$('afType').value=a.type;$('afStatus').value=a.status;
  $('afArea').value=a.area!=null?group(a.area):'';$('afLoc').value=a.loc||'';$('afBuy').value=a.buyPrice!=null?group(a.buyPrice):'';
  $('afBuyDate').value=a.buyDate||'';$('afCur').value=a.curValue!=null?group(a.curValue):'';$('afNotes').value=a.notes||'';
  $('aformTitle').textContent='تعديل أصل';$('afCancel').style.display='';$('afName').scrollIntoView()}
 if(dl&&confirm('حذف الأصل ده؟')){DB.assets=DB.assets.filter(x=>x.id!==dl);save();renderDetail();renderDash()}};
$('dlist').onclick=e=>{const dd=e.target.dataset.depdel,xd=e.target.dataset.dldel;
 if(dd&&confirm('حذف الدفعة دي؟')){DB.deposits=DB.deposits.filter(x=>x.id!==dd);save();renderDetail();renderDash()}
 if(xd&&confirm('حذف الصفقة دي؟ (حالة الأصل مش هترجع تلقائيا)')){DB.deals=DB.deals.filter(x=>x.id!==xd);save();renderDetail();renderDash();renderComm()}};
// ===== commissions tab =====
let MF='all';
function renderComm(){
 const ppl=[...new Set(DB.deals.filter(d=>C.dealCalc(d).commission).map(d=>d.commTo||'غير محدد'))];
 $('mfilter').innerHTML=['all',...ppl].map(p=>`<button data-p="${esc(p)}" class="${p===MF?'on':''}">${p==='all'?'الكل':esc(p)}</button>`).join('');
 const ds=DB.deals.filter(d=>MF==='all'||(d.commTo||'غير محدد')===MF).sort((a,b)=>(b.dateTs||0)-(a.dateTs||0));
 let tc=0,to=0;ds.forEach(d=>{const c=C.dealCalc(d);tc+=c.commission||0;to+=c.over||0});
 $('mbody').innerHTML=`<div class="hero"><div class="k">إجمالي العمولات</div><div class="v">${money(tc)}</div><div class="sub"><div><span>أوفر برايس</span><b>${money(to)}</b></div><div><span>عدد الصفقات</span><b>${ds.length}</b></div></div></div>
 <div class="card"><h2>تفاصيل</h2>${ds.map(d=>{const c=C.dealCalc(d);return `<div class="item"><div class="top"><span class="nm">${esc(d.assetName||'صفقة')} <span class="badge ${d.kind==='sell'?'b-sell':'b-buy'}">${d.kind==='sell'?'بيع':'شراء'}</span></span><b>${c.commission!=null?money(c.commission):'—'}</b></div>
 <div class="meta">${esc(clientName(d.cid))} · ${d.date} · لـ ${esc(d.commTo||'أنا')}${c.over?' · أوفر '+money(c.over):''}</div></div>`}).join('')||'<div class="empty">لا توجد صفقات.</div>'}</div>`}
$('mfilter').onclick=e=>{if(e.target.dataset.p!=null){MF=e.target.dataset.p;renderComm()}};
// ===== share image =====
$('shareimg').onclick=()=>{const t=C.dashboard(DB),W=1080,rows=[['قيمة الأصول',money(t.assetsValue)],['الكاش المتاح',money(t.cash)],['إجمالي العمولات',money(t.commissions)],['إجمالي الأوفر برايس',money(t.overs)],['العملاء',String(t.clients)],['الصفقات',String(t.dealsCount)]];
 const H=420+rows.length*84+100,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
 const F='-apple-system,"SF Arabic","Segoe UI",Tahoma,Arial,sans-serif';c.direction='rtl';
 c.fillStyle='#F3F5F9';c.fillRect(0,0,W,H);const g=c.createLinearGradient(0,0,W,380);g.addColorStop(0,'#0F1B33');g.addColorStop(1,'#17294A');c.fillStyle=g;c.fillRect(0,0,W,380);
 c.textAlign='right';c.fillStyle='#fff';c.font='700 46px '+F;c.fillText('ملخص المحافظ العقارية',W-64,100);
 c.fillStyle='#B9C3D9';c.font='30px '+F;c.fillText('إجمالي المحافظ',W-64,236);
 c.fillStyle='#D4AD36';c.font='800 80px '+F;c.fillText(money(t.total),W-64,330);
 let y=420;rows.forEach((r,n)=>{c.fillStyle=n%2?'#F3F5F9':'#fff';c.fillRect(32,y-52,W-64,84);c.fillStyle='#14213D';c.textAlign='right';c.font='32px '+F;c.fillText(r[0],W-64,y);c.textAlign='left';c.direction='ltr';c.font='700 32px '+F;c.fillText(r[1],64,y);c.direction='rtl';y+=84});
 cv.toBlob(async b=>{const f=new File([b],'portfolio-summary.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f]})}catch(_){}}
  else{const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='portfolio-summary.png';document.body.appendChild(a);a.click();a.remove()}},'image/png')};
renderDash();renderClients();
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js');
