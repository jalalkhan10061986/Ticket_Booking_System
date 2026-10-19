let DB;
const ev=id=>DB.events.find(e=>e.id==id),cu=id=>DB.customers.find(c=>c.id==id);
const TODAY='2026-10-19',$=s=>document.querySelector(s),ST={};
const left=e=>e.cap-e.sold,avail=e=>{const l=left(e);return l<=0?'SoldOut':l/e.cap<.2?'Few':'Available'};
const badge=v=>`<span class="bd ${String(v).replace(/\s/g,'')}">${v}</span>`;
const toast=m=>{const t=$('#toast');t.textContent=m;t.style.display='block';setTimeout(()=>t.style.display='none',2200)};
function theme(){const r=document.documentElement,d=r.dataset.theme==='dark'||(!r.dataset.theme&&matchMedia('(prefers-color-scheme:dark)').matches);r.dataset.theme=d?'light':'dark'}

const evRows=()=>DB.events.map(e=>({...e,left:left(e),status:avail(e)}));
const bkRows=()=>DB.bookings.map(b=>{const e=ev(b.e);return{id:b.id,event:e.name,customer:cu(b.c).name,qty:b.qty,total:b.qty*e.price,date:b.date,status:b.status}});

const GRIDS={
 events:{rows:evRows,sort:'date',fk:'category',fo:['Concert','Sports','Theatre','Movie','Conference'],fk2:'status',fo2:['Available','Few','SoldOut'],size:6,
  cols:[['name','Event'],['category','Category'],['venue','Venue'],['date','Date'],['price','Price',r=>'$'+r.price],['left','Seats Left'],['status','Status',r=>badge(r.status)],['_','',r=>r.left>0?`<button class="btn g s" data-book="${r.id}">Book</button>`:'']]},
 bookings:{rows:bkRows,sort:'id',dir:-1,fk:'status',fo:['Confirmed','Pending','Cancelled'],fk2:'event',size:8,
  cols:[['id','ID',r=>'#'+r.id],['event','Event'],['customer','Customer'],['qty','Qty'],['total','Total',r=>'$'+r.total],['date','Date'],['status','Status',r=>badge(r.status)],['_','',r=>r.status==='Pending'?`<button class="btn g s" data-st="${r.id}|Confirmed">Confirm</button> <button class="btn r s" data-st="${r.id}|Cancelled">Cancel</button>`:r.status==='Confirmed'?`<button class="btn r s" data-st="${r.id}|Cancelled">Cancel</button>`:'']]},
 customers:{rows:()=>DB.customers.map(c=>({...c,bookings:DB.bookings.filter(b=>b.c==c.id).length})),sort:'name',fk:'tier',fo:['Gold','Silver','Bronze'],fk2:'city',size:6,
  cols:[['name','Name'],['email','Email'],['city','City'],['tier','Tier',r=>badge(r.tier)],['bookings','Bookings']]},
 low:{rows:()=>evRows().filter(r=>r.left/r.cap<.2),sort:'left',size:4,mini:1,
  cols:[['name','Event'],['venue','Venue'],['left','Left',r=>`<span class="bd ${r.left?'Few':'SoldOut'}">${r.left} ${r.left?'⚠ low':'sold out'}</span>`]]}
};

function grid(host,id){
 const C=GRIDS[id],s=ST[id]||(ST[id]={q:'',f:'',f2:'',k:C.sort,d:C.dir||1,p:1});
 const opts=(arr,v)=>arr.map(o=>`<option ${o===v?'selected':''}>${o}</option>`).join('');
 const f2o=C.fk2?(C.fo2||[...new Set(C.rows().map(r=>r[C.fk2]))].sort()):null;
 host.innerHTML=`<div class="tb"><input class="q" placeholder="Search…" value="${s.q}">${C.fo?`<select class="f"><option value="">All ${C.fk}</option>${opts(C.fo,s.f)}</select>`:''}${f2o?`<select class="f2"><option value="">All ${C.fk2}</option>${opts(f2o,s.f2)}</select>`:''}</div><div class="sc"></div><div class="pg"></div>`;
 const body=host.querySelector('.sc'),pg=host.querySelector('.pg');
 function draw(){
  let r=C.rows();const q=s.q.toLowerCase();
  if(q)r=r.filter(x=>Object.values(x).join(' ').toLowerCase().includes(q));
  if(s.f)r=r.filter(x=>x[C.fk]===s.f);if(s.f2)r=r.filter(x=>x[C.fk2]===s.f2);
  r.sort((a,b)=>{const x=a[s.k],y=b[s.k];return(typeof x==='number'?x-y:String(x).localeCompare(y))*s.d});
  const pages=Math.max(1,Math.ceil(r.length/C.size));s.p=Math.min(s.p,pages);
  const page=r.slice((s.p-1)*C.size,s.p*C.size);
  body.innerHTML=`<table><thead><tr>${C.cols.map(c=>`<th class="${c[0]!=='_'?'so':''}" data-k="${c[0]}">${c[1]}${s.k===c[0]?(s.d>0?' ▲':' ▼'):''}</th>`).join('')}</tr></thead><tbody>${page.map(x=>`<tr>${C.cols.map(c=>`<td>${c[2]?c[2](x):x[c[0]]}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="9" style="text-align:center;color:var(--mu)">No results</td></tr>`}</tbody></table>`;
  pg.innerHTML=`<span>${r.length?(s.p-1)*C.size+1:0}–${Math.min(s.p*C.size,r.length)} of ${r.length}</span><div><button data-p="${s.p-1}" ${s.p<2?'disabled':''}>‹ Prev</button>${Array.from({length:pages},(_,i)=>`<button data-p="${i+1}" class="${i+1===s.p?'on':''}">${i+1}</button>`).join('')}<button data-p="${s.p+1}" ${s.p>=pages?'disabled':''}>Next ›</button></div>`;
 }
 host.querySelector('.q').oninput=e=>{s.q=e.target.value;s.p=1;draw()};
 const f=host.querySelector('.f'),f2=host.querySelector('.f2');
 if(f)f.onchange=e=>{s.f=e.target.value;s.p=1;draw()};if(f2)f2.onchange=e=>{s.f2=e.target.value;s.p=1;draw()};
 body.onclick=e=>{const h=e.target.closest('th.so');if(h){const k=h.dataset.k;s.d=s.k===k?-s.d:1;s.k=k;draw()}};
 pg.onclick=e=>{const b=e.target.closest('button');if(b&&!b.disabled){s.p=+b.dataset.p;draw()}};
 draw();
}

const VIEWS={
 dashboard(v){
  const bk=DB.bookings,n=s=>bk.filter(b=>b.status===s).length;
  const days=[...Array(7)].map((_,i)=>{const d=new Date(Date.UTC(2026,9,19-6+i));return d.toISOString().slice(0,10)});
  const vals=days.map(d=>bk.filter(b=>b.date===d&&b.status!=='Cancelled').reduce((a,b)=>a+b.qty,0)),mx=Math.max(...vals,1);
  v.innerHTML=`<div class="cards">
  <div class="stat" style="background:var(--gr)"><div><big>${DB.events.length}</big><p>Total Events</p><small>${DB.customers.length} customers</small></div><div class="ic">🎫</div></div>
  <div class="stat" style="background:var(--bl)"><div><big>${n('Confirmed')}</big><p>Confirmed</p><small>${TODAY}</small></div><div class="ic">✅</div></div>
  <div class="stat" style="background:var(--rd)"><div><big>${n('Cancelled')}</big><p>Cancelled</p><small>${TODAY}</small></div><div class="ic">❌</div></div>
  <div class="stat" style="background:var(--or)"><div><big>${n('Pending')}</big><p>Pending</p><small>${TODAY}</small></div><div class="ic">⏰</div></div></div>
  <div class="panels"><div class="panel"><h3>Low availability (&lt;20%)</h3><div id="g1"></div></div>
  <div class="panel"><h3>Last 7 days – tickets booked</h3><div class="chart">${vals.map((x,i)=>`<div>${x}<i style="height:${x/mx*80}%"></i>${days[i].slice(5)}</div>`).join('')}</div></div></div>`;
  grid($('#g1'),'low');
 },
 events:v=>{v.innerHTML=`<div class="panel"><h3>Events</h3><div id="g"></div></div>`;grid($('#g'),'events')},
 bookings:v=>{v.innerHTML=`<div class="panel"><h3>Bookings</h3><div id="g"></div></div>`;grid($('#g'),'bookings')},
 customers:v=>{v.innerHTML=`<div class="panel"><h3>Customers</h3><div id="g"></div></div>`;grid($('#g'),'customers')},
 book(v,pre){
  v.innerHTML=`<div class="panel"><h3>Book a Ticket</h3><form class="f" id="bf">
  <label>Event<select id="be">${DB.events.filter(e=>left(e)>0).map(e=>`<option value="${e.id}" ${e.id==pre?'selected':''}>${e.name} – $${e.price} (${left(e)} left)</option>`).join('')}</select></label>
  <label>Customer<select id="bc">${DB.customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></label>
  <label>Quantity<input id="bq" type="number" min="1" max="10" value="1"></label>
  <div>Total: <span class="tot" id="bt"></span></div><button class="btn g" type="submit">Confirm Booking</button></form></div>`;
  const calc=()=>{const e=ev($('#be').value);$('#bt').textContent='$'+(e.price*(+$('#bq').value||0))};
  $('#be').onchange=$('#bq').oninput=calc;calc();
  $('#bf').onsubmit=x=>{x.preventDefault();const e=ev($('#be').value),q=+$('#bq').value;
   if(q<1||q>left(e))return toast('Only '+left(e)+' seats left');
   e.sold+=q;DB.bookings.push({id:1000+DB.bookings.length+1,e:e.id,c:+$('#bc').value,qty:q,status:'Confirmed',date:TODAY});
   toast('Booking confirmed!');go('bookings')}
 }
};
const NAV=[['dashboard','📊','Dashboard'],['events','🎭','Events'],['bookings','🎟️','Bookings'],['customers','👥','Customers'],['book','✚','Book Ticket']];
function go(p,arg){
 $('#nav').innerHTML=NAV.map(n=>`<a class="${n[0]===p?'on':''}" data-go="${n[0]}"><span>${n[1]}</span>${n[2]}</a>`).join('');
 VIEWS[p]($('#view'),arg);sb.classList.remove('open');
}
document.addEventListener('click',e=>{
 const g=e.target.closest('[data-go]'),b=e.target.closest('[data-book]'),s=e.target.closest('[data-st]');
 if(g)go(g.dataset.go);if(b)go('book',b.dataset.book);
 if(s){const[id,st]=s.dataset.st.split('|'),k=DB.bookings.find(x=>x.id==id);
  if(st==='Cancelled'&&k.status!=='Cancelled')ev(k.e).sold-=k.qty;k.status=st;toast('Booking '+st.toLowerCase());go('bookings')}
});
$('#gs').addEventListener('keydown',e=>{if(e.key==='Enter'){go('events');ST.events=Object.assign(ST.events||{f:'',f2:'',k:'date',d:1,p:1},{q:e.target.value,p:1});go('events')}});
fetch('data.json').then(r=>r.json()).then(d=>{DB=d;go('dashboard')}).catch(()=>{document.getElementById('view').innerHTML='<p>Could not load data.json. Open this folder through a local server, e.g. <code>python -m http.server</code>, then visit http://localhost:8000</p>'});
