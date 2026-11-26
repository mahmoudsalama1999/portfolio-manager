// إدارة المحافظ العقارية — حسابات نقية (بدون واجهة) قابلة للاختبار
const PMCalc=(()=>{

// حساب صفقة واحدة: العمولة والأوفر برايس وصافي العميل
// d: {kind:'buy'|'sell', price, target?, overprice?, commType:'pct'|'fixed'|'', commVal?}
function dealCalc(d){
 const S=d.price;
 let commission=null;
 if(S!=null&&Number.isFinite(S)&&d.commVal!=null&&Number.isFinite(d.commVal)){
  commission=d.commType==='pct'?S*d.commVal/100:d.commVal;
 }
 let over=null;
 if(d.kind==='sell'){
  if(d.overprice!=null&&Number.isFinite(d.overprice))over=d.overprice;
  else if(S!=null&&Number.isFinite(S)&&d.target!=null&&Number.isFinite(d.target)&&S>d.target)over=S-d.target;
 }
 let clientNet=null;
 if(S!=null&&Number.isFinite(S)){
  clientNet=d.kind==='sell'?S-(commission||0)-(over||0):S+(commission||0);
 }
 return {commission,over,clientNet};
}

const val=a=>{const v=a.curValue!=null&&Number.isFinite(a.curValue)?a.curValue:a.buyPrice;return v!=null&&Number.isFinite(v)?v:0};

// إجماليات عميل واحد
function clientTotals(db,cid){
 const assets=db.assets.filter(a=>a.cid===cid&&a.status!=='sold');
 const soldCount=db.assets.filter(a=>a.cid===cid&&a.status==='sold').length;
 const assetsValue=assets.reduce((s,a)=>s+val(a),0);
 const deposits=db.deposits.filter(x=>x.cid===cid).reduce((s,x)=>s+(x.amount||0),0);
 let cashSales=0,cashBuys=0,commissions=0,overs=0,dealsCount=0;
 const byTo={};
 for(const d of db.deals.filter(x=>x.cid===cid)){
  const c=dealCalc(d);
  if(c.clientNet!=null){if(d.kind==='sell')cashSales+=c.clientNet;else cashBuys+=c.clientNet;dealsCount++}
  if(c.commission){commissions+=c.commission;const k=d.commTo||'غير محدد';byTo[k]=(byTo[k]||0)+c.commission}
  if(c.over)overs+=c.over;
 }
 const cash=deposits+cashSales-cashBuys;
 return {assetsCount:assets.length,soldCount,assetsValue,deposits,cashSales,cashBuys,cash,commissions,overs,byTo,dealsCount,total:assetsValue+cash};
}

// إجماليات كل العملاء
function dashboard(db){
 const t={clients:db.clients.length,assetsCount:0,assetsValue:0,cash:0,commissions:0,overs:0,dealsCount:0,byTo:{}};
 for(const c of db.clients){
  const x=clientTotals(db,c.id);
  t.assetsCount+=x.assetsCount;t.assetsValue+=x.assetsValue;t.cash+=x.cash;
  t.commissions+=x.commissions;t.overs+=x.overs;t.dealsCount+=x.dealsCount;
  for(const k in x.byTo)t.byTo[k]=(t.byTo[k]||0)+x.byTo[k];
 }
 t.total=t.assetsValue+t.cash;
 return t;
}

// عمولات/أوفر في فترة (من timestamp لـ timestamp)
function inRange(db,from,to){
 let comm=0,over=0;
 for(const d of db.deals){
  const t=d.dateTs||0;if(t<from||t>=to)continue;
  const c=dealCalc(d);if(c.commission)comm+=c.commission;if(c.over)over+=c.over;
 }
 return {comm,over};
}

return {dealCalc,clientTotals,dashboard,inRange};
})();
if(typeof module!=='undefined')module.exports=PMCalc;
